import { getRepositories } from '@/repositories';
import { HighlightDomain, CreateHighlightInput, HighlightSearchMode, HighlightSearchResult } from '@/lib/types';
import { handleServiceError, handleServiceItemError } from '@/lib/errors';
import { generateEmbedding } from '@/lib/openai';

/**
 * Service for handling highlights-related operations
 */
export const highlightsService = {
  /**
   * Get all highlights for a book
   */
  async getHighlightsByBookId(bookId: string): Promise<HighlightDomain[]> {
    try {
      const repo = getRepositories().highlights;
      
      const highlightsWithRelations = await repo.getHighlightsByBookId(bookId);
      
      return highlightsWithRelations.map(highlight => 
        repo.mapToDomain(highlight)
      );
    } catch (error) {
      return handleServiceError<HighlightDomain>(error, `Error in highlightsService.getHighlightsByBookId for book ${bookId}`);
    }
  },

  /**
   * Get a specific highlight by ID
   */
  async getHighlightById(highlightId: string): Promise<HighlightDomain | null> {
    try {
      const repo = getRepositories().highlights;
      
      const highlightWithRelations = await repo.getHighlightById(highlightId);
      
      if (!highlightWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(highlightWithRelations);
    } catch (error) {
      return handleServiceItemError<HighlightDomain>(error, `Error in highlightsService.getHighlightById for highlight ${highlightId}`);
    }
  },

  /**
   * Get a highlight by Readwise ID
   */
  async getHighlightByReadwiseId(rwId: number): Promise<HighlightDomain | null> {
    try {
      const repo = getRepositories().highlights;
      
      // First check if we already have this highlight
      const highlight = await repo.getHighlightByReadwiseId(rwId);
      
      if (!highlight) {
        return null;
      }
      
      // Get the full details with relationships
      const highlightWithRelations = await repo.getHighlightById(highlight.id);
      
      if (!highlightWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(highlightWithRelations);
    } catch (error) {
      return handleServiceItemError<HighlightDomain>(error, `Error in highlightsService.getHighlightByReadwiseId for highlight rwId ${rwId}`);
    }
  },

  /**
   * Create a new highlight or update if it already exists
   */
  async createOrUpdateHighlight(input: CreateHighlightInput): Promise<HighlightDomain | null> {
    try {
      const repo = getRepositories().highlights;
      
      // Check if highlight already exists by Readwise ID
      const existingHighlight = await repo.getHighlightByReadwiseId(input.rwId);
      
      let highlightId: string;
      
      if (existingHighlight) {
        // Update the existing highlight
        const { bookId, rwId, ...updates } = input;
        await repo.updateHighlight(existingHighlight.id, updates);
        highlightId = existingHighlight.id;
      } else {
        // Create a new highlight
        const newHighlight = await repo.createHighlight(input);
        highlightId = newHighlight.id;
      }
      
      // Get the full details with relationships
      const highlightWithRelations = await repo.getHighlightById(highlightId);
      
      if (!highlightWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(highlightWithRelations);
    } catch (error) {
      return handleServiceItemError<HighlightDomain>(error, 'Error in highlightsService.createOrUpdateHighlight');
    }
  },

  /**
   * Update an existing highlight
   */
  async updateHighlight(
    highlightId: string, 
    updates: Partial<Omit<CreateHighlightInput, 'bookId' | 'rwId'>>
  ): Promise<HighlightDomain | null> {
    try {
      const repo = getRepositories().highlights;
      
      // Update the highlight
      await repo.updateHighlight(highlightId, updates);
      
      // Get the updated highlight with relationships
      const highlightWithRelations = await repo.getHighlightById(highlightId);
      
      if (!highlightWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(highlightWithRelations);
    } catch (error) {
      return handleServiceItemError<HighlightDomain>(error, `Error in highlightsService.updateHighlight for highlight ${highlightId}`);
    }
  },

  /**
   * Delete a highlight
   */
  async deleteHighlight(highlightId: string): Promise<boolean> {
    try {
      const repo = getRepositories().highlights;
      
      await repo.deleteHighlight(highlightId);
      return true;
    } catch (error) {
      console.error(`Error in highlightsService.deleteHighlight for highlight ${highlightId}:`, error);
      return false;
    }
  },

  /**
   * Update user note for a highlight
   */
  async updateUserNote(highlightId: string, note: string): Promise<boolean> {
    try {
      const repo = getRepositories().highlights;
      
      await repo.updateUserNote(highlightId, note);
      return true;
    } catch (error) {
      console.error(`Error in highlightsService.updateUserNote for highlight ${highlightId}:`, error);
      return false;
    }
  },

  /**
   * Extract tags from Readwise tags
   * This converts the Readwise tags format to our internal format
   */
  extractTags(rwTags: (string | { id: string; name: string })[] | null): string[] {
    if (!rwTags || !Array.isArray(rwTags) || rwTags.length === 0) {
      return [];
    }
    
    return rwTags.map(tag => {
      if (typeof tag === 'string') {
        return tag;
      }
      
      if (typeof tag === 'object' && tag !== null && 'name' in tag) {
        return tag.name;
      }
      
      return '';
    }).filter(tag => tag.length > 0);
  },

  /**
   * Search highlights using keyword, semantic, or hybrid search
   * 
   * @param query - The search query text
   * @param mode - Search mode: 'keyword', 'semantic', or 'hybrid'
   * @param limit - Maximum number of results to return (default: 10)
   * @returns Array of highlights with optional similarity/rank scores
   */
  async searchHighlights(
    query: string,
    mode: HighlightSearchMode,
    limit: number = 10
  ): Promise<HighlightSearchResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const repo = getRepositories().highlights;

      // Perform search based on mode
      let results: Array<any> = [];

      switch (mode) {
        case 'keyword': {
          const keywordResults = await repo.keywordSearch(query, limit);
          results = keywordResults.map(r => ({
            ...r,
            score: r.rank
          }));
          break;
        }

        case 'semantic': {
          // Generate embedding for the query
          const queryEmbedding = await generateEmbedding(query);
          const semanticResults = await repo.semanticSearch(queryEmbedding, limit);
          results = semanticResults.map(r => ({
            ...r,
            score: r.similarity
          }));
          break;
        }

        case 'hybrid': {
          // Generate embedding for the query
          const queryEmbedding = await generateEmbedding(query);
          results = await repo.hybridSearch(query, queryEmbedding, limit);
          break;
        }

        default: {
          throw new Error(`Invalid search mode: ${mode}`);
        }
      }

      // Convert results to HighlightSearchResult format
      // We need to get full highlight details with relations for each result
      const highlightIds = results.map(r => r.id);
      
      // Fetch full details for all results in parallel
      const fullHighlights = await Promise.all(
        highlightIds.map(id => repo.getHighlightById(id))
      );

      // Map to domain and add scores
      const searchResults: HighlightSearchResult[] = fullHighlights
        .filter((highlight): highlight is NonNullable<typeof highlight> => highlight !== null)
        .map((highlight, index) => {
          const domain = repo.mapToDomain(highlight);
          const score = results[index]?.score;
          
          return {
            ...domain,
            score: score !== undefined ? score : undefined
          } as HighlightSearchResult;
        });

      return searchResults;
    } catch (error) {
      console.error('Error in highlightsService.searchHighlights:', error);
      return handleServiceError<HighlightSearchResult>(error, 'Error searching highlights');
    }
  }
}; 