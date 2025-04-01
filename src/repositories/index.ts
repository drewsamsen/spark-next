import { getDbClient, DbClient } from '@/lib/db';
import { SparksRepository } from './sparks.repository';
import { BooksRepository } from './books.repository';
import { HighlightsRepository } from './highlights.repository';
import { CategoriesRepository } from './categories.repository';
import { TagsRepository } from './tags.repository';

/**
 * Registry of repositories
 * Maintains singleton instances for database access layers
 */
class RepositoriesRegistry {
  private client: DbClient;
  private sparksRepo: SparksRepository | null = null;
  private booksRepo: BooksRepository | null = null;
  private highlightsRepo: HighlightsRepository | null = null;
  private categoriesRepo: CategoriesRepository | null = null;
  private tagsRepo: TagsRepository | null = null;
  
  constructor(serverSide: boolean = false) {
    this.client = getDbClient(serverSide);
  }
  
  /**
   * Get the Sparks repository
   */
  get sparks(): SparksRepository {
    if (!this.sparksRepo) {
      this.sparksRepo = new SparksRepository(this.client);
    }
    return this.sparksRepo;
  }
  
  /**
   * Get the Books repository
   */
  get books(): BooksRepository {
    if (!this.booksRepo) {
      this.booksRepo = new BooksRepository(this.client);
    }
    return this.booksRepo;
  }
  
  /**
   * Get the Highlights repository
   */
  get highlights(): HighlightsRepository {
    if (!this.highlightsRepo) {
      this.highlightsRepo = new HighlightsRepository(this.client);
    }
    return this.highlightsRepo;
  }
  
  /**
   * Get the Categories repository
   */
  get categories(): CategoriesRepository {
    if (!this.categoriesRepo) {
      this.categoriesRepo = new CategoriesRepository(this.client);
    }
    return this.categoriesRepo;
  }
  
  /**
   * Get the Tags repository
   */
  get tags(): TagsRepository {
    if (!this.tagsRepo) {
      this.tagsRepo = new TagsRepository(this.client);
    }
    return this.tagsRepo;
  }
  
  /**
   * Reset all repositories (useful for testing)
   */
  reset(): void {
    this.sparksRepo = null;
    this.booksRepo = null;
    this.highlightsRepo = null;
    this.categoriesRepo = null;
    this.tagsRepo = null;
  }
}

// Browser-side repositories (default)
let browserRepositories: RepositoriesRegistry | null = null;

/**
 * Get the repositories registry instance for browser context
 */
export function getRepositories(): RepositoriesRegistry {
  if (!browserRepositories) {
    browserRepositories = new RepositoriesRegistry(false);
  }
  return browserRepositories;
}

/**
 * Get the repositories registry instance for server context
 */
export function getServerRepositories(): RepositoriesRegistry {
  return new RepositoriesRegistry(true);
}

// Re-export repository types for convenience
export type { 
  SparksRepository, 
  BooksRepository, 
  HighlightsRepository, 
  CategoriesRepository, 
  TagsRepository 
};

// Re-export repository domain models for convenience
export type { 
  SparkDomain, 
  BookDomain, 
  HighlightDomain, 
  CategoryDomain, 
  TagDomain 
} from './types';

// Export the registry type
export type { RepositoriesRegistry }; 