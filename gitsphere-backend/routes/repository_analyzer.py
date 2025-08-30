
from fastapi import APIRouter, HTTPException, Path, Query, Request
from typing import List
from services.repository_analyzer_service import repository_analyzer
from models.repository_models import RepositoryAnalysis, RepositoryInsights, RepositoryInfo

router = APIRouter()

def get_github_token_from_request(request: Request) -> str:
    """Extract GitHub token from request state"""
    github_token = getattr(request.state, 'github_token', None)
    if not github_token:
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. GitHub token not found."
        )
    return github_token

@router.get("/analyze/{owner}/{repo}", response_model=RepositoryAnalysis)
async def analyze_repository(
    request: Request,
    owner: str = Path(..., description="Repository owner"),
    repo: str = Path(..., description="Repository name")
):
    """Comprehensive repository analysis"""
    try:
        github_token = get_github_token_from_request(request)
        return await repository_analyzer.analyze_repository(owner, repo, github_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Repository analysis failed: {str(e)}")

@router.get("/info/{owner}/{repo}", response_model=RepositoryInfo)
async def get_repository_info(
    request: Request,
    owner: str = Path(..., description="Repository owner"),
    repo: str = Path(..., description="Repository name")
):
    """Get basic repository information"""
    try:
        github_token = get_github_token_from_request(request)
        return await repository_analyzer.get_repository_info(owner, repo, github_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch repository info: {str(e)}")

@router.get("/insights/{owner}/{repo}", response_model=RepositoryInsights)
async def get_repository_insights(
    request: Request,
    owner: str = Path(..., description="Repository owner"),
    repo: str = Path(..., description="Repository name")
):
    """Get AI-generated insights for a repository"""
    try:
        github_token = get_github_token_from_request(request)
        analysis = await repository_analyzer.analyze_repository(owner, repo, github_token)
        return repository_analyzer.generate_insights(analysis)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@router.get("/languages/{owner}/{repo}")
async def get_repository_languages(
    request: Request,
    owner: str = Path(..., description="Repository owner"),
    repo: str = Path(..., description="Repository name")
):
    """Get programming languages used in repository"""
    try:
        github_token = get_github_token_from_request(request)
        return await repository_analyzer.get_languages(owner, repo, github_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get languages: {str(e)}")

@router.get("/contributors/{owner}/{repo}")
async def get_repository_contributors(
    request: Request,
    owner: str = Path(..., description="Repository owner"),
    repo: str = Path(..., description="Repository name")
):
    """Get repository contributors"""
    try:
        github_token = get_github_token_from_request(request)
        return await repository_analyzer.get_contributors(owner, repo, github_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get contributors: {str(e)}")

@router.get("/file/{owner}/{repo}/{path:path}")
async def get_file_content(
    request: Request,
    owner: str = Path(..., description="Repository owner"),
    repo: str = Path(..., description="Repository name"),
    path: str = Path(..., description="File path in repository")
):
    """Get specific file content from repository"""
    try:
        github_token = get_github_token_from_request(request)
        content = await repository_analyzer.get_file_content(owner, repo, path, github_token)
        if content is None:
            raise HTTPException(status_code=404, detail="File not found")
        return {"path": path, "content": content}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file content: {str(e)}")

@router.post("/bulk-analyze")
async def bulk_analyze_repositories(
    request: Request,
    repositories: List[dict]  # [{"owner": "user", "repo": "repo-name"}]
):
    """Analyze multiple repositories at once"""
    if len(repositories) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 repositories allowed per request")
    
    try:
        github_token = get_github_token_from_request(request)
        results = []
        
        for repo_info in repositories:
            owner = repo_info.get("owner")
            repo = repo_info.get("repo")
            
            if not owner or not repo:
                continue
            
            try:
                analysis = await repository_analyzer.analyze_repository(owner, repo, github_token)
                results.append({
                    "repository": f"{owner}/{repo}",
                    "analysis": analysis,
                    "status": "success"
                })
            except Exception as e:
                results.append({
                    "repository": f"{owner}/{repo}",
                    "error": str(e),
                    "status": "failed"
                })
        
        return {"analyses": results, "total_analyzed": len([r for r in results if r.get("status") == "success"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk analysis failed: {str(e)}")
    
@router.get("/tree/{owner}/{repo}")
async def get_repository_tree(
    request: Request,
    owner: str = Path(..., description="Repository owner"),
    repo: str = Path(..., description="Repository name")
):
    """Get repository file tree structure"""
    try:
        github_token = get_github_token_from_request(request)
        tree = await repository_analyzer.get_repository_tree(owner, repo, github_token)
        
        if 'tree' in tree:
            # Format tree data for frontend
            formatted_tree = []
            for item in tree['tree']:
                formatted_tree.append({
                    'path': item['path'],
                    'type': item['type'],
                    'size': item.get('size')
                })
            
            return {
                "repository": f"{owner}/{repo}",
                "tree": formatted_tree[:500]  # Limit to 500 items for performance
            }
        else:
            return {"repository": f"{owner}/{repo}", "tree": []}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tree: {str(e)}")
