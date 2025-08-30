'use client';

import { useState, useEffect } from 'react';
import { repositoryAnalyzerApi } from '@/lib/api';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { 
  Folder, 
  File, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Code2, 
  Download,
  Search,
  Filter
} from 'lucide-react';

interface FileTreeNode {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  mode?: string;
  sha?: string;
  url?: string;
}

interface RepositoryStructureProps {
  owner: string;
  repo: string;
}

export default function RepositoryStructure({ owner, repo }: RepositoryStructureProps) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileFilter, setFileFilter] = useState('all');

  useEffect(() => {
    fetchRepositoryTree();
  }, [owner, repo]);

  const fetchRepositoryTree = async () => {
    setLoading(true);
    try {
      const response = await repositoryAnalyzerApi.getRepositoryTree(owner, repo);
      if (response.tree) {
        setTree(response.tree);
        // Auto-expand root folders
        const rootFolders = response.tree
          .filter((item: FileTreeNode) => item.type === 'tree' && !item.path.includes('/'))
          .map((item: FileTreeNode) => item.path);
        setExpandedFolders(new Set(rootFolders));
      }
    } catch (error) {
      console.error('Failed to fetch repository tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (path: string) => {
    setLoadingContent(true);
    try {
      const response = await repositoryAnalyzerApi.getFileContent(owner, repo, path);
      setFileContent(response.content);
      setSelectedFile(path);
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      setFileContent('Failed to load file content');
    } finally {
      setLoadingContent(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'structure' | 'code' | 'path') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPath(`${type}-${text.slice(0, 20)}`);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const generateTreeStructure = () => {
    const structure: string[] = [];
    const processedPaths = new Set<string>();
    
    // Build hierarchical structure
    const buildPath = (path: string, level: number = 0) => {
      if (processedPaths.has(path)) return;
      processedPaths.add(path);
      
      const indent = '  '.repeat(level);
      const item = tree.find(t => t.path === path);
      
      if (item?.type === 'tree') {
        structure.push(`${indent}📁 ${path.split('/').pop()}/`);
        
        // Find child items
        const children = tree
          .filter(t => t.path.startsWith(path + '/') && 
                      t.path.split('/').length === path.split('/').length + 1)
          .sort((a, b) => {
            // Folders first, then files
            if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
            return a.path.localeCompare(b.path);
          });
        
        children.forEach(child => buildPath(child.path, level + 1));
      } else if (item?.type === 'blob') {
        structure.push(`${indent}📄 ${path.split('/').pop()}`);
      }
    };

    // Start with root items
    const rootItems = tree
      .filter(item => !item.path.includes('/'))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
        return a.path.localeCompare(b.path);
      });

    rootItems.forEach(item => buildPath(item.path));
    
    return structure.join('\n');
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      js: '🟨', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
      py: '🐍', java: '☕', cpp: '⚙️', c: '⚙️',
      html: '🌐', css: '🎨', json: '📋', xml: '📄',
      md: '📝', txt: '📄', yml: '⚙️', yaml: '⚙️',
      png: '🖼️', jpg: '🖼️', gif: '🖼️', svg: '🖼️',
      pdf: '📕', zip: '📦', tar: '📦', gz: '📦'
    };
    return iconMap[extension || ''] || '📄';
  };

  const getLanguageFromExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp',
      html: 'html', css: 'css', scss: 'scss', sass: 'sass',
      json: 'json', xml: 'xml', yml: 'yaml', yaml: 'yaml',
      md: 'markdown', sh: 'bash', php: 'php', rb: 'ruby',
      go: 'go', rs: 'rust', kt: 'kotlin', swift: 'swift'
    };
    return langMap[extension || ''] || 'text';
  };

  const filteredTree = tree.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.path.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = fileFilter === 'all' ||
      (fileFilter === 'files' && item.type === 'blob') ||
      (fileFilter === 'folders' && item.type === 'tree') ||
      (fileFilter === 'code' && item.type === 'blob' && 
        /\.(js|jsx|ts|tsx|py|java|cpp|c|html|css|json|md)$/i.test(item.path));
    
    return matchesSearch && matchesFilter;
  });

  const renderTreeItem = (item: FileTreeNode, level: number = 0) => {
    const isFolder = item.type === 'tree';
    const isExpanded = expandedFolders.has(item.path);
    const isSelected = selectedFile === item.path;
    
    const children = isFolder ? filteredTree.filter(child => 
      child.path.startsWith(item.path + '/') && 
      child.path.split('/').length === item.path.split('/').length + 1
    ) : [];

    return (
      <div key={item.path} className="select-none">
        <div
          className={`flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(item.path);
            } else {
              fetchFileContent(item.path);
            }
          }}
        >
          {isFolder ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <Folder className="w-4 h-4 text-blue-500" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <span className="text-sm">{getFileIcon(item.path)}</span>
            </>
          )}
          
          <span className="text-sm text-gray-700 flex-1 truncate">
            {item.path.split('/').pop()}
          </span>
          
          {!isFolder && (
            <div className="flex items-center space-x-1">
              <button
                className="p-1 hover:bg-gray-200 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(item.path, 'path');
                }}
                title="Copy path"
              >
                {copiedPath === `path-${item.path.slice(0, 20)}` ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" />
                )}
              </button>
              {item.size && (
                <span className="text-xs text-gray-400">
                  {formatFileSize(item.size)}
                </span>
              )}
            </div>
          )}
        </div>
        
        {isFolder && isExpanded && (
          <div>
            {children
              .sort((a, b) => {
                if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
                return a.path.localeCompare(b.path);
              })
              .map(child => renderTreeItem(child, level + 1))
            }
          </div>
        )}
      </div>
    );
  };

  const rootItems = filteredTree
    .filter(item => !item.path.includes('/'))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
      return a.path.localeCompare(b.path);
    });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Repository Structure */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Repository Structure</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(generateTreeStructure(), 'structure')}
              disabled={loading}
            >
              {copiedPath === 'structure-' ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Tree
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRepositoryTree}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={fileFilter}
            onChange={(e) => setFileFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All</option>
            <option value="files">Files Only</option>
            <option value="folders">Folders Only</option>
            <option value="code">Code Files</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto border rounded-lg bg-gray-50">
            {rootItems.length > 0 ? (
              <div className="p-2">
                {rootItems.map(item => renderTreeItem(item))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm || fileFilter !== 'all' ? 'No files match your criteria' : 'No files found'}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          Total files: {tree.filter(item => item.type === 'blob').length} | 
          Folders: {tree.filter(item => item.type === 'tree').length}
        </div>
      </Card>

      {/* Code Viewer */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedFile ? (
              <div className="flex items-center space-x-2">
                <Code2 className="w-5 h-5" />
                <span className="truncate">{selectedFile.split('/').pop()}</span>
              </div>
            ) : (
              'Code Viewer'
            )}
          </h3>
          {selectedFile && fileContent && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(selectedFile, 'path')}
              >
                {copiedPath === `path-${selectedFile.slice(0, 20)}` ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Path Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Path
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(fileContent, 'code')}
              >
                {copiedPath === `code-${fileContent.slice(0, 20)}` ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Code Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {loadingContent ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : selectedFile && fileContent ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{selectedFile}</span>
              <span>{getLanguageFromExtension(selectedFile)}</span>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-96 text-sm">
                <code className={`language-${getLanguageFromExtension(selectedFile)}`}>
                  {fileContent}
                </code>
              </pre>
              <div className="absolute top-2 right-2 opacity-70 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyToClipboard(fileContent, 'code')}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                  title="Copy code"
                >
                  {copiedPath === `code-${fileContent.slice(0, 20)}` ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {/* File Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 pt-2 border-t">
              <div>
                <span className="font-medium">Lines:</span> {fileContent.split('\n').length}
              </div>
              <div>
                <span className="font-medium">Size:</span> {formatFileSize(new Blob([fileContent]).size)}
              </div>
              <div>
                <span className="font-medium">Type:</span> {getLanguageFromExtension(selectedFile)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <Code2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a file from the repository structure to view its content</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
