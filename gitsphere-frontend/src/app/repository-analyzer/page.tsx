/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { RepositoryAnalysis } from '@/lib/types';
import { repositoryAnalyzerApi } from '@/lib/api';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card from '@/components/ui/card';
import RepositoryCard from '@/components/repository/RepositoryCard';
import HealthScore from '@/components/repository/HealthScore';
import MetricsChart from '@/components/repository/MetricsChart';
import { Search, GitBranch, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import RepositoryStructure from '@/components/repository/RepositoryStructure';
import Image from 'next/image';

export default function RepositoryAnalyzerPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [insights, setInsights] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{owner: string, repo: string}> ({owner: "", repo:""});

  const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
      /^([^\/]+)\/([^\/]+)$/
    ];

    const cleanUrl = url.trim().replace(/^https?:\/\//, '');
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    }
    return null;
  };

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL or owner/repo');
      return;
    }

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setError('Invalid repository format. Use: owner/repo or GitHub URL');
      return;
    }
    setParsed(parsed)
    setLoading(true);
    setError(null);

    try {
      const [analysisResult, insightsResult] = await Promise.all([
        repositoryAnalyzerApi.analyze(parsed.owner, parsed.repo),
        repositoryAnalyzerApi.getInsights(parsed.owner, parsed.repo),
      ]);
      
      setAnalysis(analysisResult);
      setInsights(insightsResult);
    } catch (err) {
      setError('Failed to analyze repository. Please check the repository name and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            GitHub Repository Analyzer
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Analyze repository health, code quality, and community engagement with AI-powered insights
          </p>
        </div>

        {/* Search Section */}
        <Card variant="elevated" className="max-w-3xl mx-auto mb-8">
          <div className="flex space-x-4">
            <Input
              placeholder="Enter repository URL or owner/repo (e.g., facebook/react)"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              icon={<GitBranch className="w-4 h-4" />}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} loading={loading}>
              <Search className="w-4 h-4 mr-2" />
              Analyze
            </Button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
          <div className="mt-4 text-sm text-gray-500">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>https://github.com/owner/repository</li>
              <li>github.com/owner/repository</li>
              <li>owner/repository</li>
            </ul>
          </div>
        </Card>

        {analysis && (
          <div className="space-y-8">
            {/* Repository Overview */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <RepositoryCard repository={analysis.repository} />
              </div>
              <div className="lg:col-span-1">
                <HealthScore healthAssessment={analysis.health_assessment} />
              </div>
            </div>

            {/* Languages and Contributors */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Programming Languages</h2>
                <div className="space-y-3">
                  {Object.entries(analysis.languages)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([language, bytes]) => {
                      const total = Object.values(analysis.languages).reduce((sum, b) => sum + b, 0);
                      const percentage = ((bytes / total) * 100).toFixed(1);
                      return (
                        <div key={language} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ 
                                backgroundColor: getLanguageColor(language) 
                              }}
                            />
                            <span className="font-medium text-gray-900">{language}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">{percentage}%</div>
                            <div className="text-xs text-gray-500">
                              {formatBytes(bytes)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Top Contributors</h2>
                <div className="space-y-3">
                  {analysis.contributors.slice(0, 8).map((contributor, index) => (
                    <div key={contributor.login} className="flex items-center space-x-3">
                      <div className="text-sm font-semibold text-gray-500 w-6">
                        #{index + 1}
                      </div>
                      <Image
                        width={32}
                        height={32}
                        src={contributor.avatar_url}
                        alt={contributor.login}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{contributor.login}</div>
                        <div className="text-sm text-gray-500">
                          {contributor.contributions} contributions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Code Quality Metrics */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Code Quality Metrics</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {formatNumber(analysis.code_quality.total_lines)}
                  </div>
                  <div className="text-sm text-gray-500">Lines of Code</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {analysis.code_quality.documentation_coverage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Documentation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {analysis.code_quality.test_coverage_estimate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Test Coverage</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center space-x-2 mb-2">
                    {analysis.code_quality.has_readme && (
                      <CheckCircle className="w-6 h-6 text-green-500"  />
                    )}
                    {analysis.code_quality.has_license && (
                      <CheckCircle className="w-6 h-6 text-blue-500"  />
                    )}
                    {analysis.code_quality.has_tests && (
                      <CheckCircle className="w-6 h-6 text-purple-500"  />
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Quality Indicators</div>
                </div>
              </div>

              {/* Quality Indicators Detail */}
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Project Files</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span>README.md</span>
                      <span className={analysis.code_quality.has_readme ? 'text-green-600' : 'text-red-600'}>
                        {analysis.code_quality.has_readme ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>LICENSE</span>
                      <span className={analysis.code_quality.has_license ? 'text-green-600' : 'text-red-600'}>
                        {analysis.code_quality.has_license ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>CONTRIBUTING.md</span>
                      <span className={analysis.code_quality.has_contributing_guide ? 'text-green-600' : 'text-red-600'}>
                        {analysis.code_quality.has_contributing_guide ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Test Files</span>
                      <span className={analysis.code_quality.has_tests ? 'text-green-600' : 'text-red-600'}>
                        {analysis.code_quality.has_tests ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Activity Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Total Commits</span>
                      <span className="font-semibold">
                        {analysis.activity_metrics.total_commits}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Recent Commits (30d)</span>
                      <span className="font-semibold">
                        {analysis.activity_metrics.recent_commits_30_days}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Contributors</span>
                      <span className="font-semibold">
                        {analysis.activity_metrics.contributor_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Issue Resolution Rate</span>
                      <span className="font-semibold">
                        {analysis.activity_metrics.issue_resolution_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Issues and Activity */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Issues Overview</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-gray-900">Open Issues</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">
                      {analysis.issues_summary.open}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-900">Closed Issues</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {analysis.issues_summary.closed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900">Total Issues</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {analysis.issues_summary.total}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Commits</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analysis.recent_commits.map((commit) => (
                    <div key={commit.sha} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {commit.message.split('\n')[0]}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        by {commit.author?.name || 'Unknown'} • {formatDate(commit.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <RepositoryStructure owner={parsed.owner} repo={parsed.repo} />

            {/* AI Insights */}
            {insights && (
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Repository Insights</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-green-600 mb-2">Strengths</h3>
                      <ul className="space-y-1">
                        {insights.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-gray-700 text-sm flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-600 mb-2">Concerns</h3>
                      <ul className="space-y-1">
                        {insights.concerns.map((concern: string, index: number) => (
                          <li key={index} className="text-gray-700 text-sm flex items-start">
                            <span className="text-yellow-500 mr-2">⚠</span>
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Project Details</h2>
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600">Project Type:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {insights.project_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Maturity Level:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {insights.maturity_level}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tech Stack:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {insights.technology_stack.map((tech: string, index: number) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-600 mb-2">Recommendations</h3>
                      <ul className="space-y-1">
                        {insights.recommendations.map((recommendation: string, index: number) => (
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

            {/* Activity Chart */}
            <MetricsChart analysis={analysis} />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#239120',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Go: '#00ADD8',
    Rust: '#dea584',
    Swift: '#ffac45',
    Kotlin: '#F18E33',
    Dart: '#00B4AB',
    HTML: '#e34c26',
    CSS: '#1572B6',
    Shell: '#89e051',
    Vue: '#2c3e50',
  };
  return colors[language] || '#8b5cf6';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
