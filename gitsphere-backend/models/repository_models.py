# models/repository_models.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime

class RepositoryInfo(BaseModel):
    id: int
    name: str
    full_name: str
    description: Optional[str] = None
    html_url: str
    language: Optional[str] = None
    stargazers_count: int
    forks_count: int
    watchers_count: int
    size: int
    open_issues_count: int
    created_at: datetime
    updated_at: datetime
    pushed_at: datetime
    topics: List[str] = Field(default_factory=list)

class Contributor(BaseModel):
    login: str
    id: int
    avatar_url: str
    contributions: int
    html_url: str

class CommitInfo(BaseModel):
    sha: str
    author: Dict[str, Any]
    message: str
    date: datetime
    additions: Optional[int] = None
    deletions: Optional[int] = None

class IssueInfo(BaseModel):
    id: int
    number: int
    title: str
    state: str
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    user: Dict[str, Any]
    labels: List[Dict[str, Any]] = Field(default_factory=list)

class CodeQualityMetrics(BaseModel):
    total_lines: int
    documentation_coverage: float
    test_coverage_estimate: float
    has_readme: bool
    has_license: bool
    has_contributing_guide: bool
    has_tests: bool

class ActivityMetrics(BaseModel):
    total_commits: int
    recent_commits_30_days: int
    commit_frequency: float  # commits per day
    contributor_count: int
    issue_resolution_rate: float
    average_issue_resolution_time: Optional[float] = None  # in days

class RepositoryHealth(BaseModel):
    health_score: float  # 0-100
    maintenance_status: str  # "Active", "Maintained", "Inactive", "Deprecated"
    community_engagement: float  # 0-100
    code_quality_score: float  # 0-100

class RepositoryAnalysis(BaseModel):
    repository: RepositoryInfo
    languages: Dict[str, int]
    contributors: List[Contributor]
    recent_commits: List[CommitInfo]
    issues_summary: Dict[str, int]
    code_quality: CodeQualityMetrics
    activity_metrics: ActivityMetrics
    health_assessment: RepositoryHealth
    analysis_timestamp: datetime = Field(default_factory=datetime.now)

class RepositoryInsights(BaseModel):
    strengths: List[str]
    concerns: List[str]
    recommendations: List[str]
    technology_stack: List[str]
    project_type: str
    maturity_level: str
