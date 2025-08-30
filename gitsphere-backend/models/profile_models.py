
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime

class GitHubProfile(BaseModel):
    login: str
    id: int
    avatar_url: str
    name: Optional[str] = None
    company: Optional[str] = None
    blog: str = ""
    location: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    public_repos: int
    public_gists: int
    followers: int
    following: int
    created_at: datetime
    updated_at: datetime
    html_url: str

class ProfileRepository(BaseModel):
    id: int
    name: str
    full_name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stargazers_count: int
    forks_count: int
    size: int
    created_at: datetime
    updated_at: datetime
    pushed_at: datetime
    topics: List[str] = Field(default_factory=list)

class ActivityMetrics(BaseModel):
    total_commits: int
    recent_commits: int
    contribution_streak: int
    active_days: int

class LanguageStats(BaseModel):
    languages: Dict[str, int]
    primary_language: Optional[str] = None
    language_diversity_score: float

class ProfileStats(BaseModel):
    total_stars: int
    total_forks: int
    total_repos: int
    avg_stars_per_repo: float
    follower_to_following_ratio: float
    account_age_days: int

class ProfileAnalysis(BaseModel):
    profile: GitHubProfile
    repositories: List[ProfileRepository]
    stats: ProfileStats
    language_stats: LanguageStats
    activity_metrics: ActivityMetrics
    top_repositories: List[ProfileRepository]
    analysis_timestamp: datetime = Field(default_factory=datetime.now)

class ProfileInsights(BaseModel):
    strengths: List[str]
    areas_for_improvement: List[str]
    developer_type: str  # "Full-stack", "Frontend", "Backend", "Data Scientist", etc.
    experience_level: str  # "Beginner", "Intermediate", "Advanced", "Expert"
    recommendations: List[str]
