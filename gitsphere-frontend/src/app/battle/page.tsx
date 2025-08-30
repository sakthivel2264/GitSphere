import BattleArena from '@/components/battle/BattleArena';

export default function BattlePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BattleArena />
      </div>
    </div>
  );
}
