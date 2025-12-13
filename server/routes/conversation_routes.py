import os
import time
import asyncio
import base64
import logging
import re
from fastapi import APIRouter, HTTPException, status, Depends, Header, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional
from utils.auth_utils import decode_jwt
from utils.llm_utils import get_llm
from utils.tts_utils import text_to_speech_with_voice_cloning_bytes
from utils.streaming_tts import TTSQueue, generate_tts_async
from db.config import get_supabase_client
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

logger = logging.getLogger(__name__)

conversation_router = APIRouter()


# Pydantic models
class ConversationRequest(BaseModel):
    avatar_id: str
    message: str
    conversation_id: Optional[str] = None


class ConversationResponse(BaseModel):
    conversation_id: str
    message: str
    avatar_response: str
    audio_data: Optional[str] = None  # Base64 encoded audio


def get_current_user_id(authorization: str = Header(None)) -> Optional[str]:
    """Extract user ID from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    decoded = decode_jwt(token)
    
    if not decoded:
        return None
    
    return decoded.get("sub")


def _get_conversations_table():
    return get_supabase_client().table("conversations")


def _get_messages_table():
    return get_supabase_client().table("messages")


def _get_avatars_table():
    return get_supabase_client().table("avatars")


def split_into_chunks(text: str, min_chunk_size: int = 10, max_chunk_size: int = 30) -> list:
    """
    Split text into chunks for TTS generation.
    Tries to split at sentence boundaries, falls back to word boundaries.
    """
    # First, try to split by sentences
    sentences = re.split(r'([.!?]\s+)', text)
    chunks = []
    current_chunk = ""
    
    for part in sentences:
        if not part.strip():
            continue
        
        # If adding this part would exceed max_chunk_size, save current chunk
        if current_chunk and len((current_chunk + part).split()) > max_chunk_size:
            if len(current_chunk.split()) >= min_chunk_size:
                chunks.append(current_chunk.strip())
                current_chunk = part
            else:
                # If current chunk is too small, add to it anyway
                current_chunk += part
        else:
            current_chunk += part
        
        # If current chunk has enough words, save it
        if len(current_chunk.split()) >= min_chunk_size:
            chunks.append(current_chunk.strip())
            current_chunk = ""
    
    # Add remaining chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks if chunks else [text]


@conversation_router.websocket("/chat/stream")
async def chat_with_avatar_stream(websocket: WebSocket):
    """WebSocket endpoint for streaming chat with TTS chunks"""
    await websocket.accept()
    
    try:
        # Get parameters from query string
        query_params = dict(websocket.query_params)
        avatar_id = query_params.get("avatar_id", "")
        message = query_params.get("message", "")
        conversation_id = query_params.get("conversation_id")
        
        if not avatar_id or not message:
            await websocket.send_json({"type": "error", "message": "avatar_id and message are required"})
            await websocket.close()
            return
        
        # Get user ID from token (sent as first message)
        auth_data = await websocket.receive_json()
        token = auth_data.get("token", "")
        
        user_id = None
        if token:
            decoded = decode_jwt(token.replace("Bearer ", ""))
            if decoded:
                user_id = decoded.get("sub")
        
        if not user_id:
            await websocket.send_json({"type": "error", "message": "Authentication required"})
            await websocket.close()
            return
        
        # Get avatar details
        avatars = _get_avatars_table()
        avatar_res = avatars.select("*").eq("id", avatar_id).limit(1).execute()
        
        if not avatar_res.data:
            await websocket.send_json({"type": "error", "message": "Avatar not found"})
            await websocket.close()
            return
        
        avatar = avatar_res.data[0]
        
        # Get or create conversation
        conversations = _get_conversations_table()
        if conversation_id:
            conv_res = conversations.select("*").eq("id", conversation_id).eq("user_id", user_id).limit(1).execute()
            if not conv_res.data:
                await websocket.send_json({"type": "error", "message": "Conversation not found"})
                await websocket.close()
                return
            conv_id = conversation_id
        else:
            conv_data = {
                "user_id": user_id,
                "avatar_id": avatar_id,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            conv_res = conversations.insert(conv_data).execute()
            if not conv_res.data:
                await websocket.send_json({"type": "error", "message": "Failed to create conversation"})
                await websocket.close()
                return
            conv_id = conv_res.data[0].get("id")
            await websocket.send_json({"type": "conversation_id", "conversation_id": conv_id})
        
        # Get conversation history
        messages = _get_messages_table()
        history_res = messages.select("*").eq("conversation_id", conv_id).order("created_at", desc=False).limit(10).execute()
        history = history_res.data or []
        
        # Build LLM messages
        llm_messages = []
        tts_instruction = "CRITICAL INSTRUCTION: Your response will be converted directly to speech. You MUST generate ONLY plain text with no formatting whatsoever. DO NOT use: markdown, asterisks, underscores, code blocks, URLs, special symbols, or any formatting. IMPORTANT: You MUST end each sentence with a full stop (period). Use full stops to separate sentences. Write exactly as you would speak - natural, conversational plain text with proper sentence endings using full stops."
        
        if avatar.get("template_prompt"):
            system_prompt = f"{avatar.get('template_prompt')}\n\n{tts_instruction}"
            llm_messages.append(SystemMessage(content=system_prompt))
        else:
            default_prompt = f"You are {avatar.get('name')}, a {avatar.get('role_title')}. {avatar.get('description', '')}. Be conversational, friendly, and helpful.\n\n{tts_instruction}"
            llm_messages.append(SystemMessage(content=default_prompt))
        
        for msg in history:
            if msg.get("sender") == "user":
                llm_messages.append(HumanMessage(content=msg.get("content", "")))
            else:
                llm_messages.append(AIMessage(content=msg.get("content", "")))
        
        llm_messages.append(HumanMessage(content=message))
        
        # Save user message to DB
        user_msg_data = {
            "conversation_id": conv_id,
            "sender": "user",
            "content": message,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        messages.insert(user_msg_data).execute()
        
        # Stream LLM response with optimized TTS pipeline
        llm = get_llm(temperature=0.7)
        full_response = ""
        text_buffer = ""
        chunk_id_counter = 0
        
        # Initialize TTS queue for parallel generation
        tts_queue = TTSQueue() if avatar.get("audio_url") else None
        
        # Background task to send TTS chunks as they complete
        send_tts_chunks_active = {"active": True}
        async def send_tts_chunks():
            """Continuously send TTS chunks as they become available"""
            if not tts_queue:
                return
            
            logger.info("Started TTS chunk sender background task")
            chunk_count = 0
            while send_tts_chunks_active["active"]:
                try:
                    chunk = await tts_queue.wait_for_chunk(timeout=0.5)
                    if chunk:
                        audio_bytes = chunk.get("audio")
                        text = chunk.get("text", "")
                        if audio_bytes:
                            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                            await websocket.send_json({
                                "type": "audio_chunk",
                                "text": text,
                                "audio": audio_base64
                            })
                            chunk_count += 1
                            logger.info(f"Sent audio chunk {chunk_count}: {text[:30]}...")
                    else:
                        # No chunks available, check if we should continue
                        await asyncio.sleep(0.1)
                except asyncio.CancelledError:
                    logger.info("TTS chunk sender task cancelled")
                    break
                except Exception as e:
                    logger.error(f"Error in send_tts_chunks: {e}", exc_info=True)
                    # Don't break on error, keep trying
                    await asyncio.sleep(0.1)
            
            logger.info(f"TTS chunk sender task finished. Sent {chunk_count} chunks total")
        
        # Start TTS chunk sender in background
        tts_sender_task = None
        if tts_queue:
            tts_sender_task = asyncio.create_task(send_tts_chunks())
        
        # Stream LLM tokens and generate TTS chunks directly
        async for chunk in llm.astream(llm_messages):
            if chunk.content:
                text_buffer += chunk.content
                full_response += chunk.content
                
                # Send text chunk to frontend immediately
                await websocket.send_json({
                    "type": "text_chunk",
                    "text": chunk.content
                })
                
                # Split text buffer by sentences (period followed by space or end of string)
                # Generate TTS for complete sentences
                while text_buffer.strip():
                    # Find sentence boundaries (period followed by space or end)
                    period_idx = text_buffer.find('. ')
                    if period_idx == -1:
                        # Check if buffer ends with period
                        if text_buffer.strip().endswith('.'):
                            period_idx = len(text_buffer) - 1
                        else:
                            # No complete sentence yet, wait for more tokens
                            break
                    
                    # Extract sentence (including the period)
                    sentence = text_buffer[:period_idx + 1].strip()
                    remaining = text_buffer[period_idx + 1:].lstrip()
                    
                    if sentence and len(sentence) >= 3:
                        # Start TTS generation for this sentence immediately (non-blocking)
                        if tts_queue and avatar.get("audio_url"):
                            chunk_id = chunk_id_counter
                            chunk_id_counter += 1
                            await tts_queue.add_tts_task(
                                text=sentence,
                                reference_audio_url=avatar.get("audio_url"),
                                language=avatar.get("language", "en"),
                                chunk_id=chunk_id
                            )
                            logger.debug(f"Started TTS for sentence: {sentence[:50]}...")
                        
                        # Update buffer
                        text_buffer = remaining
                    else:
                        # Sentence too short, wait for more tokens
                        break
        
        # Process any remaining text in buffer
        if text_buffer.strip():
            remaining_text = text_buffer.strip()
            # Only process if it's substantial enough
            if len(remaining_text) >= 3 and tts_queue and avatar.get("audio_url"):
                chunk_id = chunk_id_counter
                await tts_queue.add_tts_task(
                    text=remaining_text,
                    reference_audio_url=avatar.get("audio_url"),
                    language=avatar.get("language", "en"),
                    chunk_id=chunk_id
                )
                logger.debug(f"Started TTS for remaining text: {remaining_text[:50]}...")
        
        # Wait for all TTS tasks to complete
        if tts_queue:
            logger.info("Waiting for all TTS tasks to complete...")
            # Wait for all tasks to complete (all chunks generated)
            await tts_queue.wait_all()
            logger.info("All TTS tasks completed - all chunks should be in queue now")
            
            # Keep background sender running and wait for it to send all chunks
            # Give it time to process all chunks in the queue
            max_wait_time = 15.0  # Maximum time to wait for chunks to be sent
            wait_start = asyncio.get_event_loop().time()
            queue_size = tts_queue.get_queue_size()
            logger.info(f"Queue has {queue_size} chunks waiting to be sent")
            
            # Wait until queue is empty or timeout
            while not tts_queue.is_queue_empty():
                elapsed = asyncio.get_event_loop().time() - wait_start
                if elapsed > max_wait_time:
                    remaining = tts_queue.get_queue_size()
                    logger.warning(f"Timeout waiting for chunks to be sent after {max_wait_time}s. {remaining} chunks still in queue")
                    break
                await asyncio.sleep(0.2)
            
            # Give background sender a final moment to send any chunks it's processing
            await asyncio.sleep(0.5)
            
            # Send any remaining chunks manually (in case background task missed them)
            remaining_chunks = 0
            max_remaining_attempts = 20  # Prevent infinite loop
            attempts = 0
            while not tts_queue.is_queue_empty() and attempts < max_remaining_attempts:
                chunk = await tts_queue.wait_for_chunk(timeout=0.2)
                if chunk:
                    audio_bytes = chunk.get("audio")
                    text = chunk.get("text", "")
                    if audio_bytes:
                        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                        await websocket.send_json({
                            "type": "audio_chunk",
                            "text": text,
                            "audio": audio_base64
                        })
                        remaining_chunks += 1
                        logger.info(f"Sent remaining audio chunk {remaining_chunks}: {text[:30]}...")
                attempts += 1
            
            # Stop the background sender task
            send_tts_chunks_active["active"] = False
            if tts_sender_task:
                # Give it a moment to finish its current iteration
                await asyncio.sleep(0.5)
                tts_sender_task.cancel()
                try:
                    await tts_sender_task
                except asyncio.CancelledError:
                    pass
            
            logger.info(f"Finished processing TTS. Sent {remaining_chunks} remaining chunks manually")
        
        # Save full avatar response to DB
        avatar_msg_data = {
            "conversation_id": conv_id,
            "sender": "avatar",
            "content": full_response.strip(),
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        messages.insert(avatar_msg_data).execute()
        
        # Update conversation timestamp
        conversations.update({"updated_at": time.strftime("%Y-%m-%d %H:%M:%S")}).eq("id", conv_id).execute()
        
        # Send completion signal
        await websocket.send_json({
            "type": "complete",
            "full_response": full_response.strip(),
            "conversation_id": conv_id
        })
        
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in streaming chat: {e}", exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass


@conversation_router.post("/chat")
async def chat_with_avatar(
    request: ConversationRequest,
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Send a message to an avatar and get LLM response"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        # Get avatar details
        avatars = _get_avatars_table()
        avatar_res = avatars.select("*").eq("id", request.avatar_id).limit(1).execute()
        
        if not avatar_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avatar not found"
            )
        
        avatar = avatar_res.data[0]
        
        # Get or create conversation
        conversations = _get_conversations_table()
        if request.conversation_id:
            conv_res = conversations.select("*").eq("id", request.conversation_id).eq("user_id", user_id).limit(1).execute()
            if not conv_res.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
            conversation_id = request.conversation_id
        else:
            # Create new conversation
            conv_data = {
                "user_id": user_id,
                "avatar_id": request.avatar_id,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            conv_res = conversations.insert(conv_data).execute()
            if not conv_res.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create conversation"
                )
            conversation_id = conv_res.data[0].get("id")
        
        # Get conversation history for context
        messages = _get_messages_table()
        history_res = messages.select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).limit(10).execute()
        history = history_res.data or []
        
        # Build LLM messages with system prompt
        llm_messages = []
        tts_instruction = "CRITICAL INSTRUCTION: Your response will be converted directly to speech. You MUST generate ONLY plain text with no formatting whatsoever. DO NOT use: markdown, asterisks, underscores, code blocks, URLs, special symbols, or any formatting. IMPORTANT: You MUST end each sentence with a full stop (period). Use full stops to separate sentences. Write exactly as you would speak - natural, conversational plain text with proper sentence endings using full stops."
        
        # Add system prompt from avatar
        if avatar.get("template_prompt"):
            system_prompt = f"{avatar.get('template_prompt')}\n\n{tts_instruction}"
            llm_messages.append(SystemMessage(content=system_prompt))
        else:
            # Default system prompt
            default_prompt = f"You are {avatar.get('name')}, a {avatar.get('role_title')}. {avatar.get('description', '')}. Be conversational, friendly, and helpful.\n\n{tts_instruction}"
            llm_messages.append(SystemMessage(content=default_prompt))
        
        # Add conversation history
        for msg in history:
            if msg.get("sender") == "user":
                llm_messages.append(HumanMessage(content=msg.get("content", "")))
            else:
                llm_messages.append(AIMessage(content=msg.get("content", "")))
        
        # Add current user message
        llm_messages.append(HumanMessage(content=request.message))
        
        # Prepare user message data for DB
        user_msg_data = {
            "conversation_id": conversation_id,
            "sender": "user",
            "content": request.message,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Run LLM and DB save in parallel
        def get_llm_response():
            """Get LLM response"""
            llm = get_llm(temperature=0.7)
            response = llm.invoke(llm_messages)
            return response.content.strip()
        
        def save_user_message():
            """Save user message to DB"""
            messages.insert(user_msg_data).execute()
        
        # Execute LLM and DB save simultaneously
        avatar_response, _ = await asyncio.gather(
            asyncio.to_thread(get_llm_response),
            asyncio.to_thread(save_user_message)
        )
        
        # Generate TTS audio directly (no R2 upload)
        audio_data_base64 = None
        try:
            if avatar.get("audio_url"):
                # Generate speech and get bytes directly
                audio_bytes = text_to_speech_with_voice_cloning_bytes(
                    text=avatar_response,
                    reference_audio_url=avatar.get("audio_url"),
                    language=avatar.get("language", "en")
                )
                
                if audio_bytes:
                    # Convert to base64 for JSON response
                    audio_data_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        except Exception as e:
            # Log error but don't fail the request
            logger.error(f"Failed to generate TTS audio: {e}")
        
        # Save avatar response to DB (after TTS generation to save time)
        avatar_msg_data = {
            "conversation_id": conversation_id,
            "sender": "avatar",
            "content": avatar_response,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        messages.insert(avatar_msg_data).execute()
        
        # Update conversation timestamp
        conversations.update({"updated_at": time.strftime("%Y-%m-%d %H:%M:%S")}).eq("id", conversation_id).execute()
        
        return {
            "conversation_id": conversation_id,
            "message": request.message,
            "avatar_response": avatar_response,
            "audio_data": audio_data_base64
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process conversation: {str(e)}"
        )


@conversation_router.get("/conversations")
async def get_conversations(
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Get all conversations for the current user"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        conversations = _get_conversations_table()
        res = conversations.select("*, avatars(name, image_url)").eq("user_id", user_id).order("updated_at", desc=True).execute()
        
        return {"conversations": res.data or []}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversations: {str(e)}"
        )


@conversation_router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Get all messages in a conversation"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        # Verify conversation belongs to user
        conversations = _get_conversations_table()
        conv_res = conversations.select("id").eq("id", conversation_id).eq("user_id", user_id).limit(1).execute()
        
        if not conv_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        messages = _get_messages_table()
        res = messages.select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
        
        return {"messages": res.data or []}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch messages: {str(e)}"
        )

