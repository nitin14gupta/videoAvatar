import os
import logging
import asyncio
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.auth_routes import auth_router
from routes.avatar_routes import avatar_router
from routes.conversation_routes import conversation_router
from routes.whisper_routes import whisper_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Global initialization status
_initialization_status = {
    "whisper": False,
    "tts": False,
    "llm": False,
    "musetalk": False,
    "initializing": False
}

def initialize_services():
    """Initialize Whisper, TTS, and LLM on server startup"""
    global _initialization_status
    
    _initialization_status["initializing"] = True
    logger.info("Starting service initialization...")
    
    try:
        # Initialize Whisper
        logger.info("Initializing Whisper ASR...")
        from routes.whisper_routes import get_asr_instance
        get_asr_instance()
        _initialization_status["whisper"] = True
        logger.info("✓ Whisper initialized successfully")
    except Exception as e:
        logger.error(f"✗ Whisper initialization failed: {e}")
        _initialization_status["whisper"] = False
    
    try:
        # Initialize TTS
        logger.info("Initializing TTS (XTTS-v2)...")
        from utils.tts_utils import get_tts_instance
        get_tts_instance()
        _initialization_status["tts"] = True
        logger.info("✓ TTS initialized successfully")
    except Exception as e:
        logger.error(f"✗ TTS initialization failed: {e}")
        _initialization_status["tts"] = False
    
    try:
        # Initialize LLM (just verify it can be created)
        logger.info("Initializing LLM...")
        from utils.llm_utils import get_llm
        llm = get_llm()
        _initialization_status["llm"] = True
        logger.info("✓ LLM initialized successfully")
    except Exception as e:
        logger.error(f"✗ LLM initialization failed: {e}")
        _initialization_status["llm"] = False
    
    try:
        # Initialize MuseTalk for lip sync
        logger.info("Initializing MuseTalk...")
        from utils.musetalk_utils import initialize_musetalk
        initialize_musetalk(use_float16=True, gpu_id=0)
        _initialization_status["musetalk"] = True
        logger.info("✓ MuseTalk initialized successfully")
    except Exception as e:
        logger.error(f"✗ MuseTalk initialization failed: {e}")
        _initialization_status["musetalk"] = False
    
    _initialization_status["initializing"] = False
    logger.info("Service initialization complete!")


def create_app() -> FastAPI:
    app = FastAPI(title="Video Avatar API", version="1.0.0")
    
    # Enable CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register error handlers
    @app.exception_handler(Exception)
    async def handle_server_error(request: Request, exc: Exception):
        logger.error(f"Server error: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "An unexpected error occurred. Please try again."}
        )
    
    @app.get("/health")
    async def health():
        return {"status": "ok"}
    
    @app.get("/initialization-status")
    async def get_initialization_status():
        """Get initialization status of services"""
        return _initialization_status

    # Register routers
    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(avatar_router, prefix="/avatars", tags=["avatars"])
    app.include_router(conversation_router, prefix="/conversations", tags=["conversations"])
    app.include_router(whisper_router, prefix="/whisper", tags=["whisper"])
    
    # Initialize services on startup
    @app.on_event("startup")
    async def startup_event():
        logger.info("Starting application...")
        # Run initialization in background to not block startup
        asyncio.create_task(asyncio.to_thread(initialize_services))
    
    # Log app startup
    logger.info("Application started successfully")

    return app


if __name__ == "__main__":
    import uvicorn
    app = create_app()
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
