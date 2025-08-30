'use client';

import { GitHubProfile, ProfileStats } from '@/lib/types';
import { formatNumber, formatDate } from '@/lib/utils';
import Card from '@/components/ui/card';
import { MapPin, Calendar, GitBranch, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ProfileCardProps {
  profile: GitHubProfile;
  stats: ProfileStats;
}

export default function ProfileCard({ profile, stats }: ProfileCardProps) {
  return (
    <Card variant="elevated" className="max-w-md">
      <div className="flex items-start space-x-4">
        <Image
          width={64}
          height={64}
          src={profile.avatar_url}
          alt={profile.name || profile.login}
          className="w-16 h-16 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
             <h3 className="text-xl font-bold text-gray-900">
            {profile.name || profile.login}
          </h3>
          <Link href={profile.html_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="inline-block w-6 h-6 text-gray-500 ml-1 cursor-pointer" />
          </Link>
          </div>
          <p className="text-gray-500">@{profile.login}</p>
          {profile.bio && (
            <p className="text-gray-700 mt-2 text-sm">{profile.bio}</p>
          )}
          {profile.blog && (
            <a href={profile.blog.startsWith('https') ? profile.blog : `https://${profile.blog}`} 
              className="text-blue-900 hover:underline text-sm" >{profile.blog}</a>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {profile.location && (
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            {profile.location}
          </div>
        )}
        {profile.company && (
          <div className="flex items-center text-gray-600 text-sm">
            <GitBranch className="w-4 h-4 mr-2" />
            {profile.company}
          </div>
        )}
        <div className="flex items-center text-gray-600 text-sm">
          <Calendar className="w-4 h-4 mr-2" />
          Joined {formatDate(profile.created_at)}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(profile.followers)}
          </div>
          <div className="text-sm text-gray-500">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(stats.total_stars)}
          </div>
          <div className="text-sm text-gray-500">Total Stars</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatNumber(profile.public_repos)}
          </div>
          <div className="text-sm text-gray-500">Repositories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {formatNumber(profile.following)}
          </div>
          <div className="text-sm text-gray-500">Following</div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Account Age:</span>
          <span className="font-semibold">{Math.floor(stats.account_age_days / 365)} years</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Avg Stars/Repo:</span>
          <span className="font-semibold">{stats.avg_stars_per_repo.toFixed(1)}</span>
        </div>
      </div>
    </Card>
  );
}
