import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { 
  BookCategory, 
  BookTag, 
  BookModel, 
  BookWithRelations, 
  BookDomain,
  BookBasicInfo,
  CreateBookInput
} from '@/lib/types';

/**
 * Repository for books
 */
export class BooksRepository extends BaseRepository<BookModel> {
  constructor(client: DbClient) {
    super(client, 'books');
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
    return this.create({
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
    });
  }

  /**
   * Update an existing book
   */
  async updateBook(
    bookId: string, 
    updates: Partial<CreateBookInput>
  ): Promise<BookModel> {
    return this.update(bookId, {
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
    });
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