import { getRepositories } from '@/repositories';
import { BookDomain, BookModel, CreateBookInput, SidebarItem, HighlightDomain } from '@/lib/types';
import { formatDate } from '@/lib/db';
import { handleServiceError, handleServiceItemError } from '@/lib/errors';
import { BaseService } from './base.service';
import { BooksRepository } from '@/repositories/books.repository';

/**
 * Service for handling books-related operations
 */
class BooksService extends BaseService<BookModel, BooksRepository> {
  constructor() {
    super(getRepositories().books);
  }

  /**
   * Get all books for the current user as sidebar items
   */
  async getBooks(): Promise<SidebarItem[]> {
    try {
      // Get basic book info for listing
      const books = await this.repository.getBasicBookInfo();
      
      // Transform the results into the expected format
      return books.map(book => ({
        id: book.id,
        rwId: book.rwId,
        name: book.title,
        date: formatDate(book.lastHighlightAt),
        highlightsCount: book.numHighlights
      }));
    } catch (error) {
      return handleServiceError<SidebarItem>(error, 'Error in BooksService.getBooks');
    }
  }

  /**
   * Get detailed information for a single book
   */
  async getBookDetails(bookId: string): Promise<BookDomain | null> {
    try {
      const bookWithRelations = await this.repository.getBookById(bookId);
      
      if (!bookWithRelations) {
        return null;
      }
      
      return this.repository.mapToDomain(bookWithRelations);
    } catch (error) {
      return handleServiceItemError<BookDomain>(error, `Error in BooksService.getBookDetails for book ${bookId}`);
    }
  }

  /**
   * Get book details by Readwise ID
   */
  async getBookByReadwiseId(rwId: number): Promise<BookDomain | null> {
    try {
      // First check if we already have this book
      const book = await this.repository.getBookByReadwiseId(rwId);
      
      if (!book) {
        return null;
      }
      
      // Get the full details with relationships
      const bookWithRelations = await this.repository.getBookById(book.id);
      
      if (!bookWithRelations) {
        return null;
      }
      
      return this.repository.mapToDomain(bookWithRelations);
    } catch (error) {
      return handleServiceItemError<BookDomain>(error, `Error in BooksService.getBookByReadwiseId for book rwId ${rwId}`);
    }
  }

  /**
   * Get all highlights for a book
   */
  async getBookHighlights(bookId: string): Promise<HighlightDomain[]> {
    try {
      const highlightsRepo = getRepositories().highlights;
      
      const highlightsWithRelations = await highlightsRepo.getHighlightsByBookId(bookId);
      
      return highlightsWithRelations.map(highlight => 
        highlightsRepo.mapToDomain(highlight)
      );
    } catch (error) {
      return handleServiceError<HighlightDomain>(error, `Error in BooksService.getBookHighlights for book ${bookId}`);
    }
  }

  /**
   * Create a new book
   */
  async createOrUpdateBook(input: CreateBookInput): Promise<BookDomain | null> {
    try {
      // Check if book already exists by Readwise ID
      const existingBook = await this.repository.getBookByReadwiseId(input.rwId);
      
      let bookId: string;
      
      if (existingBook) {
        // Update the existing book
        await this.repository.updateBook(existingBook.id, input);
        bookId = existingBook.id;
      } else {
        // Create a new book
        const newBook = await this.repository.createBook(input);
        bookId = newBook.id;
      }
      
      // Get the full details with relationships
      const bookWithRelations = await this.repository.getBookById(bookId);
      
      if (!bookWithRelations) {
        return null;
      }
      
      return this.repository.mapToDomain(bookWithRelations);
    } catch (error) {
      return handleServiceItemError<BookDomain>(error, 'Error in BooksService.createOrUpdateBook');
    }
  }

  /**
   * Update an existing book
   */
  async updateBook(
    bookId: string, 
    updates: Partial<CreateBookInput>
  ): Promise<BookDomain | null> {
    try {
      // Update the book
      await this.repository.updateBook(bookId, updates);
      
      // Get the updated book with relationships
      const bookWithRelations = await this.repository.getBookById(bookId);
      
      if (!bookWithRelations) {
        return null;
      }
      
      return this.repository.mapToDomain(bookWithRelations);
    } catch (error) {
      return handleServiceItemError<BookDomain>(error, `Error in BooksService.updateBook for book ${bookId}`);
    }
  }
}

/**
 * Export a singleton instance of the BooksService
 */
export const booksService = new BooksService(); 