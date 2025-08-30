import asyncio
from typing import List, Dict, Any
from datetime import datetime, timezone
from services.github_base_service import github_base
from models.profile_models import (
    GitHubProfile, ProfileRepository, ProfileStats, 
    LanguageStats, ActivityMetrics, ProfileAnalysis, ProfileInsights
)


class ProfileAnalyzerService:
    
    async def get_profile(self, username: str, github_token: str) -> GitHubProfile:
        """Get GitHub user profile"""
        url = f"{github_base.api_url}/users/{username}"
        data = await github_base._make_request(url, token=github_token)
        return GitHubProfile(**data)

    async def get_repositories(self, username: str, github_token: str) -> List[ProfileRepository]:
        """Get all user repositories"""
        all_repos = []
        page = 1
        
        while True:
            url = f"{github_base.api_url}/users/{username}/repos"
            params = {
                "page": page,
                "per_page": 100,
                "sort": "updated",
                "direction": "desc"
            }
            
            repos_data = await github_base._make_request(url, params, token=github_token)
            if not repos_data:
                break
                
            repos = [ProfileRepository(**repo) for repo in repos_data]
            all_repos.extend(repos)
            
            if len(repos) < 100:
                break
            page += 1
            await asyncio.sleep(0.1)  # Rate limiting
        
        return all_repos

    async def get_user_events(self, username: str, github_token: str) -> List[Dict[str, Any]]:
        """Get user activity events"""
        url = f"{github_base.api_url}/users/{username}/events"
        params = {"per_page": 100}
        try:
            return await github_base._make_request(url, params, token=github_token)
        except:
            return []

    def calculate_profile_stats(self, profile: GitHubProfile, repositories: List[ProfileRepository]) -> ProfileStats:
        """Calculate comprehensive profile statistics"""
        total_stars = sum(repo.stargazers_count for repo in repositories)
        total_forks = sum(repo.forks_count for repo in repositories)
        total_repos = len(repositories)
        avg_stars_per_repo = total_stars / total_repos if total_repos > 0 else 0
        
        follower_ratio = profile.followers / max(profile.following, 1)
        
        # Calculate account age
        created_date = profile.created_at
        now = datetime.now(timezone.utc)
        account_age_days = (now - created_date).days
        
        return ProfileStats(
            total_stars=total_stars,
            total_forks=total_forks,
            total_repos=total_repos,
            avg_stars_per_repo=round(avg_stars_per_repo, 2),
            follower_to_following_ratio=round(follower_ratio, 2),
            account_age_days=account_age_days
        )

    def calculate_language_stats(self, repositories: List[ProfileRepository]) -> LanguageStats:
        """Calculate language usage statistics"""
        language_count = {}
        for repo in repositories:
            if repo.language:
                language_count[repo.language] = language_count.get(repo.language, 0) + 1
        
        # Calculate diversity score
        total_repos = len([r for r in repositories if r.language])
        diversity_score = len(language_count) / max(total_repos, 1)
        
        primary_language = max(language_count, key=language_count.get) if language_count else None
        
        return LanguageStats(
            languages=language_count,
            primary_language=primary_language,
            language_diversity_score=round(diversity_score, 3)
        )

    def calculate_activity_metrics(self, events: List[Dict[str, Any]], repositories: List[ProfileRepository]) -> ActivityMetrics:
        """Calculate activity metrics from events and repositories"""
        # Count commit events
        commit_events = [e for e in events if e.get('type') == 'PushEvent']
        total_commits = sum(len(e.get('payload', {}).get('commits', [])) for e in commit_events)
        
        # Recent activity (last 30 days)
        now = datetime.now(timezone.utc)
        recent_events = []
        for event in events:
            try:
                event_date = datetime.fromisoformat(event['created_at'].replace('Z', '+00:00'))
                if (now - event_date).days <= 30:
                    recent_events.append(event)
            except:
                continue
        
        recent_commits = sum(len(e.get('payload', {}).get('commits', [])) for e in recent_events if e.get('type') == 'PushEvent')
        
        # Calculate active days
        event_dates = set()
        for event in recent_events:
            try:
                date = datetime.fromisoformat(event['created_at'].replace('Z', '+00:00')).date()
                event_dates.add(date)
            except:
                continue
        
        return ActivityMetrics(
            total_commits=total_commits,
            recent_commits=recent_commits,
            contribution_streak=len(event_dates),
            active_days=len(event_dates)
        )

    def get_top_repositories(self, repositories: List[ProfileRepository], limit: int = 5) -> List[ProfileRepository]:
        """Get top repositories by stars"""
        return sorted(repositories, key=lambda r: r.stargazers_count, reverse=True)[:limit]

    def generate_insights(self, analysis: ProfileAnalysis) -> ProfileInsights:
        """Generate insights and recommendations based on profile analysis"""
        strengths = []
        improvements = []
        recommendations = []
        
        # Determine developer type
        languages = analysis.language_stats.languages
        primary_lang = analysis.language_stats.primary_language
        
        if primary_lang:
            if primary_lang in ['JavaScript', 'TypeScript', 'HTML', 'CSS']:
                developer_type = "Frontend Developer"
            elif primary_lang in ['Python', 'Java', 'C++', 'Go', 'Rust']:
                developer_type = "Backend Developer"
            elif 'JavaScript' in languages and 'Python' in languages:
                developer_type = "Full-stack Developer"
            elif primary_lang in ['Python', 'R', 'Julia']:
                developer_type = "Data Scientist"
            else:
                developer_type = f"{primary_lang} Developer"
        else:
            developer_type = "Multi-language Developer"
        
        # Experience level based on account age and activity
        account_years = analysis.stats.account_age_days / 365
        if account_years < 1:
            experience_level = "Beginner"
        elif account_years < 3:
            experience_level = "Intermediate"
        elif account_years < 5:
            experience_level = "Advanced"
        else:
            experience_level = "Expert"
        
        # Identify strengths
        if analysis.stats.total_stars > 100:
            strengths.append("High-quality repositories with good community engagement")
        if analysis.language_stats.language_diversity_score > 0.3:
            strengths.append("Diverse programming language skills")
        if analysis.activity_metrics.recent_commits > 50:
            strengths.append("Highly active contributor")
        if analysis.stats.follower_to_following_ratio > 2:
            strengths.append("Strong developer network and influence")
        
        # Areas for improvement
        if analysis.stats.avg_stars_per_repo < 1:
            improvements.append("Focus on creating more impactful repositories")
        if analysis.activity_metrics.recent_commits < 10:
            improvements.append("Increase coding activity and consistency")
        if len(analysis.repositories) < 5:
            improvements.append("Build more public repositories to showcase skills")
        
        # Recommendations
        recommendations.extend([
            "Document your projects with comprehensive READMEs",
            "Contribute to open source projects in your area of expertise",
            "Engage with the developer community through issues and discussions"
        ])
        
        return ProfileInsights(
            strengths=strengths,
            areas_for_improvement=improvements,
            developer_type=developer_type,
            experience_level=experience_level,
            recommendations=recommendations
        )

    async def analyze_profile(self, username: str, github_token: str) -> ProfileAnalysis:
        """Complete profile analysis"""
        # Fetch data concurrently
        profile, repositories, events = await asyncio.gather(
            self.get_profile(username, github_token),
            self.get_repositories(username, github_token),
            self.get_user_events(username, github_token),
            return_exceptions=True
        )
        
        # Handle exceptions
        if isinstance(profile, Exception):
            raise profile
        if isinstance(repositories, Exception):
            repositories = []
        if isinstance(events, Exception):
            events = []
        
        # Calculate metrics
        stats = self.calculate_profile_stats(profile, repositories)
        language_stats = self.calculate_language_stats(repositories)
        activity_metrics = self.calculate_activity_metrics(events, repositories)
        top_repos = self.get_top_repositories(repositories)
        
        return ProfileAnalysis(
            profile=profile,
            repositories=repositories,
            stats=stats,
            language_stats=language_stats,
            activity_metrics=activity_metrics,
            top_repositories=top_repos
        )

# Create singleton instance
profile_analyzer = ProfileAnalyzerService()
