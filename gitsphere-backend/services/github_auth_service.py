import httpx
import logging
from fastapi import HTTPException
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

class GitHubAuthService:
    """Service class for GitHub OAuth operations"""
    
    @staticmethod
    async def exchange_code_for_token(code: str) -> dict:
        """
        Exchange GitHub authorization code for access token
        
        Args:
            code: GitHub authorization code
            
        Returns:
            dict: Contains access_token and scopes
            
        Raises:
            HTTPException: If authentication fails or token is invalid
        """
        if not code:
            raise HTTPException(status_code=400, detail="Authorization code is required")

        if not CLIENT_ID or not CLIENT_SECRET:
            raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

        async with httpx.AsyncClient() as client:
            # Exchange authorization code for access token
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                json={
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "code": code,
                }
            )

            token_data = token_response.json()

            if "error" in token_data:
                error_msg = token_data.get("error_description", token_data.get("error"))
                raise HTTPException(status_code=400, detail=error_msg)

            if "access_token" not in token_data:
                raise HTTPException(status_code=400, detail="No access token received")

            access_token = token_data["access_token"]

            # Verify the token and get scopes
            user_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                }
            )

            if user_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid token received")

            # Get token scopes from response headers
            scopes_header = user_response.headers.get("x-oauth-scopes", "")
            scopes = [scope.strip() for scope in scopes_header.split(",") if scope.strip()]

            # Check required scopes
            required_scopes = ["public_repo", "read:user"]
            has_required_scopes = all(
                required in scopes or (required == "public_repo" and "repo" in scopes)
                for required in required_scopes
            )

            if not has_required_scopes:
                raise HTTPException(
                    status_code=400,
                    detail="Token missing required scopes: public_repo, read:user"
                )

            return {
                "access_token": access_token,
                "scopes": scopes
            }


