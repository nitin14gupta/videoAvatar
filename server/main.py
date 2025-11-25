import os
import logging
import asyncio
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.auth_routes import auth_router
from routes.avatar_routes import avatar_router
from routes.conversation_routes import conversation_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Global initialization status
_initialization_status = {
    "tts": False,
    "llm": False,
    "initializing": False
}

def initialize_services():
    """Initialize TTS, LLM, and LivePortrait on server startup (Speech recognition is handled client-side with Web Speech API)"""
    global _initialization_status
    
    _initialization_status["initializing"] = True
    logger.info("Starting service initialization...")
    
    try:
        # Initialize TTS
        logger.info("Initializing TTS (XTTS-v2)...")
        from utils.tts_utils import get_tts_instance
        get_tts_instance()
        _initialization_status["tts"] = True
        logger.info("✓ TTS initialized successfully")
    except Exception as e:
        logger.error(f"✗ TTS initialization failed: {e}")
        logger.error(f"TTS error details: {type(e).__name__}: {str(e)}")
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
        # Initialize LivePortrait (verify it's accessible)
        logger.info("Initializing LivePortrait...")
        from utils.liveportrait_utils import get_liveportrait_path
        liveportrait_path = get_liveportrait_path()
        if liveportrait_path:
            logger.info(f"✓ LivePortrait found at: {liveportrait_path}")
        else:
            logger.warning("⚠ LivePortrait repository not found - blinking animations may not work")
    except Exception as e:
        logger.warning(f"⚠ LivePortrait check failed: {e}")
    
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
    
    # Serve static files (blinking.mp4, etc.)
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    if os.path.exists(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
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
