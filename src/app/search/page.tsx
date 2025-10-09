'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HighlightSearchMode, HighlightSearchResult } from '@/lib/types';
import { useHighlightSearch } from '@/hooks/services/useHighlightSearch';
import { SearchResultCard } from '@/components/Highlights';
import { Loader2, Search, Sparkles, Layers, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchPage() {
  const router = useRouter();
  const [initialQuery, setInitialQuery] = useState('');
  const [initialMode, setInitialMode] = useState<HighlightSearchMode>('keyword');
  const [hasLoadedFromSession, setHasLoadedFromSession] = useState(false);

  const {
    query,
    setQuery,
    mode,
    setMode,
    results,
    isLoading,
    error,
    search
  } = useHighlightSearch('', 'keyword', 50, 0); // No debounce for search page

  // Load search params from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasLoadedFromSession) {
      const savedQuery = sessionStorage.getItem('searchQuery');
      const savedMode = sessionStorage.getItem('searchMode') as HighlightSearchMode;
      
      if (savedQuery) {
        setInitialQuery(savedQuery);
        setQuery(savedQuery);
        
        if (savedMode && ['keyword', 'semantic', 'hybrid'].includes(savedMode)) {
          setInitialMode(savedMode);
          setMode(savedMode);
        }
        
        // Perform the search
        search(savedQuery, savedMode || 'keyword');
        
        // Clear sessionStorage after loading
        sessionStorage.removeItem('searchQuery');
        sessionStorage.removeItem('searchMode');
      }
      
      setHasLoadedFromSession(true);
    }
  }, [hasLoadedFromSession, search, setQuery, setMode]);

  const handleModeChange = (newMode: HighlightSearchMode) => {
    setMode(newMode);
    if (query) {
      search(query, newMode);
    }
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query, mode);
    }
  };

  const getModeIcon = (searchMode: HighlightSearchMode) => {
    switch (searchMode) {
      case 'semantic':
        return <Sparkles className="h-4 w-4" />;
      case 'hybrid':
        return <Layers className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getModeName = (searchMode: HighlightSearchMode) => {
    switch (searchMode) {
      case 'semantic':
        return 'Semantic';
      case 'hybrid':
        return 'Hybrid';
      default:
        return 'Keyword';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Search Highlights</h1>
        
        {/* Search form */}
        <form onSubmit={handleNewSearch} className="mt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search highlights..."
              className="w-full rounded-md border bg-background pl-9 py-2 text-sm outline-none focus:ring-1 focus:ring-spark-primary dark:focus:ring-spark-dark-primary dark:border-spark-dark-neutral/30"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Search mode selector */}
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">Search mode:</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('keyword')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === 'keyword'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              title="Search by exact keywords"
            >
              <Search className="h-3.5 w-3.5" />
              Keyword
            </button>
            
            <button
              type="button"
              onClick={() => handleModeChange('semantic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === 'semantic'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              title="Search by meaning using AI"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Semantic
            </button>
            
            <button
              type="button"
              onClick={() => handleModeChange('hybrid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === 'hybrid'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              title="Combine keyword and semantic search"
            >
              <Layers className="h-3.5 w-3.5" />
              Hybrid
            </button>
          </div>
        </div>
      </div>

      {/* Search info */}
      {query && (
        <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm">
            {getModeIcon(mode)}
            <span className="text-muted-foreground">
              {isLoading ? 'Searching' : 'Results'} for
            </span>
            <span className="font-medium">"{query}"</span>
            <span className="text-muted-foreground">using</span>
            <span className="font-medium">{getModeName(mode)}</span>
            <span className="text-muted-foreground">search</span>
            {!isLoading && results.length > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="font-medium">{results.length} results</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Searching...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
          Error: {error}
        </div>
      )}

      {/* No query state */}
      {!query && !isLoading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Search your highlights</h2>
          <p className="text-muted-foreground">
            Enter a search query above to find highlights using keyword, semantic, or hybrid search.
          </p>
        </div>
      )}

      {/* Empty results */}
      {query && !isLoading && results.length === 0 && !error && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No results found</h2>
          <p className="text-muted-foreground">
            Try adjusting your search query or changing the search mode.
          </p>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="grid gap-6">
          {results.map((highlight) => (
            <SearchResultCard
              key={highlight.id}
              highlight={highlight}
              renderTag={(tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag.name}
                </span>
              )}
              formatDate={(date: string) => new Date(date).toLocaleDateString()}
              highlightMatches={(text: string) => <span>{text}</span>}
              filterTag={null}
              onTagSelect={() => {}}
              onUserNoteChange={() => {}}
              isSavingNote={false}
              searchMode={mode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

