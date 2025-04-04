import { useCallback } from 'react';
import { notesService } from '@/services';
import { NoteDomain, CreateNoteInput } from '@/lib/types';

/**
 * Hook for accessing the Notes service
 */
export function useNotesService() {
  const getNotes = useCallback(async (): Promise<NoteDomain[]> => {
    return notesService.getNotes();
  }, []);

  const getNoteById = useCallback(async (id: string): Promise<NoteDomain | null> => {
    return notesService.getNoteById(id);
  }, []);

  const createNote = useCallback(async (input: CreateNoteInput): Promise<NoteDomain | null> => {
    return notesService.createNote(input);
  }, []);

  const updateNote = useCallback(async (id: string, input: Partial<CreateNoteInput>): Promise<NoteDomain | null> => {
    return notesService.updateNote(id, input);
  }, []);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    return notesService.deleteNote(id);
  }, []);

  return {
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote
  };
} 