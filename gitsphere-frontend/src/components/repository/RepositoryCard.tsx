'use client';

import { RepositoryInfo } from '@/lib/types';
import { formatNumber, formatDate } from '@/lib/utils';
import Card from '@/components/ui/card';
import { 
  Star, 
  GitFork, 
  Eye, 
  AlertCircle, 
  Calendar, 
  Tag,
  ExternalLink 
} from 'lucide-react';

interface RepositoryCardProps {
  repository: RepositoryInfo;
}

export default function RepositoryCard({ repository }: RepositoryCardProps) {
  return (
    <Card variant="elevated">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {repository.full_name}
            </h2>
            {repository.description && (
              <p className="text-gray-600 mb-4">{repository.description}</p>
            )}
          </div>
          <a
            href={repository.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-yellow-500 mr-1" />
              <span className="text-xl font-bold text-gray-900">
                {formatNumber(repository.stargazers_count)}
              </span>
            </div>
            <div className="text-sm text-gray-500">Stars</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <GitFork className="w-5 h-5 text-blue-500 mr-1" />
              <span className="text-xl font-bold text-gray-900">
                {formatNumber(repository.forks_count)}
              </span>
            </div>
            <div className="text-sm text-gray-500">Forks</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="w-5 h-5 text-green-500 mr-1" />
              <span className="text-xl font-bold text-gray-900">
                {formatNumber(repository.watchers_count)}
              </span>
            </div>
            <div className="text-sm text-gray-500">Watchers</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-red-500 mr-1" />
              <span className="text-xl font-bold text-gray-900">
                {formatNumber(repository.open_issues_count)}
              </span>
            </div>
            <div className="text-sm text-gray-500">Issues</div>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Created {formatDate(repository.created_at)}</span>
            <span className="mx-2">•</span>
            <span>Updated {formatDate(repository.updated_at)}</span>
          </div>

          {repository.language && (
            <div className="flex items-center text-sm">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ 
                  backgroundColor: getLanguageColor(repository.language) 
                }}
              />
              <span className="font-medium text-gray-900">{repository.language}</span>
            </div>
          )}

          {repository.topics.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {repository.topics.slice(0, 8).map((topic, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {topic}
                  </span>
                ))}
                {repository.topics.length > 8 && (
                  <span className="text-xs text-gray-500">
                    +{repository.topics.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

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
