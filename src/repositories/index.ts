import { getDbClient, DbClient } from '@/lib/db';
import { SparksRepository } from './sparks.repository';
import { BooksRepository } from './books.repository';
import { HighlightsRepository } from './highlights.repository';
import { CategoriesRepository } from './categories.repository';
import { TagsRepository } from './tags.repository';
import { AuthRepository } from './auth.repository';
import { IntegrationsRepository } from './integrations.repository';
import { FunctionLogsRepository } from './function-logs.repository';
import { UserSettingsRepository } from './user-settings.repository';
import { CategorizationRepository } from './categorization.repository';
import { AutomationsRepository } from './automations.repository';
import { NotesRepository } from './notes.repository';
import { 
  SparkDomain,
  BookDomain,
  HighlightDomain,
  CategoryDomain,
  TagDomain,
  FunctionLogModel
} from '@/lib/types';
import type { AutomationModel, AutomationActionModel } from './automations.repository';

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
  private authRepo: AuthRepository | null = null;
  private integrationsRepo: IntegrationsRepository | null = null;
  private functionLogsRepo: FunctionLogsRepository | null = null;
  private userSettingsRepo: UserSettingsRepository | null = null;
  private categorizationRepo: CategorizationRepository | null = null;
  private automationsRepo: AutomationsRepository | null = null;
  private notesRepo: NotesRepository | null = null;
  
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
   * Get the Auth repository
   */
  get auth(): AuthRepository {
    if (!this.authRepo) {
      this.authRepo = new AuthRepository(this.client);
    }
    return this.authRepo;
  }
  
  /**
   * Get the Integrations repository
   */
  get integrations(): IntegrationsRepository {
    if (!this.integrationsRepo) {
      this.integrationsRepo = new IntegrationsRepository(this.client);
    }
    return this.integrationsRepo;
  }
  
  /**
   * Get the Function Logs repository
   */
  get functionLogs(): FunctionLogsRepository {
    if (!this.functionLogsRepo) {
      this.functionLogsRepo = new FunctionLogsRepository(this.client);
    }
    return this.functionLogsRepo;
  }
  
  /**
   * Get the User Settings repository
   */
  get userSettings(): UserSettingsRepository {
    if (!this.userSettingsRepo) {
      this.userSettingsRepo = new UserSettingsRepository(this.client);
    }
    return this.userSettingsRepo;
  }
  
  /**
   * Get the Categorization repository
   */
  get categorization(): CategorizationRepository {
    if (!this.categorizationRepo) {
      this.categorizationRepo = new CategorizationRepository(this.client);
    }
    return this.categorizationRepo;
  }
  
  /**
   * Get the Automations repository
   */
  get automations(): AutomationsRepository {
    if (!this.automationsRepo) {
      this.automationsRepo = new AutomationsRepository(this.client);
    }
    return this.automationsRepo;
  }
  
  /**
   * Get the Notes repository
   */
  get notes(): NotesRepository {
    if (!this.notesRepo) {
      this.notesRepo = new NotesRepository(this.client);
    }
    return this.notesRepo;
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
    this.authRepo = null;
    this.integrationsRepo = null;
    this.functionLogsRepo = null;
    this.userSettingsRepo = null;
    this.categorizationRepo = null;
    this.automationsRepo = null;
    this.notesRepo = null;
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
  TagsRepository,
  AuthRepository,
  IntegrationsRepository,
  FunctionLogsRepository,
  UserSettingsRepository,
  CategorizationRepository,
  AutomationsRepository
};

// Re-export repository domain models for convenience
export type { 
  SparkDomain, 
  BookDomain, 
  HighlightDomain, 
  CategoryDomain, 
  TagDomain,
  FunctionLogModel,
  AutomationModel,
  AutomationActionModel
};

// Export the registry type
export type { RepositoriesRegistry }; 