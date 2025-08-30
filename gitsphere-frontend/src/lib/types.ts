/* eslint-disable @typescript-eslint/no-explicit-any */

export interface GitHubProfile {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
}

// Profile Analyzer Types
export interface ProfileStats {
  total_stars: number;
  total_forks: number;
  total_repos: number;
  avg_stars_per_repo: number;
  follower_to_following_ratio: number;
  account_age_days: number;
}

export interface LanguageStats {
  languages: Record<string, number>;
  primary_language: string | null;
  language_diversity_score: number;
}

export interface ActivityMetrics {
  total_commits: number;
  recent_commits: number;
  contribution_streak: number;
  active_days: number;
}

export interface ProfileAnalysis {
  profile: GitHubProfile;
  repositories: Repository[];
  stats: ProfileStats;
  language_stats: LanguageStats;
  activity_metrics: ActivityMetrics;
  top_repositories: Repository[];
  analysis_timestamp: string;
}

export interface ProfileInsights {
  strengths: string[];
  areas_for_improvement: string[];
  developer_type: string;
  experience_level: string;
  recommendations: string[];
}

// Repository Analyzer Types
export interface RepositoryInfo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
}

export interface CodeQualityMetrics {
  total_lines: number;
  documentation_coverage: number;
  test_coverage_estimate: number;
  has_readme: boolean;
  has_license: boolean;
  has_contributing_guide: boolean;
  has_tests: boolean;
}

export interface RepositoryHealth {
  health_score: number;
  maintenance_status: string;
  community_engagement: number;
  code_quality_score: number;
}

export interface RepositoryAnalysis {
  repository: RepositoryInfo;
  languages: Record<string, number>;
  contributors: any[];
  recent_commits: any[];
  issues_summary: Record<string, number>;
  code_quality: CodeQualityMetrics;
  activity_metrics: any;
  health_assessment: RepositoryHealth;
  analysis_timestamp: string;
}

// Battle Types
export interface BattleScore {
  total: number;
  activity: number;
  quality: number;
  impact: number;
  consistency: number;
  breakdown: Record<string, any>;
}

export interface BattleParticipant {
  username: string;
  profile_analysis: ProfileAnalysis;
  battle_score: BattleScore;
  rank: number;
}

export interface BattleComparison {
  metric: string;
  winner: string;
  participant1_value: any;
  participant2_value: any;
  difference: string;
}

export interface BattleResult {
  battle_id: string;
  participants: BattleParticipant[];
  winner: string;
  comparisons: BattleComparison[];
  insights: string[];
  recommendations: Record<string, string[]>;
  battle_timestamp: string;
}

export interface BattleRequest {
  usernames: string[];
  battle_type: 'comprehensive' | 'technical' | 'social' | 'activity';
  include_insights: boolean;
}
