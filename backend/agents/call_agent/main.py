import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from .config import settings
from .routes import router as call_agent_router
from .utils import setup_logging

from fastapi.middleware.cors import CORSMiddleware

# Initialize structured logging based on configuration
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ScamShield AI - Call Analysis Agent",
    description="FastAPI production backend service for Agent 1 (Call Analysis Agent) of the ScamShield AI cybersecurity platform.",
    version="0.1.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to extract X-Case-ID header and populate contextvar
from agents.evidence_vault.agent import active_case_id_context

@app.middleware("http")
async def extract_case_id_header(request: Request, call_next):
    case_id = request.headers.get("X-Case-ID") or ""
    token = active_case_id_context.set(case_id)
    try:
        response = await call_next(request)
        return response
    finally:
        active_case_id_context.reset(token)

# Register endpoints router
app.include_router(call_agent_router)


@app.on_event("startup")
async def verify_db_connection():
    try:
        from database import get_db_client
        client = get_db_client()
        if client is None:
            logger.error("❌ MongoDB Atlas connection verification failed. Operating in offline/mock mode.")
        else:
            logger.info("✅ MongoDB Atlas connection verified on startup.")
    except Exception as err:
        logger.error(f"❌ Exception verifying MongoDB Atlas connection: {err}")


# Global Exception Handlers for Production Readiness
@app.exception_handler(ValueError)
async def value_error_handler(
    request: Request, exc: ValueError
) -> JSONResponse:
    """Handles Pydantic or custom ValueError instances, returning a 400 Bad Request."""
    logger.warning(
        f"Validation error on request to {request.url.path}: {str(exc)}"
    )
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.exception_handler(RuntimeError)
async def runtime_error_handler(
    request: Request, exc: RuntimeError
) -> JSONResponse:
    """Handles operational RuntimeError instances, returning a 500 Internal Server Error."""
    logger.error(
        f"Processing runtime error on {request.url.path}: {str(exc)}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Operational processing error: {str(exc)}"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Fallback handler for unhandled exceptions, returning a 500 Internal Server Error."""
    logger.error(
        f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please contact system support."},
    )


@app.get("/", tags=["Health"])
async def health_check() -> dict:
    """Root health check endpoint to verify service availability."""
    return {
        "status": "success",
        "service": "ScamShield AI - Call Analysis Agent",
        "environment": settings.APP_ENV,
    }


if __name__ == "__main__":
    import uvicorn

    # Allows running the agent directly using python -m agents.call_agent.main
    uvicorn.run(
        "agents.call_agent.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.APP_ENV == "development",
    )

