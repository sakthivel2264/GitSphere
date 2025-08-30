from pydantic import BaseModel, Field
from typing import Optional, Dict, List


class GitHubAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None

class GitHubAuthResponse(BaseModel):
    access_token: str
    scopes: List[str]

class TokenValidationRequest(BaseModel):
    token: str

class TokenValidationResponse(BaseModel):
    user: dict
    scopes: List[str]

class ErrorResponse(BaseModel):
    error: str