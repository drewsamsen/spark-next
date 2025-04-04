'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotesService } from '@/hooks';
import { NoteDomain } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';

export default function NoteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const notesService = useNotesService();
  
  const [note, setNote] = useState<NoteDomain | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch note data on component mount
  useEffect(() => {
    async function loadNote() {
      setIsLoading(true);
      try {
        const data = await notesService.getNoteById(noteId);
        setNote(data);
        if (data) {
          setTitle(data.title);
          setContent(data.content);
        }
      } catch (error) {
        console.error('Error loading note:', error);
        toast.error('Failed to load note');
      } finally {
        setIsLoading(false);
      }
    }

    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  // Handle form submission to update the note
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Note content is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedNote = await notesService.updateNote(noteId, {
        title: title.trim() || undefined,
        content
      });
      
      if (updatedNote) {
        toast.success('Note updated successfully');
        setNote(updatedNote);
        setIsEditing(false);
      } else {
        toast.error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle note deletion
  const handleDeleteNote = async () => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    try {
      const deleted = await notesService.deleteNote(noteId);
      
      if (deleted) {
        toast.success('Note deleted successfully');
        router.push('/notes');
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Note Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The note you're looking for could not be found or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/notes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/notes')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <StickyNote className="h-6 w-6" />
              <span>{isEditing ? 'Edit Note' : (note.title || 'Untitled Note')}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Button 
                type="submit" 
                form="note-form"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)}
              >
                Edit Note
              </Button>
            )}
            <Button 
              variant="destructive" 
              onClick={handleDeleteNote}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Note Content */}
        {isEditing ? (
          <form id="note-form" onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full min-h-[300px]"
                required
              />
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(note.updatedAt).toLocaleString()}
            </div>
            <div className="bg-muted/30 p-6 rounded-lg border whitespace-pre-wrap">
              {note.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 