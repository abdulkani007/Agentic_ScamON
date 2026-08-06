import logging
import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .routes import router as website_router
from .utils import setup_logging

# Initialize logging config
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ScamShield AI - Website & QR Verification Agent",
    description="FastAPI service for Agent 4 (Website & QR Verification Agent) of the ScamShield AI cybersecurity platform.",
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

# Mount static files folder
static_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../static"))
os.makedirs(static_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")


# Register routes router
app.include_router(website_router)

# Register Email Investigation Agent router
from agents.email.routes import router as email_router
app.include_router(email_router)

# Register Explainability (XAI) Agent router
from agents.xai.routes import router as xai_router
app.include_router(xai_router)

# Register Evidence Vault Agent router
from agents.evidence_vault.routes import router as evidence_vault_router
app.include_router(evidence_vault_router)

# Register SMS Agent router
from agents.sms_agent_routes import router as sms_router
app.include_router(sms_router)

# Register Visual Scam Investigation Agent router
from agents.visual_scam import visual_scam_router
app.include_router(visual_scam_router)

# Register Master Copilot Agent router
from agents.copilot_routes import router as copilot_router
app.include_router(copilot_router)



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


# Global Exception Handlers
@app.exception_handler(ValueError)
async def value_error_handler(
    request: Request, exc: ValueError
) -> JSONResponse:
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
    logger.error(
        f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please contact system support."},
    )


@app.get("/", tags=["Health Check"])
async def health_check() -> dict:
    """Root health check endpoint to verify service availability."""
    return {
        "status": "success",
        "service": "ScamShield AI - Website & QR Verification Agent",
        "environment": settings.APP_ENV,
    }


if __name__ == "__main__":
    import uvicorn

    # Allows running the agent directly using python -m agents.website_agent.main
    uvicorn.run(
        "agents.website_agent.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.APP_ENV == "development",
    )
