'use client';

import { BattleResult } from '@/lib/types';
import { getDeveloperIcon } from '@/lib/utils';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { Trophy, Medal, Award, Target, Zap, RotateCcw } from 'lucide-react';
import Image from 'next/image';

interface BattleResultProps {
  result: BattleResult;
  onNewBattle: () => void;
}

export default function BattleResultComponent({ result, onNewBattle }: BattleResultProps) {
  const winner = result.participants.find(p => p.username === result.winner);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-500" />;
      default: return <div className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">#{rank}</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Winner Announcement */}
      <Card variant="elevated" className="text-center bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 {winner?.username} Wins!
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Final Score: <span className="font-bold text-yellow-600">{winner?.battle_score.total.toFixed(1)}</span>
        </p>
        <div className="flex justify-center items-center space-x-2 text-gray-600">
          <span>{getDeveloperIcon(winner?.username || 'Developer')}</span>
          <span>Battle ID: {result.battle_id}</span>
        </div>
      </Card>

      {/* Participants Ranking */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Battle Results</h2>
        <div className="space-y-4">
          {result.participants.map((participant) => (
            <div key={participant.username} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getRankIcon(participant.rank)}
                <Image
                  height={48}
                  width={48}
                  src={participant.profile_analysis.profile.avatar_url}
                  alt={participant.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {participant.profile_analysis.profile.name || participant.username}
                  </div>
                  <div className="text-gray-500">@{participant.username}</div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-5 gap-4 text-center">
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(participant.battle_score.total)}`}>
                    {participant.battle_score.total.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-500">
                    {participant.battle_score.activity.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Activity</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-500">
                    {participant.battle_score.quality.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Quality</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-purple-500">
                    {participant.battle_score.impact.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Impact</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-orange-500">
                    {participant.battle_score.consistency.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Consistency</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Key Comparisons */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Head-to-Head Comparison</h2>
        <div className="space-y-4">
          {result.comparisons.map((comparison, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="font-medium text-gray-900">{comparison.metric}</div>
              <div className="text-center">
                <div className="text-sm font-semibold text-green-600">
                  {comparison.winner} wins
                </div>
                <div className="text-xs text-gray-500">{comparison.difference}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Battle Insights */}
      {result.insights.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">AI Insights</h2>
          <div className="space-y-3">
            {result.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(result.recommendations).map(([username, recommendations]) => (
          <Card key={username}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recommendations for @{username}
            </h3>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Zap className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="text-center">
        <Button onClick={onNewBattle} size="lg" className="mr-4">
          <RotateCcw className="w-5 h-5 mr-2" />
          Start New Battle
        </Button>
        <Button variant="outline" size="lg">
          Share Results
        </Button>
      </div>
    </div>
  );
}
