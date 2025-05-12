'use client';

import { useState } from 'react';
import { platforms } from '@/lib/platforms';
import { Post } from '@/types/post';

interface PlatformDistributorProps {
  post: Post;
}

type DistributionResult = Record<string, { 
  success: boolean; 
  url?: string; 
  message?: string;
}>;

export function PlatformDistributor({ post }: PlatformDistributorProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isDistributing, setIsDistributing] = useState(false);
  const [results, setResults] = useState<DistributionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleDistribute = async () => {
    if (selectedPlatforms.length === 0) {
      setError('请至少选择一个平台');
      return;
    }

    setError(null);
    setResults(null);
    setIsDistributing(true);

    try {
      const response = await fetch('/api/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: post.slug,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
      } else {
        setError(data.error || '分发失败');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '分发请求失败');
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="mt-8 p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-4">分发到其他平台</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}
      
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {platforms.map(platform => (
          <div key={platform.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`platform-${platform.id}`}
              checked={selectedPlatforms.includes(platform.id)}
              onChange={() => handlePlatformToggle(platform.id)}
              className="rounded"
              disabled={isDistributing}
            />
            <label htmlFor={`platform-${platform.id}`} className="flex items-center space-x-2">
              <span>{platform.name}</span>
              {platform.requiresAuth && !platform.isAuthenticated && (
                <span className="text-xs text-amber-500">需要授权</span>
              )}
            </label>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleDistribute}
        disabled={isDistributing || selectedPlatforms.length === 0}
        className={`px-4 py-2 rounded-md ${
          isDistributing || selectedPlatforms.length === 0
            ? 'bg-gray-300 cursor-not-allowed dark:bg-gray-700'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isDistributing ? '分发中...' : '分发到选中平台'}
      </button>
      
      {results && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">分发结果</h4>
          <ul className="space-y-2">
            {Object.entries(results).map(([platformId, result]) => {
              const platform = platforms.find(p => p.id === platformId);
              return (
                <li key={platformId} className="flex items-start">
                  <span className={`mr-2 ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                    {result.success ? '✓' : '✗'}
                  </span>
                  <div>
                    <div className="font-medium">{platform?.name || platformId}</div>
                    {result.message && <div className="text-sm text-gray-500">{result.message}</div>}
                    {result.url && (
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        查看文章
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
} 