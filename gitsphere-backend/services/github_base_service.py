import httpx
import logging
from typing import Dict, Optional, Any
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class GitHubBaseService:
    def __init__(self):
        self.api_url = "https://api.github.com"
        self.default_headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Profile-Battle/1.0"
        }

    async def _make_request(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to GitHub API with error handling and dynamic token"""
        
        headers = self.default_headers.copy()
        if token:
            headers["Authorization"] = f"Bearer {token}" 
        
        logger.info(f"Making request to: {url}")
        logger.debug(f"Headers: {headers}")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params, timeout=30.0)
                logger.info(f"Response status: {response.status_code}")
                
                if response.status_code == 404:
                    logger.error(f"Resource not found: {url}")
                    raise HTTPException(status_code=404, detail="Resource not found")
                elif response.status_code == 403:
                    logger.error(f"Rate limit exceeded or access denied: {url}")
                    raise HTTPException(status_code=403, detail="Rate limit exceeded or access denied")
                elif not response.is_success:
                    logger.error(f"GitHub API Error: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"GitHub API Error: {response.status_code} - {response.text}"
                    )
                
                return response.json()
            
            except httpx.TimeoutException:
                logger.error("GitHub API request timed out")
                raise HTTPException(status_code=408, detail="GitHub API request timed out")
            except httpx.RequestError as e:
                logger.error(f"Request error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")

# Create singleton instance
github_base = GitHubBaseService()
