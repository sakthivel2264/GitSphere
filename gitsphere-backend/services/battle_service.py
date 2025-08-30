
import asyncio
import uuid
from typing import List, Dict, Any, Tuple
from datetime import datetime
from services.profile_analyzer_service import profile_analyzer
from models.battle_models import (
    BattleScore, BattleParticipant, BattleComparison, 
    BattleResult, BattleRequest, MultiBattleResult
)
from models.profile_models import ProfileAnalysis

class BattleService:
    
    def calculate_battle_score(self, analysis: ProfileAnalysis, battle_type: str = "comprehensive") -> BattleScore:
        """Calculate battle score based on battle type"""
        profile = analysis.profile
        stats = analysis.stats
        activity = analysis.activity_metrics
        languages = analysis.language_stats
        
        if battle_type == "technical":
            # Focus on technical skills and code quality
            quality = min((stats.total_stars / 200) * 40, 40)
            consistency = min((languages.language_diversity_score * 100) * 30, 30)
            activity_score = min((stats.total_repos / 30) * 20, 20)
            impact = min((stats.avg_stars_per_repo) * 10, 10)
            
        elif battle_type == "social":
            # Focus on community engagement and network
            impact = min((profile.followers / 100) * 50, 50)
            quality = min((stats.follower_to_following_ratio) * 20, 20)
            activity_score = min((activity.recent_commits / 100) * 20, 20)
            consistency = min((len(analysis.top_repositories)) * 2, 10)
            
        elif battle_type == "activity":
            # Focus on coding activity and consistency
            activity_score = min((activity.recent_commits / 50) * 40, 40)
            consistency = min((activity.active_days / 30) * 30, 30)
            quality = min((stats.total_repos / 20) * 20, 20)
            impact = min((activity.total_commits / 500) * 10, 10)
            
        else:  # comprehensive
            # Balanced scoring across all areas
            activity_score = min((stats.total_repos / 20) * 25, 25)
            quality = min((stats.total_stars / 100) * 30, 30)
            impact = min((profile.followers / 50) * 25, 25)
            consistency = min((languages.language_diversity_score * 100) * 20, 20)
        
        total = activity_score + quality + impact + consistency
        
        return BattleScore(
            total=round(total, 2),
            activity=round(activity_score, 2),
            quality=round(quality, 2),
            impact=round(impact, 2),
            consistency=round(consistency, 2),
            breakdown={
                "repos": stats.total_repos,
                "stars": stats.total_stars,
                "followers": profile.followers,
                "languages": len(languages.languages),
                "recent_commits": activity.recent_commits,
                "account_age": stats.account_age_days
            }
        )

    def create_comparisons(self, participants: List[BattleParticipant]) -> List[BattleComparison]:
        """Create detailed comparisons between participants"""
        if len(participants) < 2:
            return []
        
        comparisons = []
        p1, p2 = participants[0], participants[1]  # Compare top 2
        
        # Repository count comparison
        repo_diff = p1.profile_analysis.stats.total_repos - p2.profile_analysis.stats.total_repos
        comparisons.append(BattleComparison(
            metric="Repository Count",
            winner=p1.username if repo_diff > 0 else p2.username,
            participant1_value=p1.profile_analysis.stats.total_repos,
            participant2_value=p2.profile_analysis.stats.total_repos,
            difference=f"{abs(repo_diff)} more repositories"
        ))
        
        # Stars comparison
        stars_diff = p1.profile_analysis.stats.total_stars - p2.profile_analysis.stats.total_stars
        comparisons.append(BattleComparison(
            metric="Total Stars",
            winner=p1.username if stars_diff > 0 else p2.username,
            participant1_value=p1.profile_analysis.stats.total_stars,
            participant2_value=p2.profile_analysis.stats.total_stars,
            difference=f"{abs(stars_diff)} more stars"
        ))
        
        # Followers comparison
        followers_diff = p1.profile_analysis.profile.followers - p2.profile_analysis.profile.followers
        comparisons.append(BattleComparison(
            metric="Followers",
            winner=p1.username if followers_diff > 0 else p2.username,
            participant1_value=p1.profile_analysis.profile.followers,
            participant2_value=p2.profile_analysis.profile.followers,
            difference=f"{abs(followers_diff)} more followers"
        ))
        
        return comparisons

    def generate_battle_insights(self, participants: List[BattleParticipant], battle_type: str) -> List[str]:
        """Generate insights about the battle"""
        insights = []
        winner = participants[0]
        
        insights.append(f"{winner.username} wins with a score of {winner.battle_score.total:.1f}")
        
        # Analyze winning factors
        if winner.battle_score.quality > 30:
            insights.append(f"{winner.username} excels in code quality with {winner.battle_score.breakdown['stars']} total stars")
        
        if winner.battle_score.impact > 20:
            insights.append(f"{winner.username} has strong community impact with {winner.battle_score.breakdown['followers']} followers")
        
        return insights

    def generate_recommendations(self, participants: List[BattleParticipant]) -> Dict[str, List[str]]:
        """Generate improvement recommendations for each participant"""
        recommendations = {}
        
        for participant in participants:
            user_recommendations = []
            score = participant.battle_score
            
            # Activity recommendations
            if score.activity < 20:
                user_recommendations.append("Increase repository activity and create more public projects")
            
            # Quality recommendations
            if score.quality < 25:
                user_recommendations.append("Focus on creating higher-quality repositories that attract more stars")
            
            recommendations[participant.username] = user_recommendations
        
        return recommendations

    async def conduct_battle(self, battle_request: BattleRequest, github_token: str) -> BattleResult:
        """Conduct a profile battle between users"""
        battle_id = str(uuid.uuid4())[:8]
        
        # Analyze all participants
        analyses = []
        for username in battle_request.usernames:
            try:
                analysis = await profile_analyzer.analyze_profile(username, github_token)
                analyses.append((username, analysis))
            except Exception as e:
                continue  # Skip failed analyses
        
        if len(analyses) < 2:
            raise ValueError("At least 2 valid profiles required for battle")
        
        # Calculate battle scores and create participants
        participants = []
        for username, analysis in analyses:
            battle_score = self.calculate_battle_score(analysis, battle_request.battle_type)
            participant = BattleParticipant(
                username=username,
                profile_analysis=analysis,
                battle_score=battle_score,
                rank=0  # Will be set after sorting
            )
            participants.append(participant)
        
        # Sort by total score and assign ranks
        participants.sort(key=lambda p: p.battle_score.total, reverse=True)
        for i, participant in enumerate(participants):
            participant.rank = i + 1
        
        # Generate comparisons and insights
        comparisons = self.create_comparisons(participants)
        insights = self.generate_battle_insights(participants, battle_request.battle_type) if battle_request.include_insights else []
        recommendations = self.generate_recommendations(participants)
        
        return BattleResult(
            battle_id=battle_id,
            participants=participants,
            winner=participants[0].username,
            comparisons=comparisons,
            insights=insights,
            recommendations=recommendations
        )

    async def multi_user_battle(self, usernames: List[str], github_token: str) -> MultiBattleResult:
        """Conduct a multi-user battle with leaderboard"""
        battle_id = str(uuid.uuid4())[:8]
        
        # Analyze all participants
        analyses = []
        for username in usernames:
            try:
                analysis = await profile_analyzer.analyze_profile(username, github_token)
                analyses.append((username, analysis))
            except Exception:
                continue
        
        if len(analyses) < 2:
            raise ValueError("At least 2 valid profiles required for battle")
        
        # Calculate scores for different categories
        participants = []
        category_scores = {
            "technical": {},
            "social": {},
            "activity": {},
            "comprehensive": {}
        }
        
        for username, analysis in analyses:
            # Calculate scores for each battle type
            tech_score = self.calculate_battle_score(analysis, "technical")
            social_score = self.calculate_battle_score(analysis, "social")
            activity_score = self.calculate_battle_score(analysis, "activity")
            comp_score = self.calculate_battle_score(analysis, "comprehensive")
            
            category_scores["technical"][username] = tech_score.total
            category_scores["social"][username] = social_score.total
            category_scores["activity"][username] = activity_score.total
            category_scores["comprehensive"][username] = comp_score.total
            
            participant = BattleParticipant(
                username=username,
                profile_analysis=analysis,
                battle_score=comp_score,  # Use comprehensive for overall ranking
                rank=0
            )
            participants.append(participant)
        
        # Sort by comprehensive score and assign ranks
        participants.sort(key=lambda p: p.battle_score.total, reverse=True)
        for i, participant in enumerate(participants):
            participant.rank = i + 1
        
        # Create leaderboard
        leaderboard = []
        for participant in participants:
            leaderboard.append({
                "rank": participant.rank,
                "username": participant.username,
                "total_score": participant.battle_score.total,
                "technical_score": category_scores["technical"][participant.username],
                "social_score": category_scores["social"][participant.username],
                "activity_score": category_scores["activity"][participant.username]
            })
        
        # Find category winners
        category_winners = {}
        for category, scores in category_scores.items():
            winner = max(scores.items(), key=lambda x: x[1])
            category_winners[category] = winner[0]
        
        # Generate overall insights
        overall_insights = [
            f"Battle completed with {len(participants)} participants",
            f"Overall winner: {participants[0].username} with {participants[0].battle_score.total:.1f} points",
            f"Technical leader: {category_winners['technical']}",
            f"Social leader: {category_winners['social']}",
            f"Activity leader: {category_winners['activity']}"
        ]
        
        return MultiBattleResult(
            battle_id=battle_id,
            participants=participants,
            leaderboard=leaderboard,
            category_winners=category_winners,
            overall_insights=overall_insights
        )

# Create singleton instance
battle_service = BattleService()
