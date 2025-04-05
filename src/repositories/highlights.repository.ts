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
export class HighlightsRepository extends BaseRepository {
  constructor(client: DbClient) {
    super(client);
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
      rwTags: highlight.rw_tags,
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
    
    return data.note.content;
  }
} 