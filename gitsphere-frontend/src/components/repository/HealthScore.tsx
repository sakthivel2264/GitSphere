'use client';

import { RepositoryHealth } from '@/lib/types';
import Card from '@/components/ui/card';
import { Users, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface HealthScoreProps {
  healthAssessment: RepositoryHealth;
}

export default function HealthScore({ healthAssessment }: HealthScoreProps) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-8 h-8 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
    return <XCircle className="w-8 h-8 text-red-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Maintained': return 'text-blue-600 bg-blue-100';
      case 'Inactive': return 'text-yellow-600 bg-yellow-100';
      case 'Deprecated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const CircularProgress = ({ value, size = 120, strokeWidth = 8 }: { 
    value: number; 
    size?: number; 
    strokeWidth?: number; 
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    
    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={getHealthColor(value)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getHealthColor(value)}`}>
              {Math.round(value)}
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card variant="elevated">
      <div className="text-center space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Repository Health
          </h3>
          <div className="flex justify-center mb-4">
            <CircularProgress value={healthAssessment.health_score} />
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthAssessment.maintenance_status)}`}>
            {healthAssessment.maintenance_status}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Community</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {healthAssessment.community_engagement.toFixed(1)}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${healthAssessment.community_engagement}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Code Quality</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {healthAssessment.code_quality_score.toFixed(1)}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${healthAssessment.code_quality_score}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Health score is calculated based on activity, community engagement, and code quality metrics.
          </div>
        </div>
      </div>
    </Card>
  );
}
