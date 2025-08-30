
from fastapi import APIRouter, HTTPException, Body, Request
from typing import List
from services.battle_service import battle_service
from models.battle_models import BattleResult, BattleRequest, MultiBattleResult

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

@router.post("/start", response_model=BattleResult)
async def start_profile_battle(
    request: Request,
    battle_request: BattleRequest
):
    """Start a GitHub profile battle between users"""
    try:
        if len(battle_request.usernames) < 2:
            raise HTTPException(status_code=400, detail="At least 2 usernames required")
        if len(battle_request.usernames) > 5:
            raise HTTPException(status_code=400, detail="Maximum 5 users allowed per battle")
        
        github_token = get_github_token_from_request(request)
        return await battle_service.conduct_battle(battle_request, github_token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Battle failed: {str(e)}")

@router.post("/multi-battle", response_model=MultiBattleResult)
async def multi_user_battle(
    request: Request,
    usernames: List[str] = Body(..., embed=True)
):
    """Conduct a multi-user battle with category breakdowns"""
    try:
        if len(usernames) < 2:
            raise HTTPException(status_code=400, detail="At least 2 usernames required")
        if len(usernames) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 users allowed per multi-battle")
        
        github_token = get_github_token_from_request(request)
        return await battle_service.multi_user_battle(usernames, github_token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-battle failed: {str(e)}")

@router.post("/quick-battle")
async def quick_battle(
    request: Request,
    user1: str = Body(...),
    user2: str = Body(...)
):
    """Quick 1v1 battle between two users"""
    try:
        battle_request = BattleRequest(
            usernames=[user1, user2],
            battle_type="comprehensive",
            include_insights=True
        )
        github_token = get_github_token_from_request(request)
        result = await battle_service.conduct_battle(battle_request, github_token)
        
        # Return simplified result for quick battles
        return {
            "winner": result.winner,
            "scores": {
                participant.username: participant.battle_score.total 
                for participant in result.participants
            },
            "key_insights": result.insights[:3],  # Top 3 insights
            "battle_id": result.battle_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick battle failed: {str(e)}")

@router.post("/category-battle/{category}")
async def category_battle(
    request: Request,
    category: str,
    usernames: List[str] = Body(..., embed=True)
):
    """Battle focused on specific category (technical, social, activity)"""
    if category not in ["technical", "social", "activity"]:
        raise HTTPException(status_code=400, detail="Invalid category. Choose: technical, social, or activity")
    
    try:
        battle_request = BattleRequest(
            usernames=usernames,
            battle_type=category,
            include_insights=True
        )
        github_token = get_github_token_from_request(request)
        return await battle_service.conduct_battle(battle_request, github_token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category battle failed: {str(e)}")

@router.get("/battle-types")
async def get_battle_types():
    """Get available battle types and their descriptions"""
    return {
        "battle_types": {
            "comprehensive": "Balanced scoring across all areas",
            "technical": "Focus on technical skills and code quality",
            "social": "Focus on community engagement and network",
            "activity": "Focus on coding activity and consistency"
        },
        "max_participants": 5,
        "supported_features": [
            "detailed_comparisons",
            "insights_generation",
            "improvement_recommendations",
            "category_breakdowns"
        ]
    }
