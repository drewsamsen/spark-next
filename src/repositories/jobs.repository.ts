import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError } from '@/lib/errors';
import { Resource, ResourceType } from '@/lib/categorization/types';

/**
 * Database model for a categorization job
 */
export interface JobModel {
  id: string;
  user_id: string;
  name: string;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database model for a categorization job action
 */
export interface JobActionModel {
  id: string;
  job_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  category_id?: string;
  tag_id?: string;
  category_name?: string;
  tag_name?: string;
  created_at: string;
}

/**
 * Domain model for a job creation result
 */
export interface JobCreationResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

/**
 * Input to create a new job
 */
export interface CreateJobInput {
  userId: string;
  name: string;
  source: 'ai' | 'user' | 'system';
}

/**
 * Input to create a job action
 */
export interface CreateJobActionInput {
  jobId: string;
  actionType: string;
  resourceType: ResourceType;
  resourceId: string;
  categoryId?: string;
  tagId?: string;
  categoryName?: string;
  tagName?: string;
}

/**
 * Repository for categorization jobs
 */
export class JobsRepository extends BaseRepository {
  constructor(client: DbClient) {
    super(client);
  }

  /**
   * Create a new categorization job
   */
  async createJob(input: CreateJobInput): Promise<JobModel> {
    const { data, error } = await this.client
      .from('categorization_jobs')
      .insert({
        user_id: input.userId,
        name: input.name,
        source: input.source,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError('Error creating categorization job', error);
    }
    
    return data;
  }

  /**
   * Create a new job action
   */
  async createJobAction(input: CreateJobActionInput): Promise<JobActionModel> {
    const actionData: Record<string, any> = {
      job_id: input.jobId,
      action_type: input.actionType,
      resource_type: input.resourceType,
      resource_id: input.resourceId
    };

    // Add optional parameters if they exist
    if (input.categoryId) actionData.category_id = input.categoryId;
    if (input.tagId) actionData.tag_id = input.tagId;
    if (input.categoryName) actionData.category_name = input.categoryName;
    if (input.tagName) actionData.tag_name = input.tagName;

    const { data, error } = await this.client
      .from('categorization_job_actions')
      .insert(actionData)
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError('Error creating job action', error);
    }
    
    return data;
  }

  /**
   * Get a job by ID
   */
  async getJobById(jobId: string): Promise<JobModel | null> {
    const { data, error } = await this.client
      .from('categorization_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching job with ID ${jobId}`, error);
    }
    
    return data;
  }

  /**
   * Get all job actions for a job
   */
  async getJobActions(jobId: string): Promise<JobActionModel[]> {
    const { data, error } = await this.client
      .from('categorization_job_actions')
      .select('*')
      .eq('job_id', jobId);
    
    if (error) {
      throw new DatabaseError(`Error fetching actions for job ${jobId}`, error);
    }
    
    return data;
  }

  /**
   * Get categories created by a job
   */
  async getCategoriesCreatedByJob(jobId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('created_by_job_id', jobId);
    
    if (error) {
      throw new DatabaseError(`Error fetching categories created by job ${jobId}`, error);
    }
    
    return data;
  }

  /**
   * Get tags created by a job
   */
  async getTagsCreatedByJob(jobId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('tags')
      .select('*')
      .eq('created_by_job_id', jobId);
    
    if (error) {
      throw new DatabaseError(`Error fetching tags created by job ${jobId}`, error);
    }
    
    return data;
  }

  /**
   * Get all jobs for the current user with optional filtering
   */
  async getJobs(filters?: { status?: string, source?: string }): Promise<JobModel[]> {
    const userId = await this.getUserId();
    
    let query = this.client
      .from('categorization_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    // Apply filters if provided
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.source) {
      query = query.eq('source', filters.source);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new DatabaseError('Error fetching categorization jobs', error);
    }
    
    return data;
  }

  /**
   * Approve a job by calling the database function
   */
  async approveJob(jobId: string): Promise<void> {
    const { error } = await this.client.rpc('approve_categorization_job', {
      job_id_param: jobId
    });
    
    if (error) {
      throw new DatabaseError(`Error approving job ${jobId}`, error);
    }
  }

