import os
import time
from fastapi import APIRouter, HTTPException, status, Depends, Header
from pydantic import BaseModel
from typing import Optional
from io import BytesIO
from utils.auth_utils import decode_jwt
from utils.llm_utils import get_llm
from utils.tts_utils import text_to_speech_with_voice_cloning
from utils.r2_client import r2_client
from db.config import get_supabase_client
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

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
    audio_url: Optional[str] = None


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
        
        # Add system prompt from avatar
        if avatar.get("template_prompt"):
            llm_messages.append(SystemMessage(content=avatar.get("template_prompt")))
        else:
            # Default system prompt
            default_prompt = f"You are {avatar.get('name')}, a {avatar.get('role_title')}. {avatar.get('description', '')}. Be conversational, friendly, and helpful."
            llm_messages.append(SystemMessage(content=default_prompt))
        
        # Add conversation history
        for msg in history:
            if msg.get("sender") == "user":
                llm_messages.append(HumanMessage(content=msg.get("content", "")))
            else:
                llm_messages.append(AIMessage(content=msg.get("content", "")))
        
        # Add current user message
        llm_messages.append(HumanMessage(content=request.message))
        
        # Get LLM response
        llm = get_llm(temperature=0.7)
        response = llm.invoke(llm_messages)
        avatar_response = response.content.strip()
        
        # Save user message
        user_msg_data = {
            "conversation_id": conversation_id,
            "sender": "user",
            "content": request.message,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        messages.insert(user_msg_data).execute()
        
        # Save avatar response
        avatar_msg_data = {
            "conversation_id": conversation_id,
            "sender": "avatar",
            "content": avatar_response,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        messages.insert(avatar_msg_data).execute()
        
        # Update conversation timestamp
        conversations.update({"updated_at": time.strftime("%Y-%m-%d %H:%M:%S")}).eq("id", conversation_id).execute()
        
        # Generate TTS audio with voice cloning
        audio_url = None
        try:
            if avatar.get("audio_url"):
                # Generate speech using avatar's reference audio
                tts_audio_path = text_to_speech_with_voice_cloning(
                    text=avatar_response,
                    reference_audio_url=avatar.get("audio_url"),
                    language=avatar.get("language", "en")
                )
                
                if tts_audio_path and os.path.exists(tts_audio_path):
                    # Upload to R2 storage
                    with open(tts_audio_path, 'rb') as f:
                        audio_bytes = BytesIO(f.read())
                        audio_bytes.seek(0)
                        
                        upload_result = r2_client.upload_file(
                            file_bytes=audio_bytes,
                            file_name="tts_output.wav",
                            folder="tts"
                        )
                        audio_url = upload_result.get("url")
                    
                    # Cleanup temp file
                    try:
                        os.remove(tts_audio_path)
                    except Exception:
                        pass
        except Exception as e:
            # Log error but don't fail the request
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to generate TTS audio: {e}")
        
        return {
            "conversation_id": conversation_id,
            "message": request.message,
            "avatar_response": avatar_response,
            "audio_url": audio_url
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

