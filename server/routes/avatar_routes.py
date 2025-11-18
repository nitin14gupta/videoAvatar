import os
import time
from fastapi import APIRouter, HTTPException, status, Depends, Header, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from utils.auth_utils import decode_jwt
from utils.r2_client import r2_client
from utils.llm_utils import get_llm
from db.config import get_supabase_client
from io import BytesIO
from langchain_core.messages import HumanMessage

avatar_router = APIRouter()


# Pydantic models
class AvatarCreateRequest(BaseModel):
    name: str
    role_title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    language: str = "en"
    specialty: Optional[str] = None
    personality: Optional[str] = None
    template_prompt: Optional[str] = None
    theme_color: Optional[str] = None


class AvatarUpdateRequest(BaseModel):
    name: Optional[str] = None
    role_title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    language: Optional[str] = None
    specialty: Optional[str] = None
    personality: Optional[str] = None
    template_prompt: Optional[str] = None
    theme_color: Optional[str] = None
    active: Optional[bool] = None


class GeneratePromptRequest(BaseModel):
    role_title: str
    description: str
    specialty: Optional[str] = None


def get_current_user_id(authorization: str = Header(None)) -> Optional[str]:
    """Extract user ID from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    decoded = decode_jwt(token)
    
    if not decoded:
        return None
    
    # Return the subject (user ID) from the token
    return decoded.get("sub")


def _get_avatars_table():
    return get_supabase_client().table("avatars")


@avatar_router.get("/default")
async def get_default_avatars():
    """Get all active default avatars (created_by = 'system')"""
    try:
        avatars = _get_avatars_table()
        res = avatars.select("*").eq("created_by", "system").eq("active", True).order("created_at").execute()
        
        if not res.data:
            return {"avatars": []}
        
        return {"avatars": res.data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch default avatars: {str(e)}"
        )


@avatar_router.get("/my-avatars")
async def get_my_avatars(user_id: Optional[str] = Depends(get_current_user_id)):
    """Get all avatars created by the current user"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        avatars = _get_avatars_table()
        res = avatars.select("*").eq("created_by", user_id).order("created_at", desc=False).execute()
        # Reverse the list to show newest first
        if res.data:
            res.data.reverse()
        
        if not res.data:
            return {"avatars": []}
        
        return {"avatars": res.data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user avatars: {str(e)}"
        )


@avatar_router.get("/{avatar_id}")
async def get_avatar_by_id(avatar_id: str):
    """Get a specific avatar by ID"""
    try:
        avatars = _get_avatars_table()
        res = avatars.select("*").eq("id", avatar_id).limit(1).execute()
        
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avatar not found"
            )
        
        return {"avatar": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch avatar: {str(e)}"
        )


@avatar_router.post("/create")
async def create_avatar(
    request: AvatarCreateRequest,
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Create a new avatar (user-created)"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        avatars = _get_avatars_table()
        avatar_data = {
            "name": request.name.strip(),
            "role_title": request.role_title.strip(),
            "description": request.description.strip() if request.description else None,
            "image_url": request.image_url or "",
            "audio_url": request.audio_url or None,
            "language": request.language,
            "specialty": request.specialty.strip() if request.specialty else None,
            "personality": request.personality.strip() if request.personality else None,
            "template_prompt": request.template_prompt.strip() if request.template_prompt else None,
            "theme_color": request.theme_color or None,
            "active": True,
            "created_by": user_id,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        res = avatars.insert(avatar_data).execute()
        
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create avatar"
            )
        
        return {"avatar": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create avatar: {str(e)}"
        )


@avatar_router.put("/{avatar_id}")
async def update_avatar(
    avatar_id: str,
    request: AvatarUpdateRequest,
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Update an avatar (only if user owns it)"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        avatars = _get_avatars_table()
        
        # Check if avatar exists and user owns it
        check = avatars.select("created_by").eq("id", avatar_id).limit(1).execute()
        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avatar not found"
            )
        
        if check.data[0].get("created_by") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this avatar"
            )
        
        # Build update data
        update_data = {"updated_at": time.strftime("%Y-%m-%d %H:%M:%S")}
        if request.name is not None:
            update_data["name"] = request.name.strip()
        if request.role_title is not None:
            update_data["role_title"] = request.role_title.strip()
        if request.description is not None:
            update_data["description"] = request.description.strip() if request.description else None
        if request.image_url is not None:
            update_data["image_url"] = request.image_url
        if request.audio_url is not None:
            update_data["audio_url"] = request.audio_url
        if request.language is not None:
            update_data["language"] = request.language
        if request.specialty is not None:
            update_data["specialty"] = request.specialty.strip() if request.specialty else None
        if request.personality is not None:
            update_data["personality"] = request.personality.strip() if request.personality else None
        if request.template_prompt is not None:
            update_data["template_prompt"] = request.template_prompt.strip() if request.template_prompt else None
        if request.theme_color is not None:
            update_data["theme_color"] = request.theme_color
        if request.active is not None:
            update_data["active"] = request.active
        
        res = avatars.update(update_data).eq("id", avatar_id).execute()
        
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update avatar"
            )
        
        return {"avatar": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update avatar: {str(e)}"
        )


