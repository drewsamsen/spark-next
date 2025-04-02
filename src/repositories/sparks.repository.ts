import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { 
  SparkCategory, 
  SparkTag, 
  SparkModel, 
  SparkWithRelations, 
  SparkDomain,
  CreateSparkInput
} from '@/lib/types';

/**
 * Repository for sparks
 */
export class SparksRepository extends BaseRepository<SparkModel> {
  constructor(client: DbClient) {
    super(client, 'sparks');
  }

  /**
   * Get all sparks for the current user with their related categories and tags
   */
  async getSparks(): Promise<SparkWithRelations[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('sparks')
      .select(`
        id, 
        user_id,
        body, 
        todo_created_at, 
        todo_id,
        md5_uid,
        created_at,
        updated_at,
        categories:spark_categories(
          category:categories(id, name)
        ),
        tags:spark_tags(
          tag:tags(id, name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new DatabaseError('Error fetching sparks', error);
    }
    
    return data as unknown as SparkWithRelations[];
  }

  /**
   * Get a specific spark by ID with its related categories and tags
   */
  async getSparkById(sparkId: string): Promise<SparkWithRelations | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('sparks')
      .select(`
        id, 
        user_id,
        body, 
        todo_created_at, 
        todo_id,
        md5_uid,
        created_at,
        updated_at,
        categories:spark_categories(
          category:categories(id, name)
        ),
        tags:spark_tags(
          tag:tags(id, name)
        )
      `)
      .eq('id', sparkId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // PostgreSQL not found error
        return null;
      }
      throw new DatabaseError(`Error fetching spark with ID ${sparkId}`, error);
    }
    
    return data as unknown as SparkWithRelations;
  }

  /**
   * Create a new spark
   */
  async createSpark(input: CreateSparkInput): Promise<SparkModel> {
    return this.create({
      body: input.body,
      todo_created_at: input.todoCreatedAt || null,
      todo_id: input.todoId || null,
      md5_uid: input.md5Uid || null
    });
  }

  /**
   * Update an existing spark
   */
  async updateSpark(
    sparkId: string, 
    updates: Partial<Omit<CreateSparkInput, 'md5Uid'>>
  ): Promise<SparkModel> {
    return this.update(sparkId, {
      body: updates.body,
      todo_created_at: updates.todoCreatedAt,
      todo_id: updates.todoId
    });
  }

  /**
   * Delete a spark
   * @deprecated Use delete() from BaseRepository instead
   */
  async deleteSpark(sparkId: string): Promise<void> {
    return this.delete(sparkId);
  }

  /**
   * Map a database spark model with relations to the domain model
   */
  mapToDomain(spark: SparkWithRelations): SparkDomain {
    // Extract categories from the nested structure
    const categories: SparkCategory[] = [];
    if (spark.categories && Array.isArray(spark.categories)) {
      spark.categories.forEach(catRel => {
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
    const tags: SparkTag[] = [];
    if (spark.tags && Array.isArray(spark.tags)) {
      spark.tags.forEach(tagRel => {
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
      id: spark.id,
      body: spark.body,
      createdAt: spark.created_at,
      todoCreatedAt: spark.todo_created_at,
      todoId: spark.todo_id,
      md5Uid: spark.md5_uid,
      updatedAt: spark.updated_at,
      categories,
      tags
    };
  }
} 