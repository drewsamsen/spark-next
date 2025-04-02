import { getRepositories } from '@/repositories';
import { BookDomain, CreateBookInput, SidebarItem, HighlightDomain } from '@/lib/types';
import { formatDate } from '@/lib/db';
import { handleServiceError, handleServiceItemError } from '@/lib/errors';

/**
 * Service for handling books-related operations
 */
export const booksService = {
  /**
   * Get all books for the current user as sidebar items
   */
  async getBooks(): Promise<SidebarItem[]> {
    try {
      const repo = getRepositories().books;
      
      // Get basic book info for listing
      const books = await repo.getBasicBookInfo();
      
      // Transform the results into the expected format
      return books.map(book => ({
        id: book.id,
        rwId: book.rwId,
        name: book.title,
        date: formatDate(book.lastHighlightAt),
        highlightsCount: book.numHighlights
      }));
    } catch (error) {
      return handleServiceError<SidebarItem>(error, 'Error in booksService.getBooks');
    }
  },

  /**
   * Get detailed information for a single book
   */
  async getBookDetails(bookId: string): Promise<BookDomain | null> {
    try {
      const repo = getRepositories().books;
      
      const bookWithRelations = await repo.getBookById(bookId);
      
      if (!bookWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(bookWithRelations);
    } catch (error) {
      return handleServiceItemError<BookDomain>(error, `Error in booksService.getBookDetails for book ${bookId}`);
    }
  },

  /**
   * Get book details by Readwise ID
   */
  async getBookByReadwiseId(rwId: number): Promise<BookDomain | null> {
    try {
      const repo = getRepositories().books;
      
      // First check if we already have this book
      const book = await repo.getBookByReadwiseId(rwId);
      
      if (!book) {
        return null;
      }
      
      // Get the full details with relationships
      const bookWithRelations = await repo.getBookById(book.id);
      
      if (!bookWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(bookWithRelations);
    } catch (error) {
      return handleServiceItemError<BookDomain>(error, `Error in booksService.getBookByReadwiseId for book rwId ${rwId}`);
    }
  },

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
      return handleServiceError<HighlightDomain>(error, `Error in booksService.getBookHighlights for book ${bookId}`);
    }
  },

  /**
   * Create a new book
   */
  async createOrUpdateBook(input: CreateBookInput): Promise<BookDomain | null> {
    try {
      const repo = getRepositories().books;
      
      // Check if book already exists by Readwise ID
      const existingBook = await repo.getBookByReadwiseId(input.rwId);
      
      let bookId: string;
      
      if (existingBook) {
        // Update the existing book
        await repo.updateBook(existingBook.id, input);
        bookId = existingBook.id;
      } else {
        // Create a new book
        const newBook = await repo.createBook(input);
        bookId = newBook.id;
      }
      
      // Get the full details with relationships
      const bookWithRelations = await repo.getBookById(bookId);
      
      if (!bookWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(bookWithRelations);
    } catch (error) {
      return handleServiceItemError<BookDomain>(error, 'Error in booksService.createOrUpdateBook');
    }
  },

  /**
   * Update an existing book
   */
  async updateBook(
    bookId: string, 
    updates: Partial<CreateBookInput>
  ): Promise<BookDomain | null> {
    try {
      const repo = getRepositories().books;
      
      // Update the book
      await repo.updateBook(bookId, updates);
      
      // Get the updated book with relationships
      const bookWithRelations = await repo.getBookById(bookId);
      
      if (!bookWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(bookWithRelations);
    } catch (error) {
      return handleServiceItemError<BookDomain>(error, `Error in booksService.updateBook for book ${bookId}`);
    }
  },

  /**
   * Delete a book
   */
  async deleteBook(bookId: string): Promise<boolean> {
    try {
      const repo = getRepositories().books;
      
      await repo.deleteBook(bookId);
      return true;
    } catch (error) {
      console.error(`Error in booksService.deleteBook for book ${bookId}:`, error);
      return false;
    }
  }
}; 