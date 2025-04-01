import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError, NotFoundError } from '@/lib/errors';

/**
 * Definition of book category
 */
export interface BookCategory {
  id: string;
  name: string;
}

/**
 * Definition of book tag
 */
export interface BookTag {
  id: string;
  name: string;
}

/**
 * Database model for a book
 */
export interface BookModel {
  id: string;
  user_id: string;
  rw_id: number;
  rw_title: string | null;
  rw_author: string | null;
  rw_category: string | null;
  rw_source: string | null;
  rw_num_highlights: number | null;
  rw_last_highlight_at: string | null;
  rw_updated: string | null;
  rw_cover_image_url: string | null;
  rw_highlights_url: string | null;
  rw_source_url: string | null;
  rw_asin: string | null;
  rw_tags: string[] | null;
  rw_document_note: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Detailed book with categories and tags
 */
export interface BookWithRelations extends BookModel {
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
  tags: {
    tag: {
      id: string;
      name: string;
    };
  }[];
}

/**
 * Book domain model
 */
export interface BookDomain {
  id: string;
  rwId: number;
  title: string;
  author: string | null;
  category: string | null;
  source: string | null;
  numHighlights: number;
  lastHighlightAt: string | null;
  coverImageUrl: string | null;
  highlightsUrl: string | null;
  sourceUrl: string | null;
  documentNote: string | null;
  rwTags: string[] | null;
  categories: BookCategory[];
  tags: BookTag[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Basic book info for lists
 */
export interface BookBasicInfo {
  id: string;
  rwId: number;
  title: string;
  numHighlights: number;
  lastHighlightAt: string | null;
}

/**
 * Input to create a new book
 */
export interface CreateBookInput {
  rwId: number;
  rwTitle?: string | null;
  rwAuthor?: string | null;
  rwCategory?: string | null;
  rwSource?: string | null;
  rwNumHighlights?: number | null;
  rwLastHighlightAt?: string | null;
  rwUpdated?: string | null;
  rwCoverImageUrl?: string | null;
  rwHighlightsUrl?: string | null;
  rwSourceUrl?: string | null;
  rwAsin?: string | null;
  rwTags?: string[] | null;
  rwDocumentNote?: string | null;
}

/**
 * Repository for books
 */
export class BooksRepository extends BaseRepository {
  constructor(client: DbClient) {
    super(client);
  }

  /**
   * Get all books for the current user
   */
  async getBooks(): Promise<BookModel[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('rw_title', { ascending: true });
    
    if (error) {
      throw new DatabaseError('Error fetching books', error);
    }
    
    return data;
  }

  /**
   * Get basic book info for listing
   */
  async getBasicBookInfo(): Promise<BookBasicInfo[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('books')
      .select('id, rw_id, rw_title, rw_num_highlights, rw_last_highlight_at')
      .eq('user_id', userId)
      .order('rw_title', { ascending: true });
    
    if (error) {
      throw new DatabaseError('Error fetching books', error);
    }
    
    return data.map(book => ({
      id: book.id,
      rwId: book.rw_id,
      title: book.rw_title || 'Untitled Book',
      numHighlights: book.rw_num_highlights || 0,
      lastHighlightAt: book.rw_last_highlight_at
    }));
  }

  /**
   * Get a book by ID with its related categories and tags
   */
  async getBookById(bookId: string): Promise<BookWithRelations | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('books')
      .select(`
        *,
        categories:book_categories(
          category:categories(id, name)
        ),
        tags:book_tags(
          tag:tags(id, name)
        )
      `)
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching book with ID ${bookId}`, error);
    }
    
    return data as unknown as BookWithRelations;
  }

  /**
   * Get a book by Readwise ID
   */
  async getBookByReadwiseId(rwId: number): Promise<BookModel | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('books')
      .select('*')
      .eq('rw_id', rwId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching book with Readwise ID ${rwId}`, error);
    }
    
    return data;
  }

  /**
   * Create a new book
   */
  async createBook(input: CreateBookInput): Promise<BookModel> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('books')
      .insert({
        user_id: userId,
        rw_id: input.rwId,
        rw_title: input.rwTitle || null,
        rw_author: input.rwAuthor || null,
        rw_category: input.rwCategory || null,
        rw_source: input.rwSource || null,
        rw_num_highlights: input.rwNumHighlights || 0,
        rw_last_highlight_at: input.rwLastHighlightAt || null,
        rw_updated: input.rwUpdated || null,
        rw_cover_image_url: input.rwCoverImageUrl || null,
        rw_highlights_url: input.rwHighlightsUrl || null,
        rw_source_url: input.rwSourceUrl || null,
        rw_asin: input.rwAsin || null,
        rw_tags: input.rwTags || null,
        rw_document_note: input.rwDocumentNote || null
      })
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError('Error creating book', error);
    }
    
    return data;
  }

  /**
   * Update an existing book
   */
  async updateBook(
    bookId: string, 
    updates: Partial<CreateBookInput>
  ): Promise<BookModel> {
    const userId = await this.getUserId();
    
    // Verify the book exists and belongs to this user
    await this.verifyUserOwnership('books', bookId, userId);
    
    const { data, error } = await this.client
      .from('books')
      .update({
        rw_title: updates.rwTitle,
        rw_author: updates.rwAuthor,
        rw_category: updates.rwCategory,
        rw_source: updates.rwSource,
        rw_num_highlights: updates.rwNumHighlights,
        rw_last_highlight_at: updates.rwLastHighlightAt,
        rw_updated: updates.rwUpdated,
        rw_cover_image_url: updates.rwCoverImageUrl,
        rw_highlights_url: updates.rwHighlightsUrl,
        rw_source_url: updates.rwSourceUrl,
        rw_asin: updates.rwAsin,
        rw_tags: updates.rwTags,
        rw_document_note: updates.rwDocumentNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError(`Error updating book with ID ${bookId}`, error);
    }
    
    return data;
  }

  /**
   * Delete a book
   */
  async deleteBook(bookId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Verify the book exists and belongs to this user
    await this.verifyUserOwnership('books', bookId, userId);
    
    // Delete the book
    const { error } = await this.client
      .from('books')
      .delete()
      .eq('id', bookId)
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError(`Error deleting book with ID ${bookId}`, error);
    }
  }

  /**
   * Map a database book model with relations to the domain model
   */
  mapToDomain(book: BookWithRelations): BookDomain {
    // Extract categories from the nested structure
    const categories: BookCategory[] = [];
    if (book.categories && Array.isArray(book.categories)) {
      book.categories.forEach(catRel => {
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
    const tags: BookTag[] = [];
    if (book.tags && Array.isArray(book.tags)) {
      book.tags.forEach(tagRel => {
        if (tagRel.tag && typeof tagRel.tag === 'object' && 
            'id' in tagRel.tag && 'name' in tagRel.tag) {
          tags.push({
            id: String(tagRel.tag.id),
            name: String(tagRel.tag.name)
          });
        }
      });
    }

    return {
      id: book.id,
      rwId: book.rw_id,
      title: book.rw_title || 'Untitled Book',
      author: book.rw_author,
      category: book.rw_category,
      source: book.rw_source,
      numHighlights: book.rw_num_highlights || 0,
      lastHighlightAt: book.rw_last_highlight_at,
      coverImageUrl: book.rw_cover_image_url,
      highlightsUrl: book.rw_highlights_url,
      sourceUrl: book.rw_source_url,
      documentNote: book.rw_document_note,
      rwTags: book.rw_tags,
      categories,
      tags,
      createdAt: book.created_at,
      updatedAt: book.updated_at
    };
  }
} 