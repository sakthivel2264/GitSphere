from fastapi import APIRouter, HTTPException, Path, Query, Request
from typing import List, Optional
from services.profile_analyzer_service import profile_analyzer
from models.profile_models import ProfileAnalysis, ProfileInsights, GitHubProfile
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def get_github_token_from_request(request: Request) -> str:
    """Extract GitHub token from request state"""
    github_token = getattr(request.state, 'github_token', None)
    if not github_token:
        logger.error("No GitHub token found in request state")
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. GitHub token not found."
        )
    return github_token

@router.get("/analyze/{username}", response_model=ProfileAnalysis)
async def analyze_github_profile(
    request: Request,
    username: str = Path(..., description="GitHub username to analyze")
):
    """Comprehensive GitHub profile analysis"""
    try:
        github_token = get_github_token_from_request(request)
        logger.info(f"Analyzing profile for user: {username}")
        
        return await profile_analyzer.analyze_profile(username, github_token)
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Profile analysis failed for {username}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile analysis failed: {str(e)}")

@router.get("/profile/{username}", response_model=GitHubProfile)
async def get_profile_info(
    request: Request,
    username: str = Path(..., description="GitHub username")
):
    """Get basic GitHub profile information"""
    try:
        github_token = get_github_token_from_request(request)
        logger.info(f"Fetching profile info for user: {username}")
        
        return await profile_analyzer.get_profile(username, github_token)
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to fetch profile for {username}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")

@router.get("/insights/{username}", response_model=ProfileInsights)
async def get_profile_insights(
    request: Request,
    username: str = Path(..., description="GitHub username")
):
    """Get AI-generated insights for a GitHub profile"""
    try:
        github_token = get_github_token_from_request(request)
        logger.info(f"Generating insights for user: {username}")
        
        analysis = await profile_analyzer.analyze_profile(username, github_token)
        return profile_analyzer.generate_insights(analysis)
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to generate insights for {username}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@router.get("/repositories/{username}")
async def get_user_repositories(
    request: Request,
    username: str = Path(..., description="GitHub username"),
    limit: int = Query(None, ge=1, le=100, description="Limit number of repositories")
):
    """Get user repositories with optional limit"""
    try:
        github_token = get_github_token_from_request(request)
        logger.info(f"Fetching repositories for user: {username} (limit: {limit})")
        
        repositories = await profile_analyzer.get_repositories(username, github_token)
        
        if limit:
            repositories = repositories[:limit]
            
        return {
            "repositories": repositories, 
            "total_count": len(repositories),
            "limited": limit is not None
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to fetch repositories for {username}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch repositories: {str(e)}")
