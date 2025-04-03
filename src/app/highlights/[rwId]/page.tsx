'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBooksService } from '@/hooks';
import { BookDomain, HighlightDomain } from '@/lib/types'; 
import HighlightsList from '@/components/highlights-list';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Calendar, Book, Hash } from 'lucide-react';
import Image from 'next/image';

export default function HighlightsDetailsPage() {
  const params = useParams();
  const rwId = parseInt(params.rwId as string, 10); // Parse the rwId from the URL
  const booksService = useBooksService();
  const [book, setBook] = useState<BookDomain | null>(null);
  const [highlights, setHighlights] = useState<HighlightDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookData() {
      setIsLoading(true);
      try {
        // Fetch book details by Readwise ID
        const bookDetails = await booksService.getBookByReadwiseId(rwId);
        setBook(bookDetails);

        // Fetch book highlights if the book was found
        if (bookDetails) {
          const bookHighlights = await booksService.getBookHighlights(bookDetails.id);
          setHighlights(bookHighlights);
        }
      } catch (error) {
        console.error('Error loading book data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (rwId && !isNaN(rwId)) {
      loadBookData();
    }
  }, [rwId, booksService]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-40 w-32 rounded-md" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-36" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Highlights Not Found</h2>
          <p className="text-muted-foreground">
            The highlights you're looking for could not be found or you don't have access to them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-8">
        {/* Book Details Section */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Book Cover */}
          <div className="shrink-0">
            {book.coverImageUrl ? (
              <div className="relative h-48 w-36 rounded-md shadow-md overflow-hidden">
                <Image
                  src={book.coverImageUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 w-36 bg-muted rounded-md shadow-md">
                <Book className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Book Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
            {book.author && (
              <p className="text-lg text-muted-foreground mb-4">by {book.author}</p>
            )}
            
            {/* Book Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Category */}
              {book.category && (
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm font-medium text-muted-foreground">Category</div>
                  <div className="text-sm mt-1">{book.category}</div>
                </div>
              )}
              
              {/* Source */}
              {book.source && (
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm font-medium text-muted-foreground">Source</div>
                  <div className="text-sm mt-1">{book.source}</div>
                </div>
              )}
              
              {/* Highlight Count */}
              <div className="bg-muted rounded-lg p-3 flex items-start space-x-2">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Highlights</div>
                  <div className="text-sm mt-1">{book.numHighlights}</div>
                </div>
              </div>
              
              {/* Last Highlight Date */}
              {book.lastHighlightAt && (
                <div className="bg-muted rounded-lg p-3 flex items-start space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Last Highlight</div>
                    <div className="text-sm mt-1">
                      {new Date(book.lastHighlightAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* External Links */}
            {(book.sourceUrl || book.highlightsUrl) && (
              <div className="flex mt-4 space-x-4">
                {book.sourceUrl && (
                  <a 
                    href={book.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Source
                  </a>
                )}
                {book.highlightsUrl && (
                  <a 
                    href={book.highlightsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Readwise
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Book Notes Section */}
        {book.documentNote && (
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">Notes</h3>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line">{book.documentNote}</p>
            </div>
          </div>
        )}
        
        {/* Book Highlights Section */}
        <HighlightsList highlights={highlights} />
      </div>
    </div>
  );
} 