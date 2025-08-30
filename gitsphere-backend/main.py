
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from routes import profile_analyzer, repository_analyzer, battle
from services.github_auth_service import GitHubAuthService
from models.github_auth_models import (
    GitHubAuthRequest, GitHubAuthResponse
)
import jwt
import datetime
from jwt_middleware import JWTAuthMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="GitHub Profile Battle Platform",
    description="AI-powered GitHub profile analysis, repository analysis, and battle system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
JWT_EXPIRATION_HOURS = 24 * 5
REFRESH_THRESHOLD_MINUTES = 30

app.add_middleware(
    JWTAuthMiddleware,
    jwt_secret=JWT_SECRET,
    jwt_algorithm=JWT_ALGORITHM,
    refresh_threshold_minutes=REFRESH_THRESHOLD_MINUTES,
    exclude_paths=[
        "/api/doc", "/api/redoc", "/openapi.json",
        "/api/auth/github", "/api/v1/health", "/api/auth/refresh",
        "/api/auth/login"
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-New-Token", "X-Token-Refreshed"]
)



# Include feature routes
app.include_router(
    profile_analyzer.router,
    prefix="/api/v1/profile-analyzer",
    tags=["Profile Analyzer"]
)

app.include_router(
    repository_analyzer.router,
    prefix="/api/v1/repository-analyzer", 
    tags=["Repository Analyzer"]
)

app.include_router(
    battle.router,
    prefix="/api/v1/battle",
    tags=["Profile Battle"]
)

# API Endpoints
@app.post("/api/auth/github", response_model=GitHubAuthResponse)
async def github_oauth_callback(auth_request: GitHubAuthRequest):
    try:
        
        result = await GitHubAuthService.exchange_code_for_token(auth_request.code)
        
        jwt_payload = {
            "access_token": result["access_token"],
            "scopes": result["scopes"],
            "iat": datetime.datetime.utcnow(),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
            "type": "github_token"
        }
        
        # Encrypt the access token into JWT
        encrypted_token = jwt.encode(
            jwt_payload, 
            JWT_SECRET, 
            algorithm=JWT_ALGORITHM
        )
        
        return GitHubAuthResponse(
            access_token=encrypted_token,
            scopes=result["scopes"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@app.post("/api/auth/refresh", response_model=GitHubAuthResponse)
async def refresh_token(old_token: str):
    try:
        token = await JWTAuthMiddleware.validate_and_refresh_token(
            self=JWTAuthMiddleware,
            token=old_token
        )
        if token["status"] == "refreshed":
            new_payload = token["payload"]
            new_token = token["new_token"]
            return GitHubAuthResponse(
                access_token=new_token,
                scopes=new_payload.get("scopes", [])
            )
        else:
            raise HTTPException(status_code=401, detail=token.get("message", "Token refresh failed"))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/auth/token/status")
async def check_token_status(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        exp = payload.get("exp")
        if not exp:
            raise HTTPException(status_code=400, detail="Invalid token: no expiration")

        exp_datetime = datetime.datetime.utcfromtimestamp(exp)
        now = datetime.datetime.utcnow()
        is_expired = now >= exp_datetime
        time_to_expiry = (exp_datetime - now).total_seconds() / 60 

        return {
            "valid": not is_expired,
            "expires_at": exp_datetime.isoformat(),
            "time_to_expiry_minutes": max(0, int(time_to_expiry))
        }
    except jwt.ExpiredSignatureError:
        return {
            "valid": False,
            "message": "Token has expired"
        }
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "features": ["profile-analyzer", "repository-analyzer", "profile-battle"],
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
