import os
import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.auth_routes import auth_router
from routes.avatar_routes import avatar_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

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

    # Register routers
    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(avatar_router, prefix="/avatars", tags=["avatars"])
    
    # Log app startup
    logger.info("Application started successfully")

    return app


if __name__ == "__main__":
    import uvicorn
    app = create_app()
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
