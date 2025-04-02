import { Category, CategorizationAction, CategorizationJob, CategorizationResult, Resource, ResourceType, Tag } from "./types";
import { JobService } from "./services";
import { getRepositories } from "@/repositories";
import { getDbClient } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export class JobServiceImpl implements JobService {
  /**
   * Create a new categorization job
   */
  async createJob(job: CategorizationJob): Promise<CategorizationResult> {
    const db = getDbClient();
    const repos = getRepositories();
    const createdResources = {
      categories: [] as Category[],
      tags: [] as Tag[]
    };
    
    try {
      // Start a transaction
      const { data: newJob, error: jobError } = await db
        .from('categorization_jobs')
        .insert({
          user_id: job.userId,
          name: job.name,
          source: job.source,
          status: 'pending'
        })
        .select()
        .single();
        
      if (jobError || !newJob) {
        throw new Error(`Failed to create job: ${jobError?.message || 'Unknown error'}`);
      }
      
      // Process all create_category and create_tag actions first
      const updatedActions: CategorizationAction[] = [];
      
      for (const action of job.actions) {
        let updatedAction = { ...action };
        
        // Handle category creation actions
        if (action.actionType === 'create_category' && action.categoryName) {
          const slug = generateSlug(action.categoryName);
          
          // Check if category already exists with this name/slug
          const { data: existingCategory } = await db
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();
          
          if (existingCategory) {
            // Convert to add_category action if category already exists
            updatedAction = {
              ...action,
              actionType: 'add_category',
              categoryId: existingCategory.id,
              categoryName: undefined
            };
            updatedActions.push(updatedAction);
            continue;
          }
          
          // Create the new category
          const { data: newCategory, error: createError } = await db
            .from('categories')
            .insert({
              name: action.categoryName,
              slug,
              created_by_job_id: newJob.id
            })
            .select()
            .single();
            
          if (createError || !newCategory) {
            throw new Error(`Failed to create category: ${createError?.message || 'Unknown error'}`);
          }
          
          // Record the created category ID
          updatedAction.createdResourceId = newCategory.id;
          createdResources.categories.push({
            id: newCategory.id,
            name: newCategory.name,
            slug: newCategory.slug
          });
          
          // Create the job action record
          const { data: jobAction, error: actionError } = await db
            .from('categorization_job_actions')
            .insert({
              job_id: newJob.id,
              action_type: 'create_category',
              resource_type: action.resource?.type || 'book', // Default if no resource
              resource_id: action.resource?.id || '00000000-0000-0000-0000-000000000000', // Placeholder if no resource
              category_name: action.categoryName
            })
            .select('id')
            .single();
            
          if (actionError || !jobAction) {
            throw new Error(`Failed to record category creation: ${actionError?.message || 'Unknown error'}`);
          }
          
        } else if (action.actionType === 'create_tag' && action.tagName) {
          // Check if tag already exists with this name
          const { data: existingTag } = await repos.categorization.findTagByName(action.tagName);
          
          if (existingTag) {
            // Convert to add_tag action if tag already exists
            updatedAction = {
              ...action,
              actionType: 'add_tag',
              tagId: existingTag.id,
              tagName: undefined
            };
            updatedActions.push(updatedAction);
            continue;
          }
          
          // Create the new tag
          const { data: newTag, error: createError } = await repos.categorization.createTag(action.tagName);
            
          if (createError || !newTag) {
            throw new Error(`Failed to create tag: ${createError?.message || 'Unknown error'}`);
          }
          
          // Record the created tag ID
          updatedAction.createdResourceId = newTag.id;
          createdResources.tags.push({
            id: newTag.id,
            name: newTag.name
          });
          
          // Create the job action record
          const { data: jobAction, error: actionError } = await db
            .from('categorization_job_actions')
            .insert({
              job_id: newJob.id,
              action_type: 'create_tag',
              resource_type: action.resource?.type || 'book', // Default if no resource
              resource_id: action.resource?.id || '00000000-0000-0000-0000-000000000000', // Placeholder if no resource
              tag_name: action.tagName
            })
            .select('id')
            .single();
            
          if (actionError || !jobAction) {
            throw new Error(`Failed to record tag creation: ${actionError?.message || 'Unknown error'}`);
          }
        }
        
        updatedActions.push(updatedAction);
      }
      
      // Process add_category and add_tag actions
      for (const action of updatedActions) {
        if ((action.actionType === 'add_category' && action.categoryId && action.resource) || 
            (action.actionType === 'add_tag' && action.tagId && action.resource)) {
          
          // Create the job action
          const { data: jobAction, error: actionError } = await db
            .from('categorization_job_actions')
            .insert({
              job_id: newJob.id,
              action_type: action.actionType,
              resource_type: action.resource.type,
              resource_id: action.resource.id,
              category_id: action.categoryId || null,
              tag_id: action.tagId || null
            })
            .select('id')
            .single();
            
          if (actionError) {
            throw new Error(`Failed to create job action: ${actionError.message}`);
          }
          
          if (!jobAction) {
            throw new Error('Failed to retrieve job action ID');
          }
          
          // Apply the action immediately
          if (action.actionType === 'add_category' && action.categoryId) {
            await this.applyAddCategoryAction(action.resource, action.categoryId, jobAction.id);
          } else if (action.actionType === 'add_tag' && action.tagId) {
            await this.applyAddTagAction(action.resource, action.tagId, jobAction.id);
          }
        }
      }
      
      return {
        success: true,
        jobId: newJob.id,
        createdResources: createdResources.categories.length > 0 || createdResources.tags.length > 0 ? createdResources : undefined
      };
    } catch (error) {
      console.error('Error creating job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get a specific job by ID
   */
  async getJob(jobId: string): Promise<CategorizationJob | null> {
    const db = getDbClient();
    
    // Get the job
    const { data: job, error: jobError } = await db
      .from('categorization_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (jobError || !job) {
      console.error('Error fetching job:', jobError);
      return null;
    }
    
    // Get the job actions including created categories/tags
    const { data, error: actionsError } = await db
      .from('categorization_job_actions')
      .select('*')
      .eq('job_id', jobId);
      
    if (actionsError) {
      console.error('Error fetching job actions:', actionsError);
      return null;
    }
    
    // Initialize actions to empty array if null
    const actions = data || [];
    
    // Get any categories/tags created by this job
    const { data: categoriesData } = await db
      .from('categories')
      .select('*')
      .eq('created_by_job_id', jobId);
      
    const { data: tagsData } = await db
      .from('tags')
      .select('*')
      .eq('created_by_job_id', jobId);
      
    // Initialize to empty arrays if null
    const createdCategories = categoriesData || [];
    const createdTags = tagsData || [];
    
    // Transform the data to CategorizationJob
    const categorizationActions: CategorizationAction[] = actions.map(action => {
      // Handle different action types
      if (action.action_type === 'create_category') {
        const createdCategory = createdCategories.find(c => c.name === action.category_name);
        return {
          id: action.id,
          actionType: action.action_type as 'create_category',
          categoryName: action.category_name,
          createdResourceId: createdCategory?.id
        };
      } else if (action.action_type === 'create_tag') {
        const createdTag = createdTags.find(t => t.name === action.tag_name);
        return {
          id: action.id,
          actionType: action.action_type as 'create_tag',
          tagName: action.tag_name,
          createdResourceId: createdTag?.id
        };
      } else {
        return {
          id: action.id,
          actionType: action.action_type as 'add_category' | 'add_tag',
          resource: {
            id: action.resource_id,
            type: action.resource_type as ResourceType,
            userId: job.user_id
          },
          categoryId: action.category_id || undefined,
          tagId: action.tag_id || undefined
        };
      }
    });
    
    return {
      id: job.id,
      userId: job.user_id,
      name: job.name,
      source: job.source as 'ai' | 'user' | 'system',
      status: job.status as 'pending' | 'approved' | 'rejected',
      actions: categorizationActions,
      createdAt: new Date(job.created_at)
    };
  }
  
  /**
   * Get all jobs for the current user with optional filtering
   */
  async getJobs(filters?: { status?: string, source?: string }): Promise<CategorizationJob[]> {
    const db = getDbClient();
    
    let query = db
      .from('categorization_jobs')
      .select('*')
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
      console.error('Error fetching jobs:', error);
      return [];
    }
    
    // Initialize jobs to empty array if null
    const jobs = data || [];
    
    // Return just the basic job info without actions for efficiency
    return jobs.map(job => ({
      id: job.id,
      userId: job.user_id,
      name: job.name,
      source: job.source as 'ai' | 'user' | 'system',
      status: job.status as 'pending' | 'approved' | 'rejected',
      actions: [],  // Actions are loaded separately when a specific job is selected
      createdAt: new Date(job.created_at)
    }));
  }
  
  /**
   * Approve a pending job
   */
  async approveJob(jobId: string): Promise<CategorizationResult> {
    try {
      const db = getDbClient();
      
      // Call the database function to approve the job
      const { error } = await db.rpc('approve_categorization_job', {
        job_id_param: jobId
      });
      
      if (error) {
        throw new Error(`Failed to approve job: ${error.message}`);
      }
      
      return { success: true, jobId };
    } catch (error) {
      console.error('Error approving job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Reject a pending job and undo all its actions
   */
  async rejectJob(jobId: string): Promise<CategorizationResult> {
    try {
      const db = getDbClient();
      
      // Call the database function to reject the job
      const { error } = await db.rpc('reject_categorization_job', {
        job_id_param: jobId
      });
      
      if (error) {
        throw new Error(`Failed to reject job: ${error.message}`);
      }
      
      return { success: true, jobId };
    } catch (error) {
      console.error('Error rejecting job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Find which job added a category/tag to a resource
   */
  async findOriginatingJob(resource: Resource, categoryId?: string, tagId?: string): Promise<CategorizationJob | null> {
    const repos = getRepositories();
    
    let jobActionId: string | null = null;
    
    // Find the job action ID from either category or tag
    if (categoryId) {
      jobActionId = await repos.categorization.findCategoryJobAction(resource, categoryId);
    } else if (tagId) {
      jobActionId = await repos.categorization.findTagJobAction(resource, tagId);
    }
    
    if (!jobActionId) {
      return null;
    }
    
    const db = getDbClient();
    
    // Get the job ID from the action
    const { data: action, error: actionError } = await db
      .from('categorization_job_actions')
      .select('job_id')
      .eq('id', jobActionId)
      .single();
      
    if (actionError || !action) {
      return null;
    }
    
    // Get the full job
    return this.getJob(action.job_id);
  }
  
  /**
   * Apply an add category action
   */
  private async applyAddCategoryAction(resource: Resource, categoryId: string, jobActionId: string): Promise<void> {
    const repos = getRepositories();
    const db = getDbClient();
    const junctionTable = repos.categorization.getCategoryJunctionTable(resource.type);
    const resourceIdColumn = repos.categorization.getResourceIdColumn(resource.type);
    
    await db
      .from(junctionTable)
      .upsert({
        [resourceIdColumn]: resource.id,
        category_id: categoryId,
        job_action_id: jobActionId,
        created_by: 'job'
      });
  }
  
  /**
   * Apply an add tag action
   */
  private async applyAddTagAction(resource: Resource, tagId: string, jobActionId: string): Promise<void> {
    const repos = getRepositories();
    const db = getDbClient();
    const junctionTable = repos.categorization.getTagJunctionTable(resource.type);
    const resourceIdColumn = repos.categorization.getResourceIdColumn(resource.type);
    
    await db
      .from(junctionTable)
      .upsert({
        [resourceIdColumn]: resource.id,
        tag_id: tagId,
        job_action_id: jobActionId,
        created_by: 'job'
      });
  }
} 