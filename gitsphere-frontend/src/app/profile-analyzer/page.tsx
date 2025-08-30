'use client';

import { useState } from 'react';
import { ProfileAnalysis, ProfileInsights } from '@/lib/types';
import { profileAnalyzerApi } from '@/lib/api';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card from '@/components/ui/card';
import ProfileCard from '@/components/profile/ProfileCard';
import LanguageChart from '@/components/profile/LanguageChart';
import { Search, User, TrendingUp, Activity, Star, AlertCircle } from 'lucide-react';
import { extractGitHubUsername } from '@/utils/github';

export default function ProfileAnalyzerPage() {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [insights, setInsights] = useState<ProfileInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError('Please enter a GitHub username or URL');
      return;
    }

    // Extract username from input
    const username = extractGitHubUsername(input);
    
    if (!username) {
      setError('Invalid GitHub username or URL format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [analysisResult, insightsResult] = await Promise.all([
        profileAnalyzerApi.analyze(username),
        profileAnalyzerApi.getInsights(username),
      ]);
      
      setAnalysis(analysisResult);
      setInsights(insightsResult);
    } catch (err) {
      setError('Failed to analyze profile. Please check the username and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Preview extracted username for user feedback
  const previewUsername = input.trim() ? extractGitHubUsername(input) : null;
  const isValidInput = previewUsername !== null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            GitHub Profile Analyzer
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get deep insights into any GitHub profile with AI-powered analysis.
            Enter a username or GitHub profile URL.
          </p>
        </div>

        {/* Search Section */}
        <Card variant="elevated" className="max-w-2xl mx-auto mb-8">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter GitHub username or URL (e.g., octocat or github.com/octocat)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                  icon={<User className="w-4 h-4" />}
                  className={`${!isValidInput && input.trim() ? 'border-red-300' : ''}`}
                />
                
                {/* Username Preview */}
                {input.trim() && (
                  <div className="mt-2 text-sm">
                    {isValidInput ? (
                      <span className="text-green-600 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Will analyze: <strong className="ml-1">{previewUsername}</strong>
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Invalid username or URL format
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button 
                onClick={handleAnalyze} 
                loading={loading}
                disabled={!isValidInput}
              >
                <Search className="w-4 h-4 mr-2" />
                Analyze
              </Button>
            </div>
            
            {error && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            {/* Input Format Examples */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">Supported formats:</p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>• Username: <code className="bg-white px-1 rounded">octocat</code></div>
                <div>• Full URL: <code className="bg-white px-1 rounded">https://github.com/octocat</code></div>
                <div>• Short URL: <code className="bg-white px-1 rounded">github.com/octocat</code></div>
              </div>
            </div>
          </div>
        </Card>

        {analysis && (
          <div className="space-y-8">
            {/* Profile Overview */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <ProfileCard 
                  profile={analysis.profile} 
                  stats={analysis.stats} 
                />
              </div>
              <div className="lg:col-span-2">
                <LanguageChart languageStats={analysis.language_stats} />
              </div>
            </div>

            {/* Activity Metrics */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Metrics</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {analysis.activity_metrics.total_commits}
                  </div>
                  <div className="text-sm text-gray-500">Total Commits</div>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {analysis.activity_metrics.recent_commits}
                  </div>
                  <div className="text-sm text-gray-500">Recent Commits</div>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {analysis.activity_metrics.contribution_streak}
                  </div>
                  <div className="text-sm text-gray-500">Contribution Streak</div>
                </div>
                <div className="text-center">
                  <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {analysis.activity_metrics.active_days}
                  </div>
                  <div className="text-sm text-gray-500">Active Days</div>
                </div>
              </div>
            </Card>

            {/* Top Repositories */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Top Repositories</h2>
              <div className="space-y-4">
                {analysis.top_repositories.map((repo) => (
                  <div key={repo.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{repo.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>🍴 {repo.forks_count}</span>
                        {repo.language && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {repo.language}
                          </span>
                        )}
                      </div>
                    </div>
                    {repo.description && (
                      <p className="text-gray-600 text-sm">{repo.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Insights */}
            {insights && (
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Insights</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-green-600 mb-2">Strengths</h3>
                      <ul className="space-y-1">
                        {insights.strengths.map((strength, index) => (
                          <li key={index} className="text-gray-700 text-sm flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-600 mb-2">Areas for Improvement</h3>
                      <ul className="space-y-1">
                        {insights.areas_for_improvement.map((area, index) => (
                          <li key={index} className="text-gray-700 text-sm flex items-start">
                            <span className="text-yellow-500 mr-2">⚠</span>
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Developer Profile</h2>
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {insights.developer_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Experience Level:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {insights.experience_level}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-600 mb-2">Recommendations</h3>
                      <ul className="space-y-1">
                        {insights.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-gray-700 text-sm flex items-start">
                            <span className="text-blue-500 mr-2">💡</span>
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
