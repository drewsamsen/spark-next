'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useNotesService } from '@/hooks';
import { NoteDomain, CreateNoteInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';

export default function NotesPage() {
  const router = useRouter();
  const notesService = useNotesService();
  const [notes, setNotes] = useState<NoteDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch notes on component mount
  useEffect(() => {
    async function loadNotes() {
      setIsLoading(true);
      try {
        const data = await notesService.getNotes();
        setNotes(data);
      } catch (error) {
        console.error('Error loading notes:', error);
        toast.error('Failed to load notes');
      } finally {
        setIsLoading(false);
      }
    }

    loadNotes();
  }, []);

  // Handle form submission to create a new note
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Note content is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newNote = await notesService.createNote({
        title: title.trim() || undefined,
        content
      });
      
      if (newNote) {
        toast.success('Note created successfully');
        
        // Reset form
        setTitle('');
        setContent('');
        
        // Add the new note to the list
        setNotes((prevNotes) => [newNote, ...prevNotes]);
      } else {
        toast.error('Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle clicking a note to view details
  const handleNoteClick = (noteId: string) => {
    router.push(`/notes/${noteId}`);
  };

  // Handle note deletion
  const handleDeleteNote = async (e: React.MouseEvent<HTMLButtonElement>, noteId: string) => {
    e.stopPropagation(); // Prevent navigating to note page
    
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    try {
      const deleted = await notesService.deleteNote(noteId);
      
      if (deleted) {
        toast.success('Note deleted successfully');
        // Remove the deleted note from the list
        setNotes((prevNotes) => prevNotes.filter(note => note.id !== noteId));
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <StickyNote className="h-6 w-6" />
            <span>Notes</span>
          </h1>
        </div>

        {/* Create Note Form */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Create New Note</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Textarea
                placeholder="Note content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[150px]"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={!content.trim() || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Creating...' : 'Create Note'}
            </Button>
          </form>
        </div>

        {/* Notes List */}
        <div>
          <h2 className="text-lg font-medium mb-4">Your Notes</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border">
              <StickyNote className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No Notes Found</h3>
              <p className="text-muted-foreground">Create your first note using the form above.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleNoteClick(note.id)}
                  className="bg-white dark:bg-sidebar p-4 rounded-lg border shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium truncate">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteNote(e, note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {note.content}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 