  /**
   * Reject a job by calling the database function
   */
  async rejectJob(jobId: string): Promise<void> {
    const { error } = await this.client.rpc('reject_categorization_job', {
      job_id_param: jobId
    });
    
    if (error) {
      throw new DatabaseError(`Error rejecting job ${jobId}`, error);
    }
  }

  /**
   * Find job action that added a category to a resource
   */
  async findJobActionByCategory(resourceId: string, resourceType: ResourceType, categoryId: string): Promise<string | null> {
    const junctionTable = this.getCategoryJunctionTable(resourceType);
    const resourceIdColumn = this.getResourceIdColumn(resourceType);
    
    const { data, error } = await this.client
      .from(junctionTable)
      .select('job_action_id')
      .eq(resourceIdColumn, resourceId)
      .eq('category_id', categoryId)
      .single();
    
    if (error || !data || !data.job_action_id) {
      return null;
    }
    
    return data.job_action_id;
  }

  /**
   * Find job action that added a tag to a resource
   */
  async findJobActionByTag(resourceId: string, resourceType: ResourceType, tagId: string): Promise<string | null> {
    const junctionTable = this.getTagJunctionTable(resourceType);
    const resourceIdColumn = this.getResourceIdColumn(resourceType);
    
    const { data, error } = await this.client
      .from(junctionTable)
      .select('job_action_id')
      .eq(resourceIdColumn, resourceId)
      .eq('tag_id', tagId)
      .single();
    
    if (error || !data || !data.job_action_id) {
      return null;
    }
    
    return data.job_action_id;
  }

  /**
   * Get job by job action ID
   */
  async getJobByActionId(jobActionId: string): Promise<JobModel | null> {
    const { data: action, error: actionError } = await this.client
      .from('categorization_job_actions')
      .select('job_id')
      .eq('id', jobActionId)
      .single();
      
    if (actionError || !action) {
      return null;
    }
    
    return this.getJobById(action.job_id);
  }

  /**
   * Add a category to a resource with job tracking
   */
  async addCategoryToResource(resource: Resource, categoryId: string, jobActionId: string): Promise<void> {
    const junctionTable = this.getCategoryJunctionTable(resource.type);
    const resourceIdColumn = this.getResourceIdColumn(resource.type);
    
    const { error } = await this.client
      .from(junctionTable)
      .upsert({
        [resourceIdColumn]: resource.id,
        category_id: categoryId,
        job_action_id: jobActionId,
        created_by: 'job'
      });
    
    if (error) {
      throw new DatabaseError(`Error adding category to resource`, error);
    }
  }

  /**
   * Add a tag to a resource with job tracking
   */
  async addTagToResource(resource: Resource, tagId: string, jobActionId: string): Promise<void> {
    const junctionTable = this.getTagJunctionTable(resource.type);
    const resourceIdColumn = this.getResourceIdColumn(resource.type);
    
    const { error } = await this.client
      .from(junctionTable)
      .upsert({
        [resourceIdColumn]: resource.id,
        tag_id: tagId,
        job_action_id: jobActionId,
        created_by: 'job'
      });
    
    if (error) {
      throw new DatabaseError(`Error adding tag to resource`, error);
    }
  }
  
  /**
   * Get the appropriate category junction table for a resource type
   */
  private getCategoryJunctionTable(resourceType: ResourceType): string {
    const junctionTables: Record<ResourceType, string> = {
      book: 'book_categories',
      highlight: 'highlight_categories',
      spark: 'spark_categories'
    };
    return junctionTables[resourceType];
  }

  /**
   * Get the appropriate tag junction table for a resource type
   */
  private getTagJunctionTable(resourceType: ResourceType): string {
    const junctionTables: Record<ResourceType, string> = {
      book: 'book_tags',
      highlight: 'highlight_tags',
      spark: 'spark_tags'
    };
    return junctionTables[resourceType];
  }

  /**
   * Get the appropriate resource ID column for a resource type in junction tables
   */
  private getResourceIdColumn(resourceType: ResourceType): string {
    const idColumns: Record<ResourceType, string> = {
      book: 'book_id',
      highlight: 'highlight_id',
      spark: 'spark_id'
    };
    return idColumns[resourceType];
  }
} 