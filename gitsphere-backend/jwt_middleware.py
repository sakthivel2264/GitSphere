import jwt
import datetime
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class JWTAuthMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        jwt_secret: str,
        jwt_algorithm: str = "HS256",
        refresh_threshold_minutes: int = 30,
        exclude_paths: list = None,
        exclude_all: bool = False  
    ):
        super().__init__(app)
        self.jwt_secret = jwt_secret
        self.jwt_algorithm = jwt_algorithm
        self.refresh_threshold_minutes = refresh_threshold_minutes
        self.exclude_paths = exclude_paths or []
        self.exclude_all = exclude_all

    async def dispatch(self, request: Request, call_next):
        # If exclude_all is True, skip authentication for all paths
        if self.exclude_all:
            return await call_next(request)
        
        # Check if path should be excluded
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Extract JWT token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"error": "Authorization header required"}
            )

        try:
            # Extract Bearer token
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                return JSONResponse(
                    status_code=401,
                    content={"error": "Invalid authentication scheme. Use Bearer token."}
                )

        except ValueError:
            return JSONResponse(
                status_code=401,
                content={"error": "Invalid authorization header format"}
            )

        # Validate and potentially refresh token
        token_result = await self.validate_and_refresh_token(token)
        
        if token_result["status"] == "invalid":
            return JSONResponse(
                status_code=401,
                content={"error": token_result["message"]}
            )

        # Add decoded payload to request state
        request.state.user = token_result["payload"]
        request.state.github_token = token_result["payload"].get("access_token")

        # Call the next middleware/endpoint
        response = await call_next(request)

        # If token was refreshed, add new token to response headers
        if token_result["status"] == "refreshed":
            response.headers["X-New-Token"] = token_result["new_token"]
            response.headers["X-Token-Refreshed"] = "true"

        return response

    async def validate_and_refresh_token(self, token: str) -> Dict[str, Any]:
        """
        Validate JWT token and refresh if needed
        """
        try:
            # Decode token without verification first to check expiration
            payload = jwt.decode(
                token, 
                self.jwt_secret, 
                algorithms=[self.jwt_algorithm],
                options={"verify_exp": False}  # Don't verify expiration yet
            )

            # Check if token is expired
            exp_timestamp = payload.get("exp")
            if not exp_timestamp:
                return {
                    "status": "invalid",
                    "message": "Token missing expiration"
                }

            exp_datetime = datetime.datetime.fromtimestamp(exp_timestamp)
            current_time = datetime.datetime.utcnow()

            # Token is completely expired
            if current_time > exp_datetime:
                logger.info("Token expired, attempting refresh")
                refresh_result = await self.refresh_token(payload)
                return refresh_result

            # Token is close to expiration (within threshold)
            time_until_expiry = exp_datetime - current_time
            if time_until_expiry.total_seconds() < (self.refresh_threshold_minutes * 60):
                logger.info("Token near expiration, refreshing proactively")
                refresh_result = await self.refresh_token(payload)
                return refresh_result

            # Token is valid and not near expiration
            # Now verify with expiration check
            jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            
            return {
                "status": "valid",
                "payload": payload
            }

        except jwt.ExpiredSignatureError:
            logger.info("Token signature expired")
            # Try to refresh if we can decode without verification
            try:
                payload = jwt.decode(
                    token, 
                    self.jwt_secret, 
                    algorithms=[self.jwt_algorithm],
                    options={"verify_exp": False}
                )
                refresh_result = await self.refresh_token(payload)
                return refresh_result
            except:
                return {
                    "status": "invalid",
                    "message": "Token expired and cannot be refreshed"
                }

        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {e}")
            return {
                "status": "invalid",
                "message": "Invalid token"
            }

    async def refresh_token(self, old_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Refresh the JWT token with GitHub token validation
        """
        try:
            github_token = old_payload.get("access_token")
            if not github_token:
                return {
                    "status": "invalid",
                    "message": "No GitHub token found in JWT"
                }

            # Validate GitHub token is still valid
            is_valid = await self.validate_github_token(github_token)
            if not is_valid:
                return {
                    "status": "invalid",
                    "message": "GitHub token is no longer valid"
                }

            # Create new JWT with extended expiration
            new_payload = {
                "access_token": github_token,
                "scopes": old_payload.get("scopes", []),
                "user_id": old_payload.get("user_id"),
                "iat": datetime.datetime.utcnow(),
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
                "type": "github_token",
                "refreshed_at": datetime.datetime.utcnow().isoformat()
            }

            new_token = jwt.encode(
                new_payload,
                self.jwt_secret,
                algorithm=self.jwt_algorithm
            )

            logger.info("Token successfully refreshed")
            return {
                "status": "refreshed",
                "payload": new_payload,
                "new_token": new_token
            }

        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            return {
                "status": "invalid",
                "message": "Token refresh failed"
            }

    async def validate_github_token(self, github_token: str) -> bool:
        """
        Validate that GitHub token is still active
        """
        import httpx
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"Bearer {github_token}"},
                    timeout=10.0
                )
                return response.status_code == 200
        except:
            return False
