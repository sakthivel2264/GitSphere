
import asyncio
import base64
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from services.github_base_service import github_base
from models.repository_models import (
    RepositoryInfo, Contributor, CommitInfo, IssueInfo,
    CodeQualityMetrics, ActivityMetrics, RepositoryHealth,
    RepositoryAnalysis, RepositoryInsights
)
from fastapi import HTTPException

class RepositoryAnalyzerService:
    
    async def get_repository_info(self, owner: str, repo: str, github_token: str) -> RepositoryInfo:
        """Get basic repository information"""
        url = f"{github_base.api_url}/repos/{owner}/{repo}"
        data = await github_base._make_request(url, token=github_token)
        return RepositoryInfo(**data)

    async def get_languages(self, owner: str, repo: str, github_token: str) -> Dict[str, int]:
        """Get programming languages used in repository"""
        url = f"{github_base.api_url}/repos/{owner}/{repo}/languages"
        try:
            return await github_base._make_request(url, token=github_token)
        except HTTPException:
            return {}

    async def get_contributors(self, owner: str, repo: str, github_token: str) -> List[Contributor]:
        """Get repository contributors"""
        url = f"{github_base.api_url}/repos/{owner}/{repo}/contributors"
        try:
            data = await github_base._make_request(url, token=github_token)
            return [Contributor(**contrib) for contrib in data[:20]]  # Top 20 contributors
        except HTTPException:
            return []

    async def get_recent_commits(self, owner: str, repo: str, github_token: str, limit: int = 30) -> List[CommitInfo]:
        """Get recent commits"""
        url = f"{github_base.api_url}/repos/{owner}/{repo}/commits"
        params = {"per_page": limit}
        try:
            data = await github_base._make_request(url, params, token=github_token)
            commits = []
            for commit_data in data:
                commit_info = CommitInfo(
                    sha=commit_data['sha'],
                    author=commit_data.get('author', {}),
                    message=commit_data['commit']['message'],
                    date=datetime.fromisoformat(commit_data['commit']['author']['date'].replace('Z', '+00:00'))
                )
                commits.append(commit_info)
            return commits
        except HTTPException:
            return []

    async def get_issues(self, owner: str, repo: str, github_token: str) -> List[IssueInfo]:
        """Get repository issues"""
        url = f"{github_base.api_url}/repos/{owner}/{repo}/issues"
        params = {"state": "all", "per_page": 100}
        try:
            data = await github_base._make_request(url, params, token=github_token)
            issues = []
            for issue_data in data:
                issue = IssueInfo(
                    id=issue_data['id'],
                    number=issue_data['number'],
                    title=issue_data['title'],
                    state=issue_data['state'],
                    created_at=datetime.fromisoformat(issue_data['created_at'].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(issue_data['updated_at'].replace('Z', '+00:00')),
                    closed_at=datetime.fromisoformat(issue_data['closed_at'].replace('Z', '+00:00')) if issue_data.get('closed_at') else None,
                    user=issue_data['user'],
                    labels=issue_data.get('labels', [])
                )
                issues.append(issue)
            return issues
        except HTTPException:
            return []

    async def get_file_content(self, owner: str, repo: str, path: str, github_token: str) -> Optional[str]:
        """Get file content"""
        encoded_path = path if '%' in path else path
        url = f"{github_base.api_url}/repos/{owner}/{repo}/contents/{encoded_path}"
        
        try:
            data = await github_base._make_request(url, token=github_token)
            if isinstance(data, dict) and 'content' in data and data['encoding'] == 'base64':
                try:
                    content = base64.b64decode(data['content']).decode('utf-8')
                    return content
                except UnicodeDecodeError:
                    return f"[Binary file - {data.get('size', 0)} bytes]"
        except HTTPException:
            pass
        return None

    async def get_repository_tree(self, owner: str, repo: str, github_token: str) -> Dict[str, Any]:
        """Get repository file tree"""
        try:
            # First get repository info to get the default branch
            repo_info_url = f"{github_base.api_url}/repos/{owner}/{repo}"
            repo_data = await github_base._make_request(repo_info_url, token=github_token)
            default_branch = repo_data.get('default_branch', 'main')
            
            # Then get the tree using the default branch
            tree_url = f"{github_base.api_url}/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
            return await github_base._make_request(tree_url, token=github_token)
            
        except HTTPException as e:
            if e.status_code == 404:
                try:
                    contents_url = f"{github_base.api_url}/repos/{owner}/{repo}/contents"
                    return await self._get_tree_from_contents(contents_url, github_token)
                except:
                    return {"tree": []}
            raise e
        except Exception:
            return {"tree": []}

    async def _get_tree_from_contents(self, base_url: str, github_token: str, path: str = "") -> Dict[str, Any]:
        """Alternative method to get tree using contents API"""
        url = f"{base_url}/{path}" if path else base_url
        try:
            contents = await github_base._make_request(url, token=github_token)
            tree_items = []
            
            if isinstance(contents, list):
                for item in contents:
                    tree_item = {
                        "path": item["path"],
                        "type": "tree" if item["type"] == "dir" else "blob",
                        "size": item.get("size", 0),
                        "mode": "040000" if item["type"] == "dir" else "100644",
                        "url": item.get("url", "")
                    }
                    tree_items.append(tree_item)
                    
                    if item["type"] == "dir":
                        subtree = await self._get_tree_from_contents(base_url, github_token, item["path"])
                        tree_items.extend(subtree.get("tree", []))
                        
            return {"tree": tree_items}
        except Exception:
            return {"tree": []}


    def analyze_code_quality(self, repo_info: RepositoryInfo, tree: Dict[str, Any], readme_content: Optional[str]) -> CodeQualityMetrics:
        """Analyze code quality metrics"""
        files = tree.get('tree', [])        
        
        # Count total lines (approximate)
        total_lines = sum(file.get('size', 0) for file in files if file.get('type') == 'blob')
        
        # Check for important files
        file_names = [file['path'].lower() for file in files]
        has_readme = any('readme' in name for name in file_names)
        has_license = any('license' in name or 'licence' in name for name in file_names)
        has_contributing = any('contributing' in name for name in file_names)
        has_tests = any('test' in name or 'spec' in name for name in file_names)
        
        # Estimate documentation coverage
        doc_files = sum(1 for name in file_names if name.endswith(('.md', '.rst', '.txt', '.doc')))
        code_files = sum(1 for name in file_names if any(name.endswith(ext) for ext in ['.py', '.js', '.java', '.cpp', '.c', '.go', '.rs']))
        doc_coverage = min((doc_files / max(code_files, 1)) * 100, 100)
        
        # Estimate test coverage
        test_files = sum(1 for name in file_names if 'test' in name or 'spec' in name)
        test_coverage = min((test_files / max(code_files, 1)) * 100, 100)
        
        return CodeQualityMetrics(
            total_lines=total_lines,
            documentation_coverage=round(doc_coverage, 2),
            test_coverage_estimate=round(test_coverage, 2),
            has_readme=has_readme,
            has_license=has_license,
            has_contributing_guide=has_contributing,
            has_tests=has_tests
        )

    def calculate_activity_metrics(self, commits: List[CommitInfo], contributors: List[Contributor], issues: List[IssueInfo]) -> ActivityMetrics:
        """Calculate repository activity metrics"""
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        
        # Recent commits
        recent_commits = [c for c in commits if c.date >= thirty_days_ago]
        
        # Commit frequency
        if commits:
            oldest_commit = min(commits, key=lambda c: c.date)
            days_active = (now - oldest_commit.date).days or 1
            commit_frequency = len(commits) / days_active
        else:
            commit_frequency = 0
        
        # Issue resolution rate
        closed_issues = [i for i in issues if i.state == 'closed']
        resolution_rate = len(closed_issues) / max(len(issues), 1) * 100
        
        # Average resolution time
        resolution_times = []
        for issue in closed_issues:
            if issue.closed_at:
                resolution_time = (issue.closed_at - issue.created_at).days
                resolution_times.append(resolution_time)
        
        avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else None
        
        return ActivityMetrics(
            total_commits=len(commits),
            recent_commits_30_days=len(recent_commits),
            commit_frequency=round(commit_frequency, 3),
            contributor_count=len(contributors),
            issue_resolution_rate=round(resolution_rate, 2),
            average_issue_resolution_time=round(avg_resolution_time, 2) if avg_resolution_time else None
        )

    def assess_repository_health(self, repo_info: RepositoryInfo, activity: ActivityMetrics, code_quality: CodeQualityMetrics) -> RepositoryHealth:
        """Assess overall repository health"""
        # Calculate health score components
        activity_score = min(activity.commit_frequency * 10, 30)  # Max 30 points
        community_score = min((repo_info.stargazers_count / 10) + (activity.contributor_count * 2), 30)  # Max 30 points
        quality_score = (
            (20 if code_quality.has_readme else 0) +
            (10 if code_quality.has_license else 0) +
            (5 if code_quality.has_tests else 0) +
            (5 if code_quality.has_contributing_guide else 0)
        )  # Max 40 points
        
        health_score = activity_score + community_score + quality_score
        
        # Determine maintenance status
        now = datetime.now(timezone.utc)
        days_since_update = (now - repo_info.updated_at).days
        
        if days_since_update <= 30:
            maintenance_status = "Active"
        elif days_since_update <= 180:
            maintenance_status = "Maintained"
        elif days_since_update <= 365:
            maintenance_status = "Inactive"
        else:
            maintenance_status = "Deprecated"
        
        return RepositoryHealth(
            health_score=round(health_score, 2),
            maintenance_status=maintenance_status,
            community_engagement=round(community_score * 100 / 30, 2),
            code_quality_score=round(quality_score * 100 / 40, 2)
        )

    def generate_insights(self, analysis: RepositoryAnalysis) -> RepositoryInsights:
        """Generate insights and recommendations"""
        strengths = []
        concerns = []
        recommendations = []
        
        repo = analysis.repository
        health = analysis.health_assessment
        quality = analysis.code_quality
        activity = analysis.activity_metrics
        
        # Identify strengths
        if repo.stargazers_count > 50:
            strengths.append("High community interest and adoption")
        if activity.contributor_count > 5:
            strengths.append("Active contributor community")
        if quality.has_readme and quality.has_license:
            strengths.append("Well-documented with proper licensing")
        if health.maintenance_status in ["Active", "Maintained"]:
            strengths.append("Actively maintained and updated")
        if quality.test_coverage_estimate > 70:
            strengths.append("Good test coverage indicating quality focus")
        if activity.commit_frequency > 0.1:  # More than 0.1 commits per day
            strengths.append("Consistent development activity")
        if repo.forks_count > 20:
            strengths.append("Community engagement through forks")
        
        # Identify concerns
        if activity.recent_commits_30_days < 5:
            concerns.append("Low recent activity - may be inactive")
        if not quality.has_tests:
            concerns.append("No visible test files - testing coverage unclear")
        if activity.issue_resolution_rate < 50:
            concerns.append("Low issue resolution rate")
        if repo.open_issues_count > 20:
            concerns.append("High number of open issues")
        if not quality.has_readme:
            concerns.append("Missing README documentation")
        if not quality.has_license:
            concerns.append("No license specified - unclear usage rights")
        if health.health_score < 50:
            concerns.append("Overall repository health needs improvement")
        if activity.average_issue_resolution_time and activity.average_issue_resolution_time > 30:
            concerns.append("Slow issue resolution (>30 days average)")
        
        # Generate recommendations
        if not quality.has_contributing_guide:
            recommendations.append("Add a CONTRIBUTING.md file to help new contributors")
        if not quality.has_license:
            recommendations.append("Add a license to clarify usage rights")
        if quality.test_coverage_estimate < 30:
            recommendations.append("Improve test coverage to ensure code quality")
        if activity.recent_commits_30_days < 10:
            recommendations.append("Increase development activity with more frequent commits")
        if repo.open_issues_count > 10:
            recommendations.append("Address open issues to improve user experience")
        if not quality.has_readme:
            recommendations.append("Create comprehensive README with setup and usage instructions")
        if health.community_engagement < 30:
            recommendations.append("Engage more with the community through discussions and collaborations")
        
        # Always include general recommendations
        recommendations.append("Regular updates and issue management to maintain project health")
        
        # Determine technology stack
        tech_stack = list(analysis.languages.keys())[:5]  # Top 5 languages
        
        # Determine project type based on primary language
        primary_language = tech_stack[0] if tech_stack else "Unknown"
        if primary_language in ['JavaScript', 'TypeScript', 'HTML', 'CSS']:
            project_type = "Web Development"
        elif primary_language in ['Python', 'R']:
            project_type = "Data Science/Analytics"
        elif primary_language in ['Java', 'C++', 'C#', 'Go']:
            project_type = "Systems/Enterprise"
        elif primary_language == 'Python':
            project_type = "General Purpose/Scripting"
        else:
            project_type = "Software Library/Tool"
        
        # Determine maturity level based on repository age
        if not repo.created_at:
            maturity_level = "Unknown"
        else:
            from datetime import datetime, timezone
            account_age = (datetime.now(timezone.utc) - repo.created_at).days
            if account_age < 90:
                maturity_level = "Early Stage"
            elif account_age < 365:
                maturity_level = "Growing"
            elif account_age < 1095:  # 3 years
                maturity_level = "Mature"
            else:
                maturity_level = "Established"
        
        return RepositoryInsights(
            strengths=strengths,
            concerns=concerns,
            recommendations=recommendations,
            technology_stack=tech_stack,
            project_type=project_type,
            maturity_level=maturity_level
        )


    async def analyze_repository(self, owner: str, repo: str, github_token: str) -> RepositoryAnalysis:
        """Complete repository analysis"""
        try:
            # Fetch all data concurrently
            results = await asyncio.gather(
                self.get_repository_info(owner, repo, github_token),
                self.get_languages(owner, repo, github_token),
                self.get_contributors(owner, repo, github_token),
                self.get_recent_commits(owner, repo, github_token),
                self.get_issues(owner, repo, github_token),
                self.get_repository_tree(owner, repo, github_token),
                return_exceptions=True
            )
            
            # Extract results and handle exceptions
            repo_info = results[0] if not isinstance(results[0], Exception) else None
            languages = results[1] if not isinstance(results[1], Exception) else {}
            contributors = results[2] if not isinstance(results[2], Exception) else []
            commits = results[3] if not isinstance(results[3], Exception) else []
            issues = results[4] if not isinstance(results[4], Exception) else []
            tree = results[5] if not isinstance(results[5], Exception) else {"tree": []}
            
            # If repository info failed, we can't proceed
            if not repo_info or isinstance(repo_info, Exception):
                raise HTTPException(status_code=404, detail="Repository not found or inaccessible")
            
            # Get README content
            readme_content = await self.get_file_content(owner, repo, "README.md", github_token)
            
            # Calculate metrics
            code_quality = self.analyze_code_quality(repo_info, tree, readme_content)
            activity_metrics = self.calculate_activity_metrics(commits, contributors, issues)
            health_assessment = self.assess_repository_health(repo_info, activity_metrics, code_quality)
            
            # Summarize issues
            open_issues = [i for i in issues if i.state == 'open']
            closed_issues = [i for i in issues if i.state == 'closed']
            issues_summary = {
                "total": len(issues),
                "open": len(open_issues),
                "closed": len(closed_issues)
            }
            
            return RepositoryAnalysis(
                repository=repo_info,
                languages=languages,
                contributors=contributors,
                recent_commits=commits[:10],
                issues_summary=issues_summary,
                code_quality=code_quality,
                activity_metrics=activity_metrics,
                health_assessment=health_assessment
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Repository analysis failed: {str(e)}")

# Create singleton instance
repository_analyzer = RepositoryAnalyzerService()
