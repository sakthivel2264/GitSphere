# models/battle_models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Literal
from datetime import datetime
from models.profile_models import ProfileAnalysis

class BattleScore(BaseModel):
    total: float
    activity: float
    quality: float
    impact: float
    consistency: float
    breakdown: Dict[str, Any]

class BattleParticipant(BaseModel):
    username: str
    profile_analysis: ProfileAnalysis
    battle_score: BattleScore
    rank: int

class BattleComparison(BaseModel):
    metric: str
    winner: str
    participant1_value: Any
    participant2_value: Any
    difference: str

class BattleResult(BaseModel):
    battle_id: str
    participants: List[BattleParticipant]
    winner: str
    comparisons: List[BattleComparison]
    insights: List[str]
    recommendations: Dict[str, List[str]]
    battle_timestamp: datetime = Field(default_factory=datetime.now)

class BattleRequest(BaseModel):
    usernames: List[str] = Field(..., min_length=2, max_length=5)
    battle_type: Literal["comprehensive", "technical", "social", "activity"] = "comprehensive"
    include_insights: bool = True

class MultiBattleResult(BaseModel):
    battle_id: str
    participants: List[BattleParticipant]
    leaderboard: List[Dict[str, Any]]
    category_winners: Dict[str, str]
    overall_insights: List[str]
    battle_timestamp: datetime = Field(default_factory=datetime.now)
