import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { 
  HighlightTag,
  HighlightCategory,
  HighlightModel,
  HighlightWithRelations,
  HighlightDomain,
  CreateHighlightInput
} from '@/lib/types';

/**
 * Repository for highlights
 */
export class HighlightsRepository extends BaseRepository<HighlightModel> {
  constructor(client: DbClient) {
    super(client, 'highlights');
  }

  /**
   * Get highlights for a book
   */
  async getHighlightsByBookId(bookId: string): Promise<HighlightWithRelations[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('highlights')
      .select(`
        *,
        categories:highlight_categories(
          category:categories(id, name)
        ),
        tags:highlight_tags(
          tag:tags(id, name)
        ),
        highlight_notes(
          note_id,
          notes:note_id(content)
        )
      `)
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .order('rw_highlighted_at', { ascending: true });
    
    if (error) {
      throw new DatabaseError(`Error fetching highlights for book ${bookId}`, error);
    }
    
    return data as unknown as HighlightWithRelations[];
  }

  /**
   * Get a highlight by ID
   */
  async getHighlightById(highlightId: string): Promise<HighlightWithRelations | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('highlights')
      .select(`
        *,
        categories:highlight_categories(
          category:categories(id, name)
        ),
        tags:highlight_tags(
          tag:tags(id, name)
        ),
        highlight_notes(
          note_id,
          notes:note_id(content)
        )
      `)
      .eq('id', highlightId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching highlight with ID ${highlightId}`, error);
    }
    
    return data as unknown as HighlightWithRelations;
  }
  
  /**
   * Get a highlight by Readwise ID
   */
  async getHighlightByReadwiseId(rwId: number): Promise<HighlightModel | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('highlights')
      .select('*')
      .eq('rw_id', rwId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching highlight with Readwise ID ${rwId}`, error);
    }
    
    return data;
  }

  /**
   * Create a new highlight
   */
  async createHighlight(input: CreateHighlightInput): Promise<HighlightModel> {
    const userId = await this.getUserId();
    
    // Verify the book exists and belongs to this user
    await this.verifyUserOwnership('books', input.bookId, userId);
    
    const { data, error } = await this.client
      .from('highlights')
      .insert({
        user_id: userId,
        book_id: input.bookId,
        rw_id: input.rwId,
        rw_text: input.rwText,
        rw_note: input.rwNote || null,
        rw_location: input.rwLocation || null,
        rw_location_type: input.rwLocationType || null,
        rw_highlighted_at: input.rwHighlightedAt || null,
        rw_url: input.rwUrl || null,
        rw_color: input.rwColor || null,
        rw_tags: input.rwTags || null
      })
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError('Error creating highlight', error);
    }
    
    return data;
  }

  /**
   * Update an existing highlight
   */
  async updateHighlight(
    highlightId: string, 
    updates: Partial<Omit<CreateHighlightInput, 'bookId' | 'rwId'>>
  ): Promise<HighlightModel> {
    const userId = await this.getUserId();
    
    // Verify the highlight exists and belongs to this user
    await this.verifyUserOwnership('highlights', highlightId, userId);
    
    const { data, error } = await this.client
      .from('highlights')
      .update({
        rw_text: updates.rwText,
        rw_note: updates.rwNote,
        rw_location: updates.rwLocation,
        rw_location_type: updates.rwLocationType,
        rw_highlighted_at: updates.rwHighlightedAt,
        rw_url: updates.rwUrl,
        rw_color: updates.rwColor,
        rw_tags: updates.rwTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', highlightId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError(`Error updating highlight with ID ${highlightId}`, error);
    }
    
    return data;
  }

  /**
   * Update a highlight's user note
   */
  async updateUserNote(highlightId: string, userNote: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Verify the highlight exists and belongs to this user
    await this.verifyUserOwnership('highlights', highlightId, userId);
    
    // First, check if there's an existing note for this highlight
    const { data: existingNotes, error: fetchError } = await this.client
      .from('highlight_notes')
      .select('note_id')
      .eq('highlight_id', highlightId)
      .maybeSingle();
    
    if (fetchError) {
      throw new DatabaseError(`Error checking for existing note for highlight ${highlightId}`, fetchError);
    }
    
    try {
      if (existingNotes?.note_id) {
        // Update existing note
        const { error: updateError } = await this.client
          .from('notes')
          .update({ 
            content: userNote,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNotes.note_id)
          .eq('user_id', userId);
        
        if (updateError) {
          throw new DatabaseError(`Error updating note for highlight ${highlightId}`, updateError);
        }
      } else {
        // Create new note
        const { data: newNote, error: insertNoteError } = await this.client
          .from('notes')
          .insert({
            user_id: userId,
            content: userNote,
            title: 'Highlight Note'
          })
          .select('id')
          .single();
        
        if (insertNoteError || !newNote) {
          throw new DatabaseError(`Error creating note for highlight ${highlightId}`, insertNoteError);
        }
        
        // Link note to highlight
        const { error: linkError } = await this.client
          .from('highlight_notes')
          .insert({
            highlight_id: highlightId,
            note_id: newNote.id
          });
        
        if (linkError) {
          throw new DatabaseError(`Error linking note to highlight ${highlightId}`, linkError);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a highlight
   */
  async deleteHighlight(highlightId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Verify the highlight exists and belongs to this user
    await this.verifyUserOwnership('highlights', highlightId, userId);
    
    // Delete the highlight
    const { error } = await this.client
      .from('highlights')
      .delete()
      .eq('id', highlightId)
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError(`Error deleting highlight with ID ${highlightId}`, error);
    }
  }

  /**
   * Map a database highlight model with relations to the domain model
   */
  mapToDomain(highlight: HighlightWithRelations): HighlightDomain {
    // Extract categories from the nested structure
    const categories: HighlightCategory[] = [];
    if (highlight.categories && Array.isArray(highlight.categories)) {
      highlight.categories.forEach(catRel => {
        if (catRel.category && typeof catRel.category === 'object' && 
            'id' in catRel.category && 'name' in catRel.category) {
          categories.push({
            id: String(catRel.category.id),
            name: String(catRel.category.name)
          });
        }
      });
    }

    // Extract tags from the nested structure
    const tags: HighlightTag[] = [];
    if (highlight.tags && Array.isArray(highlight.tags)) {
      highlight.tags.forEach(tagRel => {
        if (tagRel.tag && typeof tagRel.tag === 'object' && 
            'id' in tagRel.tag && 'name' in tagRel.tag) {
          tags.push({
            id: String(tagRel.tag.id),
            name: String(tagRel.tag.name)
          });
        }
      });
    }

    // Extract user note if available
    let userNote: string | null = null;
    if (highlight.highlight_notes && 
        Array.isArray(highlight.highlight_notes) && 
        highlight.highlight_notes.length > 0 && 
        highlight.highlight_notes[0].notes) {
      userNote = highlight.highlight_notes[0].notes.content;
    }

    return {
      id: highlight.id,
      bookId: highlight.book_id,
      rwId: highlight.rw_id,
      text: highlight.rw_text || '',
      note: highlight.rw_note,
      location: highlight.rw_location,
      locationType: highlight.rw_location_type,
      highlightedAt: highlight.rw_highlighted_at,
      url: highlight.rw_url,
      color: highlight.rw_color,
      categories,
      tags,
      userNote,
      createdAt: highlight.created_at,
      updatedAt: highlight.updated_at
    };
  }

  /**
   * Get the user note for a highlight
   */
  async getUserNote(highlightId: string): Promise<string | null> {
    const userId = await this.getUserId();
    
    // Get the note linked to this highlight
    const { data, error } = await this.client
      .from('highlight_notes')
      .select(`
        note_id,
        note:notes(content)
      `)
      .eq('highlight_id', highlightId)
      .maybeSingle();
    
    if (error) {
      throw new DatabaseError(`Error fetching note for highlight ${highlightId}`, error);
    }
    
    if (!data || !data.note) {
      return null;
    }
    
    // Handle the note data structure - it's an array with a single item
    const noteArray = data.note as unknown as Array<{ content: string }>;
    
    if (noteArray.length === 0 || !noteArray[0]?.content) {
      return null;
    }
    
    return noteArray[0].content;
  }

  /**
   * Get random highlights for a user
   * @param count Number of random highlights to fetch
   * @param overrideUserId Optional user ID to override the session user
   * @returns Array of highlights with relations
   */
  async getRandomHighlights(count: number = 5, overrideUserId?: string): Promise<HighlightWithRelations[]> {
    // Use provided user ID or fall back to session user ID
    const userId = overrideUserId || await this.getUserId();
    
    // First fetch a larger sample of recent highlights (simple query, no joins)
    const { data: recentHighlights, error: fetchError } = await this.client
      .from('highlights')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);  // Sample size of recent highlights
    
    if (fetchError) {
      throw new DatabaseError('Error fetching recent highlights for selection', fetchError);
    }
    
    // If no highlights found, return empty array
    if (!recentHighlights || recentHighlights.length === 0) {
      return [];
    }
    
    // Randomly select highlights from the recent set
    const shuffled = [...recentHighlights].sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, Math.min(count, shuffled.length)).map(h => h.id);
    
    // Now fetch the full highlight data with relations for just these selected IDs
    const { data, error } = await this.client
      .from('highlights')
      .select(`
        *,
        categories:highlight_categories(
          category:categories(id, name)
        ),
        tags:highlight_tags(
          tag:tags(id, name)
        ),
        highlight_notes(
          note_id,
          notes:note_id(content)
        )
      `)
      .in('id', selectedIds)
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError('Error fetching selected highlights details', error);
    }
    
    return (data || []) as unknown as HighlightWithRelations[];
  }

  /**
   * Get highlights that need embeddings generated
   * Returns highlights where embedding is NULL or where the highlight has been updated after embedding was generated
   * 
   * @param limit - Maximum number of highlights to return
   * @param overrideUserId - Optional user ID to override the session user
   * @returns Array of highlights that need embeddings
   */
  async getHighlightsWithoutEmbeddings(limit: number = 5, overrideUserId?: string): Promise<HighlightModel[]> {
    const userId = overrideUserId || await this.getUserId();
    
    const { data, error } = await this.client
      .from('highlights')
      .select('*')
      .eq('user_id', userId)
      .or('embedding.is.null,updated_at.gt.embedding_updated_at')
      .not('rw_text', 'is', null) // Only get highlights with text
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new DatabaseError('Error fetching highlights without embeddings', error);
    }
    
    return data || [];
  }

  /**
   * Update a highlight's embedding and timestamp
   * 
   * @param highlightId - The ID of the highlight to update
   * @param embedding - The embedding vector (1536 dimensions)
   * @param embeddingUpdatedAt - Timestamp when the embedding was generated
   */
  async updateHighlightEmbedding(
    highlightId: string, 
    embedding: number[], 
    embeddingUpdatedAt: string
  ): Promise<void> {
    const userId = await this.getUserId();
    
    // Verify the highlight exists and belongs to this user
    await this.verifyUserOwnership('highlights', highlightId, userId);
    
    // Convert embedding array to pgvector format string
    const embeddingString = `[${embedding.join(',')}]`;
    
    const { error } = await this.client
      .from('highlights')
      .update({
        embedding: embeddingString,
        embedding_updated_at: embeddingUpdatedAt
      })
      .eq('id', highlightId)
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError(`Error updating embedding for highlight ${highlightId}`, error);
    }
  }

  /**
   * Perform semantic search using vector similarity
   * 
   * @param queryEmbedding - The embedding vector of the search query
   * @param limit - Maximum number of results to return
   * @returns Array of highlights with similarity scores
   */
  async semanticSearch(queryEmbedding: number[], limit: number = 10): Promise<Array<HighlightModel & { similarity: number }>> {
    const userId = await this.getUserId();
    
    // Convert embedding array to pgvector format string
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    const { data, error } = await this.client
      .rpc('search_highlights_semantic', {
        query_embedding: embeddingString,
        match_user_id: userId,
        match_count: limit
      });
    
    if (error) {
      throw new DatabaseError('Error performing semantic search', error);
    }
    
    return data || [];
  }

  /**
   * Perform keyword search using full-text search
   * 
   * @param queryText - The search text
   * @param limit - Maximum number of results to return
   * @returns Array of highlights with rank scores
   */
  async keywordSearch(queryText: string, limit: number = 10): Promise<Array<HighlightModel & { rank: number }>> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .rpc('search_highlights_keyword', {
        search_text: queryText,
        match_user_id: userId,
        match_count: limit
      });
    
    if (error) {
      throw new DatabaseError('Error performing keyword search', error);
    }
    
    return data || [];
  }

  /**
   * Perform hybrid search combining keyword and semantic search using Reciprocal Rank Fusion (RRF)
   * 
   * @param queryText - The search text
   * @param queryEmbedding - The embedding vector of the search query
   * @param limit - Maximum number of results to return
   * @returns Array of highlights with combined scores
   */
  async hybridSearch(
    queryText: string, 
    queryEmbedding: number[], 
    limit: number = 10
  ): Promise<Array<HighlightModel & { score: number }>> {
    // Perform both searches in parallel
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(queryEmbedding, limit * 2), // Get more results for better fusion
      this.keywordSearch(queryText, limit * 2)
    ]);

    // Reciprocal Rank Fusion (RRF) algorithm
    // Each result gets a score of 1 / (k + rank) where k is a constant (typically 60)
    const k = 60;
    const scores = new Map<string, { highlight: HighlightModel; score: number }>();

    // Add semantic search scores
    semanticResults.forEach((result, index) => {
      const rank = index + 1;
      const score = 1 / (k + rank);
      scores.set(result.id, {
        highlight: result,
        score: score
      });
    });

    // Add keyword search scores
    keywordResults.forEach((result, index) => {
      const rank = index + 1;
      const score = 1 / (k + rank);
      const existing = scores.get(result.id);
      if (existing) {
        // Combine scores if highlight appears in both results
        existing.score += score;
      } else {
        scores.set(result.id, {
          highlight: result,
          score: score
        });
      }
    });

    // Sort by combined score and return top results
    const sortedResults = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        ...item.highlight,
        score: item.score
      }));

    return sortedResults;
  }
} 