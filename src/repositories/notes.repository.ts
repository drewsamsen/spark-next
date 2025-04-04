import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { 
  NoteModel, 
  NoteWithRelations, 
  NoteDomain,
  CreateNoteInput
} from '@/lib/types';

/**
 * Repository for notes
 */
export class NotesRepository extends BaseRepository<NoteModel> {
  constructor(client: DbClient) {
    super(client, 'notes');
  }

  /**
   * Get all notes for the current user
   */
  async getNotes(): Promise<NoteModel[]> {
    try {
      const userId = await this.getUserId();
      
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw new DatabaseError(`Error fetching notes: ${error.message}`);
      
      return data || [];
    } catch (error) {
      console.error('Error in NotesRepository.getNotes:', error);
      throw error;
    }
  }

  /**
   * Get a note by ID
   */
  async getNoteById(id: string): Promise<NoteWithRelations | null> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError(`Error fetching note: ${error.message}`);
      }
      
      return data || null;
    } catch (error) {
      console.error(`Error in NotesRepository.getNoteById for note ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new note
   */
  async createNote(input: CreateNoteInput): Promise<NoteModel> {
    try {
      const userId = await this.getUserId();
      
      const noteData = {
        user_id: userId,
        content: input.content,
        title: input.title || null
      };

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(noteData)
        .select()
        .single();

      if (error) throw new DatabaseError(`Error creating note: ${error.message}`);
      if (!data) throw new DatabaseError('Failed to create note: No data returned');
      
      return data;
    } catch (error) {
      console.error('Error in NotesRepository.createNote:', error);
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(id: string, updates: Partial<NoteModel>): Promise<NoteModel> {
    try {
      const userId = await this.getUserId();
      
      // Remove any properties that shouldn't be updated
      const { id: _, user_id: __, created_at: ___, updated_at: ____, ...validUpdates } = updates;
      
      const { data, error } = await this.client
        .from(this.tableName)
        .update(validUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new DatabaseError(`Error updating note: ${error.message}`);
      if (!data) throw new NotFoundError(`Note with ID ${id} not found or not owned by user`);
      
      return data;
    } catch (error) {
      console.error(`Error in NotesRepository.updateNote for note ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<void> {
    try {
      const userId = await this.getUserId();
      
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new DatabaseError(`Error deleting note: ${error.message}`);
    } catch (error) {
      console.error(`Error in NotesRepository.deleteNote for note ${id}:`, error);
      throw error;
    }
  }

  /**
   * Map a database note model to the domain model
   */
  mapToDomain(note: NoteModel): NoteDomain {
    return {
      id: note.id,
      title: note.title || '',
      content: note.content,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    };
  }
} 