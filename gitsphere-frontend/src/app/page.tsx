import Link from 'next/link';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { BarChart3, GitBranch, Swords, TrendingUp, Users, Zap } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: BarChart3,
      title: 'Profile Analyzer',
      description: 'Deep dive into GitHub profiles with comprehensive analytics and insights.',
      href: '/profile-analyzer',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: GitBranch,
      title: 'Repository Analyzer',
      description: 'Analyze repository health, code quality, and community engagement.',
      href: '/repository-analyzer',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Swords,
      title: 'Profile Battle',
      description: 'Compare GitHub profiles in epic battles and see who comes out on top!',
      href: '/battle',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  const stats = [
    { label: 'Profiles Analyzed', value: '10K+', icon: Users },
    { label: 'Repositories Scanned', value: '50K+', icon: GitBranch },
    { label: 'Battles Fought', value: '2K+', icon: Swords },
    { label: 'Insights Generated', value: '100K+', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            GitSphere
            <span className="block text-blue-600">Profile Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Unleash the power of GitHub analytics with AI-driven insights. Analyze profiles, 
            explore repositories, and battle with fellow developers in the ultimate coding showdown.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/repository-analyzer">
              <Button size="lg" className="px-8">
                <BarChart3 className="w-5 h-5 mr-2" />
                Start Analyzing
              </Button>
            </Link>
            <Link href="/battle">
              <Button variant="outline" size="lg" className="px-8">
                <Swords className="w-5 h-5 mr-2" />
                Battle Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful GitHub Analytics Tools
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our suite of professional tools designed to give you deep insights 
            into GitHub profiles and repositories.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} variant="elevated" className="text-center hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <Icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <Link href={feature.href}>
                  <Button variant="outline" className="w-full">
                    Try Now
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore GitHub Like Never Before?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who use GitSphere to gain insights, 
            improve their profiles, and compete with peers.
          </p>
          <Link href="/profile-analyzer">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              <Zap className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
