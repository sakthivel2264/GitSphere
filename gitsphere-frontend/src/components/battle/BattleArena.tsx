/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { BattleRequest } from '@/lib/types';
import { BattleResult } from '@/lib/types';
import { battleApi } from '@/lib/api';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card from '@/components/ui/card';
import BattleResultComponent from './BattleResult';
import { extractGitHubUsername } from '@/utils/github';
import { Swords, Users, Zap, Activity, Target, AlertCircle, CheckCircle } from 'lucide-react';

export default function BattleArena() {
  const [battleRequest, setBattleRequest] = useState<BattleRequest>({
    usernames: ['', ''],
    battle_type: 'comprehensive',
    include_insights: true,
  });
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUsernameChange = (index: number, value: string) => {
    const newUsernames = [...battleRequest.usernames];
    newUsernames[index] = value;
    setBattleRequest({ ...battleRequest, usernames: newUsernames });
  };

  const addParticipant = () => {
    if (battleRequest.usernames.length < 5) {
      setBattleRequest({
        ...battleRequest,
        usernames: [...battleRequest.usernames, ''],
      });
    }
  };

  const removeParticipant = (index: number) => {
    if (battleRequest.usernames.length > 2) {
      const newUsernames = battleRequest.usernames.filter((_, i) => i !== index);
      setBattleRequest({ ...battleRequest, usernames: newUsernames });
    }
  };

  const handleBattle = async () => {
    // Extract usernames from inputs (handles both usernames and URLs)
    const extractedUsernames = battleRequest.usernames
      .map(input => extractGitHubUsername(input))
      .filter((username): username is string => username !== null);
    
    if (extractedUsernames.length < 2) {
      setError('Please enter at least 2 valid GitHub usernames or URLs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await battleApi.startBattle({
        ...battleRequest,
        usernames: extractedUsernames,
      });
      setBattleResult(result);
    } catch (err) {
      setError('Failed to start battle. Please check the usernames and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const battleTypes = [
    { id: 'comprehensive', name: 'Comprehensive', icon: Target, description: 'Balanced across all areas' },
    { id: 'technical', name: 'Technical', icon: Zap, description: 'Focus on code quality' },
    { id: 'social', name: 'Social', icon: Users, description: 'Community engagement' }, // Fixed: Added missing quote
    { id: 'activity', name: 'Activity', icon: Activity, description: 'Coding activity' },
  ];

  // Validate usernames for UI feedback
  const getUsernameStatus = (input: string) => {
    if (!input.trim()) return { valid: null, username: null };
    const username = extractGitHubUsername(input);
    return { valid: username !== null, username };
  };

  if (battleResult) {
    return <BattleResultComponent result={battleResult} onNewBattle={() => setBattleResult(null)} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card variant="elevated">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Swords className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GitHub Profile Battle
          </h1>
          <p className="text-gray-600">
            Compare GitHub profiles and see who comes out on top!
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Battle Participants
            </h3>
            <div className="space-y-3">
              {battleRequest.usernames.map((input, index) => {
                const status = getUsernameStatus(input);
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Input
                        placeholder={`GitHub username or URL ${index + 1} (e.g., octocat or github.com/octocat)`}
                        value={input}
                        onChange={(e) => handleUsernameChange(index, e.target.value)}
                        className={`flex-1 ${
                          input.trim() && !status.valid ? 'border-red-300' : 
                          status.valid ? 'border-green-300' : ''
                        }`}
                      />
                      {battleRequest.usernames.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeParticipant(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    {/* Username validation feedback */}
                    {input.trim() && (
                      <div className="ml-3 text-sm">
                        {status.valid ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Will battle: <strong className="ml-1">{status.username}</strong>
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Invalid username or URL format
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {battleRequest.usernames.length < 5 && (
              <Button
                variant="outline"
                className="mt-3"
                onClick={addParticipant}
              >
                Add Participant
              </Button>
            )}

            {/* Input format help */}
            <div className="mt-4 bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-medium mb-1">Supported formats:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• Username: <code className="bg-white px-1 rounded">octocat</code></div>
                <div>• Full URL: <code className="bg-white px-1 rounded">https://github.com/octocat</code></div>
                <div>• Short URL: <code className="bg-white px-1 rounded">github.com/octocat</code></div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Battle Type
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {battleTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      battleRequest.battle_type === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setBattleRequest({ ...battleRequest, battle_type: type.id as any })}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6 text-blue-600" />
                      <div>
                        <div className="font-semibold text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="insights"
              checked={battleRequest.include_insights}
              onChange={(e) => setBattleRequest({ ...battleRequest, include_insights: e.target.checked })}
              className="mr-3"
            />
            <label htmlFor="insights" className="text-gray-700">
              Include AI-powered insights and recommendations
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleBattle}
            loading={loading}
            disabled={loading || battleRequest.usernames.filter(input => extractGitHubUsername(input)).length < 2}
          >
            {loading ? 'Starting Battle...' : 'Start Battle!'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
