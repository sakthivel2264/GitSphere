import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Github, BarChart3, GitBranch, Swords } from 'lucide-react';
import './globals.css';
import { GitHubOauthStatus } from '@/components/GitHubOauthStatus';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GitSphere - GitHub Profile Intelligence',
  description: 'AI-powered GitHub profile analysis, repository insights, and developer battles',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense>
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="flex items-center space-x-2">
                  <Github className="w-8 h-8 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">GitSphere</span>
                </Link>
                <div className="hidden md:flex space-x-6">
                  <Link 
                    href="/profile-analyzer" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Profile Analyzer</span>
                  </Link>
                  <Link 
                    href="/repository-analyzer" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <GitBranch className="w-4 h-4" />
                    <span>Repository Analyzer</span>
                  </Link>
                  <Link 
                    href="/battle" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Profile Battle</span>
                  </Link>
                </div>
              </div>
              <GitHubOauthStatus/>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center items-center space-x-2 mb-4">
                <Github className="w-6 h-6" />
                <span className="text-xl font-bold">GitSphere</span>
              </div>
              <p className="text-gray-400">
                AI-powered GitHub analytics for developers
              </p>
              <div className="mt-8 text-gray-500 text-sm">
                © {new Date().getFullYear()} GitSphere. App by <Link href={"https://www.linkedin.com/in/sakthivel-pandiyan-625289270/"}><span className="font-semibold">Sakthi &#x2764;</span></Link>. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
        </Suspense>
      </body>
    </html>
  );
}
