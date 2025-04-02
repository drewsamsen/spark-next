import { Category, CategorizationAction, CategorizationJob, CategorizationResult, Resource, ResourceType, Tag } from "./types";
import { JobService } from "./services";
import { getRepositories } from "@/repositories";
import { generateSlug } from "@/lib/utils";

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
      await repos.jobs.approveJob(jobId);
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
    const repos = getRepositories();
    
    try {
      await repos.jobs.rejectJob(jobId);
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