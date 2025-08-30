'use client';

import { RepositoryAnalysis } from '@/lib/types';
import Card from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface MetricsChartProps {
  analysis: RepositoryAnalysis;
}

export default function MetricsChart({ analysis }: MetricsChartProps) {
  // Prepare language data for pie chart
  const languageData = Object.entries(analysis.languages)
    .map(([name, bytes]) => ({
      name,
      value: bytes,
      percentage: ((bytes / Object.values(analysis.languages).reduce((sum, b) => sum + b, 0)) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Prepare activity data
  const activityData = [
    {
      name: 'Health Score',
      value: analysis.health_assessment.health_score,
      color: '#3b82f6'
    },
    {
      name: 'Community',
      value: analysis.health_assessment.community_engagement,
      color: '#10b981'
    },
    {
      name: 'Code Quality',
      value: analysis.health_assessment.code_quality_score,
      color: '#8b5cf6'
    },
    {
      name: 'Documentation',
      value: analysis.code_quality.documentation_coverage,
      color: '#f59e0b'
    },
    {
      name: 'Test Coverage',
      value: analysis.code_quality.test_coverage_estimate,
      color: '#ef4444'
    }
  ];

  // Contributor activity (mock data based on top contributors)
  const contributorData = analysis.contributors.slice(0, 8).map(contributor => ({
    name: contributor.login,
    contributions: contributor.contributions
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-8">
      {/* Repository Metrics Overview */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Repository Metrics Overview</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar 
                dataKey="value" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Language Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Language Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  labelLine={false}
                  fontSize={12}
                >
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatBytes(value), 'Bytes']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Contributors */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Contributors
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={contributorData}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={50}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => [value, 'Contributions']}
                />
                <Bar 
                  dataKey="contributions" 
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Quality Metrics Timeline */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quality Metrics Comparison
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analysis.health_assessment.health_score.toFixed(0)}
            </div>
            <div className="text-sm text-blue-800">Overall Health</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analysis.health_assessment.community_engagement.toFixed(0)}
            </div>
            <div className="text-sm text-green-800">Community</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analysis.health_assessment.code_quality_score.toFixed(0)}
            </div>
            <div className="text-sm text-purple-800">Code Quality</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {analysis.code_quality.documentation_coverage.toFixed(0)}
            </div>
            <div className="text-sm text-yellow-800">Documentation</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {analysis.code_quality.test_coverage_estimate.toFixed(0)}
            </div>
            <div className="text-sm text-red-800">Test Coverage</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