@avatar_router.delete("/{avatar_id}")
async def delete_avatar(
    avatar_id: str,
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Delete an avatar (only if user owns it)"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        avatars = _get_avatars_table()
        
        # Check if avatar exists and user owns it
        check = avatars.select("created_by,image_url,audio_url").eq("id", avatar_id).limit(1).execute()
        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avatar not found"
            )
        
        avatar = check.data[0]
        if avatar.get("created_by") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this avatar"
            )
        
        # Delete files from R2 if they exist
        if avatar.get("image_url"):
            try:
                # Extract path from URL if it's an R2 URL
                image_path = avatar.get("image_url")
                if "avatars/" in image_path:
                    r2_client.delete_file(image_path.split("avatars/")[-1])
            except:
                pass  # Best effort
        
        if avatar.get("audio_url"):
            try:
                audio_path = avatar.get("audio_url")
                if "voices/" in audio_path:
                    r2_client.delete_file(audio_path.split("voices/")[-1])
            except:
                pass  # Best effort
        
        # Delete avatar from database
        avatars.delete().eq("id", avatar_id).execute()
        
        return {"ok": True, "message": "Avatar deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete avatar: {str(e)}"
        )


@avatar_router.post("/upload-image")
async def upload_avatar_image(
    file: UploadFile = File(...),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Upload an avatar image to R2"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        file_bytes = BytesIO(file_content)
        
        # Upload to R2
        result = r2_client.upload_file(file_bytes, file.filename, folder="avatars")
        
        return {
            "url": result["url"],
            "filename": result["filename"],
            "path": result["path"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@avatar_router.post("/upload-audio")
async def upload_avatar_audio(
    file: UploadFile = File(...),
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Upload an avatar audio/voice to R2"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        file_bytes = BytesIO(file_content)
        
        # Upload to R2
        result = r2_client.upload_file(file_bytes, file.filename, folder="voices")
        
        return {
            "url": result["url"],
            "filename": result["filename"],
            "path": result["path"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload audio: {str(e)}"
        )


@avatar_router.post("/generate-prompt")
async def generate_template_prompt(
    request: GeneratePromptRequest,
    user_id: Optional[str] = Depends(get_current_user_id)
):
    """Generate a template prompt using AI based on role and description"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        llm = get_llm(temperature=0.7)
        
        prompt_text = f"""Create a concise and effective system prompt for an AI conversational avatar with the following details:

Role Title: {request.role_title}
Description: {request.description}
{f"Specialty: {request.specialty}" if request.specialty else ""}

The prompt should:
1. Define the avatar's role and expertise clearly
2. Set the tone and personality (professional, friendly, etc.)
3. Guide how the avatar should respond to users
4. Be concise (2-3 sentences maximum)
5. Focus on being helpful, accurate, and engaging

Generate only the prompt text, no additional explanation:"""
        
        messages = [HumanMessage(content=prompt_text)]
        response = llm.invoke(messages)
        
        generated_prompt = response.content.strip()
        
        return {"prompt": generated_prompt}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate prompt: {str(e)}"
        )

