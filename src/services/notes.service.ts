import { getRepositories } from '@/repositories';
import { NoteDomain, CreateNoteInput } from '@/lib/types';
import { handleServiceError, handleServiceItemError } from '@/lib/errors';

/**
 * Notes service with business logic for notes
 */
class NotesService {
  /**
   * Get all notes for the current user
   */
  async getNotes(): Promise<NoteDomain[]> {
    try {
      const repo = getRepositories().notes;
      const notes = await repo.getNotes();
      return notes.map(note => repo.mapToDomain(note));
    } catch (error) {
      return handleServiceError<NoteDomain>(error, 'Error in notesService.getNotes');
    }
  }

  /**
   * Get a note by ID
   */
  async getNoteById(id: string): Promise<NoteDomain | null> {
    try {
      const repo = getRepositories().notes;
      const note = await repo.getNoteById(id);
      
      if (!note) {
        return null;
      }
      
      return repo.mapToDomain(note);
    } catch (error) {
      return handleServiceItemError<NoteDomain>(error, `Error in notesService.getNoteById for ID ${id}`);
    }
  }

  /**
   * Create a new note
   */
  async createNote(input: CreateNoteInput): Promise<NoteDomain | null> {
    try {
      const repo = getRepositories().notes;
      const newNote = await repo.createNote(input);
      return repo.mapToDomain(newNote);
    } catch (error) {
      return handleServiceItemError<NoteDomain>(error, 'Error in notesService.createNote');
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(id: string, input: Partial<CreateNoteInput>): Promise<NoteDomain | null> {
    try {
      const repo = getRepositories().notes;
      const updatedNote = await repo.updateNote(id, input);
      return repo.mapToDomain(updatedNote);
    } catch (error) {
      return handleServiceItemError<NoteDomain>(error, `Error in notesService.updateNote for ID ${id}`);
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<boolean> {
    try {
      const repo = getRepositories().notes;
      await repo.deleteNote(id);
      return true;
    } catch (error) {
      console.error(`Error in notesService.deleteNote for ID ${id}:`, error);
      return false;
    }
  }
}

// Create singleton instance
const notesService = new NotesService();

// Export the singleton
export { notesService }; 