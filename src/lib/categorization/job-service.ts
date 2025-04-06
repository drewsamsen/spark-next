import { Category, CategorizationAction, CategorizationJob, CategorizationResult, Resource, ResourceType, Tag } from "./types";
import { JobService } from "./services";
import { getRepositories } from "@/repositories";
import { generateSlug } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";

export class JobServiceImpl implements JobService {
  /**
   * Create a new categorization job
   */
  async createJob(job: CategorizationJob): Promise<CategorizationResult> {
    const repos = getRepositories();
    const createdResources = {
      categories: [] as Category[],
      tags: [] as Tag[]
    };
    
    try {
      // Create the job record
      const newJob = await repos.jobs.createJob({
        userId: job.userId,
        name: job.name,
        source: job.source
      });
      
      // Process all create_category and create_tag actions first
      const updatedActions: CategorizationAction[] = [];
      
      for (const action of job.actions) {
        let updatedAction = { ...action };
        
        // Handle category creation actions
        if (action.actionType === 'create_category' && action.categoryName) {
          const slug = generateSlug(action.categoryName);
          
          // Check if category already exists
          const existingCategory = await repos.categories.getCategoryBySlug(slug);
          
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
          const newCategory = await repos.categories.createCategory({
            name: action.categoryName
          });
          
          // Record the created category ID
          updatedAction.createdResourceId = newCategory.id;
          createdResources.categories.push({
            id: newCategory.id,
            name: newCategory.name,
            slug: newCategory.slug
          });
          
          // Create the job action record
          const jobAction = await repos.jobs.createJobAction({
            jobId: newJob.id,
            actionType: 'create_category',
            resourceType: action.resource?.type || 'book', // Default if no resource
            resourceId: action.resource?.id || '00000000-0000-0000-0000-000000000000', // Placeholder if no resource
            categoryName: action.categoryName
          });
            
        } else if (action.actionType === 'create_tag' && action.tagName) {
          // Check if tag already exists with this name
          const existingTag = await repos.categorization.findTagByName(action.tagName);
          
          if (existingTag.data) {
            // Convert to add_tag action if tag already exists
            updatedAction = {
              ...action,
              actionType: 'add_tag',
              tagId: existingTag.data.id,
              tagName: undefined
            };
            updatedActions.push(updatedAction);
            continue;
          }
          
          // Create the new tag
          const newTagResult = await repos.categorization.createTag(action.tagName);
          const newTag = newTagResult.data;
            
          if (!newTag) {
            throw new Error(`Failed to create tag: ${newTagResult.error?.message || 'Unknown error'}`);
          }
          
          // Record the created tag ID
          updatedAction.createdResourceId = newTag.id;
          createdResources.tags.push({
            id: newTag.id,
            name: newTag.name
          });
          
          // Create the job action record
          await repos.jobs.createJobAction({
            jobId: newJob.id,
            actionType: 'create_tag',
            resourceType: action.resource?.type || 'book', // Default if no resource
            resourceId: action.resource?.id || '00000000-0000-0000-0000-000000000000', // Placeholder if no resource
            tagName: action.tagName
          });
        }
        
        updatedActions.push(updatedAction);
      }
      
      // Process add_category and add_tag actions
      for (const action of updatedActions) {
        if ((action.actionType === 'add_category' && action.categoryId && action.resource) || 
            (action.actionType === 'add_tag' && action.tagId && action.resource)) {
          
          // Create the job action
          const jobAction = await repos.jobs.createJobAction({
            jobId: newJob.id,
            actionType: action.actionType,
            resourceType: action.resource.type,
            resourceId: action.resource.id,
            categoryId: action.categoryId,
            tagId: action.tagId
          });
          
          // Apply the action immediately
          if (action.actionType === 'add_category' && action.categoryId) {
            await repos.jobs.addCategoryToResource(action.resource, action.categoryId, jobAction.id);
          } else if (action.actionType === 'add_tag' && action.tagId) {
            await repos.jobs.addTagToResource(action.resource, action.tagId, jobAction.id);
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
    const repos = getRepositories();
    
    try {
      // Get the job
      const job = await repos.jobs.getJobById(jobId);
      if (!job) {
        return null;
      }
      
      // Get the job actions
      const actions = await repos.jobs.getJobActions(jobId);
      
      // Get any categories/tags created by this job
      const createdCategories = await repos.jobs.getCategoriesCreatedByJob(jobId);
      const createdTags = await repos.jobs.getTagsCreatedByJob(jobId);
      
      // Transform the data to CategorizationJob
      const categorizationActions: CategorizationAction[] = actions.map(action => {
        // Handle different action types
        if (action.action_type === 'create_category') {
          const createdCategory = createdCategories.find(c => c.name === action.category_name);
          return {
            id: action.id,
            actionType: action.action_type as 'create_category',
            categoryName: action.category_name,
            createdResourceId: createdCategory?.id,
            status: action.status as 'pending' | 'executed' | 'rejected' | 'reverted',
            executedAt: action.executed_at ? new Date(action.executed_at) : undefined
          };
        } else if (action.action_type === 'create_tag') {
          const createdTag = createdTags.find(t => t.name === action.tag_name);
          return {
            id: action.id,
            actionType: action.action_type as 'create_tag',
            tagName: action.tag_name,
            createdResourceId: createdTag?.id,
            status: action.status as 'pending' | 'executed' | 'rejected' | 'reverted',
            executedAt: action.executed_at ? new Date(action.executed_at) : undefined
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
            tagId: action.tag_id || undefined,
            status: action.status as 'pending' | 'executed' | 'rejected' | 'reverted',
            executedAt: action.executed_at ? new Date(action.executed_at) : undefined
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
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  }
  
  /**
   * Get all jobs for the current user with optional filtering
   */
  async getJobs(filters?: { status?: string, source?: string }): Promise<CategorizationJob[]> {
    const repos = getRepositories();
    
    try {
      const jobs = await repos.jobs.getJobs(filters);
      
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
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  }
  
  /**
   * Approve a pending job
   */
  async approveJob(jobId: string): Promise<CategorizationResult> {
    const repos = getRepositories();
    
    try {
      // Get the full job with actions
      const job = await this.getJob(jobId);
      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        };
      }
      
      // Verify the job is in pending status
      if (job.status !== 'pending') {
        return {
          success: false,
          error: `Job is already ${job.status}`
        };
      }
      
      // Update job status to approved
      await repos.jobs.updateJobStatus(jobId, 'approved');
      
      // Separate create and add actions to ensure proper ordering
      const createActions = job.actions.filter(a => 
        a.actionType === 'create_category' || a.actionType === 'create_tag');
      
      const addActions = job.actions.filter(a => 
        a.actionType === 'add_category' || a.actionType === 'add_tag');
      
      const createdResources = {
        categories: [] as Category[],
        tags: [] as Tag[]
      };
      
      // First execute all create actions
      for (const action of createActions) {
        if (!action.id) continue;
        await this.executeAction(action, createdResources);
      }
      
      // Then execute all add actions
      for (const action of addActions) {
        if (!action.id) continue;
        await this.executeAction(action, createdResources);
      }
      
      return {
        success: true,
        jobId,
        createdResources: (createdResources.categories.length > 0 || createdResources.tags.length > 0)
          ? createdResources
          : undefined
      };
    } catch (error) {
      console.error('Error approving job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Reject a pending job and mark all actions as rejected
   */
  async rejectJob(jobId: string): Promise<CategorizationResult> {
    const repos = getRepositories();
    
    try {
      // Get the job
      const job = await this.getJob(jobId);
      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        };
      }
      
      // Verify the job is in pending status
      if (job.status !== 'pending') {
        return {
          success: false,
          error: `Job is already ${job.status}`
        };
      }
      
      // Update job status to rejected
      await repos.jobs.updateJobStatus(jobId, 'rejected');
      
      // Mark all pending actions as rejected
      await repos.jobs.updateAllActionStatusForJob(jobId, 'rejected', { currentStatus: 'pending' });
      
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
   * Revert an approved job
   */
  async revertJob(jobId: string): Promise<CategorizationResult> {
    const repos = getRepositories();
    
    try {
      // Get the job with actions
      const job = await this.getJob(jobId);
      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        };
      }
      
      // Verify the job is in approved status
      if (job.status !== 'approved') {
        return {
          success: false,
          error: `Can only revert approved jobs, current status: ${job.status}`
        };
      }
      
      // Get executed actions
      const executedActions = job.actions.filter(a => a.status === 'executed');
      
      // First revert add actions, then create actions (reverse order)
      const addActions = executedActions.filter(a => 
        a.actionType === 'add_category' || a.actionType === 'add_tag');
      
      const createActions = executedActions.filter(a => 
        a.actionType === 'create_category' || a.actionType === 'create_tag');
      
      // Revert in reverse order - first add actions
      for (const action of addActions) {
        if (!action.id) continue;
        await this.revertAction(action);
      }
      
      // Then create actions
      for (const action of createActions) {
        if (!action.id) continue;
        await this.revertAction(action);
      }
      
      // Update job status to rejected (or could add a 'reverted' status)
      await repos.jobs.updateJobStatus(jobId, 'rejected');
      
      return { success: true, jobId };
    } catch (error) {
      console.error('Error reverting job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Execute a single action
   */
  private async executeAction(
    action: CategorizationAction, 
    createdResources: { categories: Category[], tags: Tag[] }
  ): Promise<void> {
    const repos = getRepositories();
    
    if (!action.id) {
      throw new Error('Action ID is required');
    }
    
    try {
      // Mark action as executing
      await repos.jobs.updateActionStatus(action.id, 'executing');
      
      if (action.actionType === 'create_category' && action.categoryName) {
        // Create category
        const slug = generateSlug(action.categoryName);
        const existingCategory = await repos.categories.getCategoryBySlug(slug);
        
        if (!existingCategory) {
          // Create the new category
          const newCategory = await repos.categories.createCategory({
            name: action.categoryName
          });
          
          // Update the created_by_job_id field
          if (action.id) {
            const jobAction = await repos.jobs.getJobActionById(action.id);
            if (jobAction) {
              // Create a service role client to bypass RLS
              const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                process.env.SUPABASE_SERVICE_ROLE_KEY || '',
                { auth: { persistSession: false } }
              );
              
              // Update the category with the job ID
              await supabaseAdmin
                .from('categories')
                .update({ created_by_job_id: jobAction.job_id })
                .eq('id', newCategory.id);
              
              // Update the action with the new category ID
              await supabaseAdmin
                .from('categorization_job_actions')
                .update({ category_id: newCategory.id })
                .eq('id', action.id);
            }
          }
          
          createdResources.categories.push({
            id: newCategory.id,
            name: newCategory.name,
            slug: newCategory.slug
          });
        }
      } else if (action.actionType === 'create_tag' && action.tagName) {
        // Create tag
        const existingTag = await repos.categorization.findTagByName(action.tagName);
        
        if (!existingTag.data) {
          const newTagResult = await repos.categorization.createTag(action.tagName);
          const newTag = newTagResult.data;
          
          if (newTag) {
            // Update the created_by_job_id field
            if (action.id) {
              const jobAction = await repos.jobs.getJobActionById(action.id);
              if (jobAction) {
                // Create a service role client to bypass RLS
                const supabaseAdmin = createClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
                  { auth: { persistSession: false } }
                );
                
                // Update the tag with the job ID
                await supabaseAdmin
                  .from('tags')
                  .update({ created_by_job_id: jobAction.job_id })
                  .eq('id', newTag.id);
                
                // Update the action with the new tag ID
                await supabaseAdmin
                  .from('categorization_job_actions')
                  .update({ tag_id: newTag.id })
                  .eq('id', action.id);
              }
            }
            
            createdResources.tags.push({
              id: newTag.id,
              name: newTag.name
            });
          }
        }
      } else if (action.actionType === 'add_category' && action.resource && action.categoryId) {
        // Add category to resource
        await repos.jobs.addCategoryToResource(action.resource, action.categoryId, action.id);
      } else if (action.actionType === 'add_tag' && action.resource && action.tagId) {
        // Add tag to resource
        await repos.jobs.addTagToResource(action.resource, action.tagId, action.id);
      }
      
      // Mark action as executed
      await repos.jobs.updateActionStatus(action.id, 'executed');
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error);
      // Mark action as failed
      await repos.jobs.updateActionStatus(action.id, 'failed');
      throw error;
    }
  }
  
  /**
   * Revert a single action
   */
  private async revertAction(action: CategorizationAction): Promise<void> {
    const repos = getRepositories();
    
    if (!action.id) {
      throw new Error('Action ID is required');
    }
    
    try {
      // Only revert executed actions
      if (action.status !== 'executed') {
        return;
      }
      
      // Create admin client for direct operations
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        { auth: { persistSession: false } }
      );
      
      if (action.actionType === 'create_category' && action.categoryId) {
        // Get the job ID to check if this category was created by this job
        const jobAction = await repos.jobs.getJobActionById(action.id);
        if (jobAction) {
          // Delete the category if it was created by this job
          await supabaseAdmin
            .from('categories')
            .delete()
            .eq('id', action.categoryId)
            .eq('created_by_job_id', jobAction.job_id);
        }
      } else if (action.actionType === 'create_tag' && action.tagId) {
        // Get the job ID to check if this tag was created by this job
        const jobAction = await repos.jobs.getJobActionById(action.id);
        if (jobAction) {
          // Delete the tag if it was created by this job
          await supabaseAdmin
            .from('tags')
            .delete()
            .eq('id', action.tagId)
            .eq('created_by_job_id', jobAction.job_id);
        }
      } else if (action.actionType === 'add_category' && action.resource && action.categoryId) {
        // Get the appropriate junction table
        const junctionTable = this.getCategoryJunctionTable(action.resource.type);
        const resourceIdColumn = this.getResourceIdColumn(action.resource.type);
        
        // Remove the category from the resource
        await supabaseAdmin
          .from(junctionTable)
          .delete()
          .eq(resourceIdColumn, action.resource.id)
          .eq('category_id', action.categoryId)
          .eq('job_action_id', action.id);
      } else if (action.actionType === 'add_tag' && action.resource && action.tagId) {
        // Get the appropriate junction table
        const junctionTable = this.getTagJunctionTable(action.resource.type);
        const resourceIdColumn = this.getResourceIdColumn(action.resource.type);
        
        // Remove the tag from the resource
        await supabaseAdmin
          .from(junctionTable)
          .delete()
          .eq(resourceIdColumn, action.resource.id)
          .eq('tag_id', action.tagId)
          .eq('job_action_id', action.id);
      }
      
      // Mark action as reverted
      await repos.jobs.updateActionStatus(action.id, 'reverted');
    } catch (error) {
      console.error(`Error reverting action ${action.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get the category junction table for a resource type
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
   * Get the tag junction table for a resource type
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
   * Get the resource ID column for junction tables
   */
  private getResourceIdColumn(resourceType: ResourceType): string {
    const idColumns: Record<ResourceType, string> = {
      book: 'book_id',
      highlight: 'highlight_id',
      spark: 'spark_id'
    };
    return idColumns[resourceType];
  }
  
  /**
   * Find which job added a category/tag to a resource
   */
  async findOriginatingJob(resource: Resource, categoryId?: string, tagId?: string): Promise<CategorizationJob | null> {
    const repos = getRepositories();
    
    try {
      let jobActionId: string | null = null;
      
      // Find the job action ID from either category or tag
      if (categoryId) {
        jobActionId = await repos.jobs.findJobActionByCategory(resource.id, resource.type, categoryId);
      } else if (tagId) {
        jobActionId = await repos.jobs.findJobActionByTag(resource.id, resource.type, tagId);
      }
      
      if (!jobActionId) {
        return null;
      }
      
      // Get the job model from the action ID
      const job = await repos.jobs.getJobByActionId(jobActionId);
      if (!job) {
        return null;
      }
      
      // Get the full job with actions
      return this.getJob(job.id);
    } catch (error) {
      console.error('Error finding originating job:', error);
      return null;
    }
  }
} 