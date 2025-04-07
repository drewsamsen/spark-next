import { Category, CategorizationAction, CategorizationAutomation, CategorizationResult, Resource, ResourceType, Tag, ActionData, AddCategoryActionData, AddTagActionData } from "./types";
import { AutomationService } from "./services";
import { getRepositories, getServerRepositories } from "@/repositories";
import { generateSlug } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";

export class AutomationServiceImpl implements AutomationService {
  /**
   * Create a new categorization automation
   */
  async createAutomation(automation: CategorizationAutomation): Promise<CategorizationResult> {
    const repos = getServerRepositories();
    const createdResources = {
      categories: [] as Category[],
      tags: [] as Tag[]
    };
    
    try {
      // Create the automation record
      const newAutomation = await repos.automations.createAutomation({
        userId: automation.userId,
        name: automation.name,
        source: automation.source
      });
      
      // Process all create_category and create_tag actions first
      const updatedActions: CategorizationAction[] = [];
      
      for (const action of automation.actions) {
        let updatedAction = { ...action };
        
        // Handle actions based on their action data
        const actionData = action.actionData;
        
        if (actionData.action === 'create_category') {
          const slug = generateSlug(actionData.category_name);
          
          // Check if category already exists
          const existingCategory = await repos.categories.getCategoryBySlug(slug);
          
          if (existingCategory) {
            // Convert to add_category action if category already exists
            updatedAction = {
              ...action,
              actionData: {
                action: 'add_category',
                target: 'book', // Default target
                target_id: '00000000-0000-0000-0000-000000000000', // Placeholder
                category_id: existingCategory.id
              }
            };
            updatedActions.push(updatedAction);
            continue;
          }
          
          // Create the new category
          const newCategory = await repos.categories.createCategory({
            name: actionData.category_name
          });
          
          // Record the created category
          createdResources.categories.push({
            id: newCategory.id,
            name: newCategory.name,
            slug: newCategory.slug
          });
          
          // Create the automation action record
          const automationAction = await repos.automations.createAutomationAction({
            automationId: newAutomation.id,
            action_data: {
              action: 'create_category',
              category_name: actionData.category_name
            }
          });
            
        } else if (actionData.action === 'create_tag') {
          // Check if tag already exists with this name
          const existingTag = await repos.categorization.findTagByName(actionData.tag_name);
          
          if (existingTag.data) {
            // Convert to add_tag action if tag already exists
            updatedAction = {
              ...action,
              actionData: {
                action: 'add_tag',
                target: 'book', // Default target
                target_id: '00000000-0000-0000-0000-000000000000', // Placeholder
                tag_id: existingTag.data.id
              }
            };
            updatedActions.push(updatedAction);
            continue;
          }
          
          // Create the new tag
          const newTagResult = await repos.categorization.createTag(actionData.tag_name);
          const newTag = newTagResult.data;
            
          if (!newTag) {
            throw new Error(`Failed to create tag: ${newTagResult.error?.message || 'Unknown error'}`);
          }
          
          // Record the created tag
          createdResources.tags.push({
            id: newTag.id,
            name: newTag.name
          });
          
          // Create the automation action record
          await repos.automations.createAutomationAction({
            automationId: newAutomation.id,
            action_data: {
              action: 'create_tag',
              tag_name: actionData.tag_name
            }
          });
        }
        
        updatedActions.push(updatedAction);
      }
      
      // Process add_category and add_tag actions
      for (const action of updatedActions) {
        const actionData = action.actionData;
        
        if (actionData.action === 'add_category') {
          // Extract resource from action data
          const resource: Resource = {
            id: actionData.target_id,
            type: actionData.target,
            userId: automation.userId
          };
          
          // Create the automation action
          const automationAction = await repos.automations.createAutomationAction({
            automationId: newAutomation.id,
            action_data: {
              action: 'add_category',
              target: actionData.target,
              target_id: actionData.target_id,
              category_id: actionData.category_id
            }
          });
          
          // Apply the action immediately
          await repos.automations.addCategoryToResource(resource, actionData.category_id, automationAction.id);
        } else if (actionData.action === 'add_tag') {
          // Extract resource from action data
          const resource: Resource = {
            id: actionData.target_id,
            type: actionData.target,
            userId: automation.userId
          };
          
          // Create the automation action
          const automationAction = await repos.automations.createAutomationAction({
            automationId: newAutomation.id,
            action_data: {
              action: 'add_tag',
              target: actionData.target,
              target_id: actionData.target_id,
              tag_id: actionData.tag_id
            }
          });
          
          // Apply the action immediately
          await repos.automations.addTagToResource(resource, actionData.tag_id, automationAction.id);
        }
      }
      
      return {
        success: true,
        automationId: newAutomation.id,
        createdResources: createdResources.categories.length > 0 || createdResources.tags.length > 0 ? createdResources : undefined
      };
    } catch (error) {
      console.error('Error creating automation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get a specific automation by ID
   */
  async getAutomation(automationId: string): Promise<CategorizationAutomation | null> {
    const repos = getServerRepositories();
    
    try {
      // Get the automation
      const automation = await repos.automations.getAutomationById(automationId);
      if (!automation) {
        return null;
      }
      
      // Get the automation actions
      const actions = await repos.automations.getAutomationActions(automationId);
      
      // Get any categories/tags created by this automation
      const createdCategories = await repos.automations.getCategoriesCreatedByAutomation(automationId);
      const createdTags = await repos.automations.getTagsCreatedByAutomation(automationId);
      
      // Transform the data to CategorizationAutomation
      const categorizationActions: CategorizationAction[] = actions.map(action => {
        return {
          id: action.id,
          actionData: action.action_data,
          status: action.status as 'pending' | 'executing' | 'executed' | 'failed' | 'rejected' | 'reverted',
          executedAt: action.executed_at ? new Date(action.executed_at) : undefined
        };
      });
      
      return {
        id: automation.id,
        userId: automation.user_id,
        name: automation.name,
        source: automation.source as 'ai' | 'user' | 'system',
        status: automation.status as 'pending' | 'approved' | 'rejected' | 'reverted',
        actions: categorizationActions,
        createdAt: new Date(automation.created_at)
      };
    } catch (error) {
      console.error('Error fetching automation:', error);
      return null;
    }
  }
  
  /**
   * Get all automations for the current user with optional filtering
   */
  async getAutomations(filters?: { status?: string, source?: string }): Promise<CategorizationAutomation[]> {
    const repos = getServerRepositories();
    
    try {
      const automations = await repos.automations.getAutomations(filters);
      
      // Return just the basic automation info without actions for efficiency
      return automations.map(automation => ({
        id: automation.id,
        userId: automation.user_id,
        name: automation.name,
        source: automation.source as 'ai' | 'user' | 'system',
        status: automation.status as 'pending' | 'approved' | 'rejected' | 'reverted',
        actions: [],  // Actions are loaded separately when a specific automation is selected
        createdAt: new Date(automation.created_at)
      }));
    } catch (error) {
      console.error('Error fetching automations:', error);
      return [];
    }
  }
  
  /**
   * Approve a pending automation
   */
  async approveAutomation(automationId: string): Promise<CategorizationResult> {
    const repos = getServerRepositories();
    
    try {
      // Get the full automation with actions
      const automation = await this.getAutomation(automationId);
      if (!automation) {
        return {
          success: false,
          error: 'Automation not found'
        };
      }
      
      // Verify the automation is in pending status
      if (automation.status !== 'pending') {
        return {
          success: false,
          error: `Automation is already ${automation.status}`
        };
      }
      
      // Update automation status to approved
      await repos.automations.updateAutomationStatus(automationId, 'approved');
      
      // Separate create and add actions to ensure proper ordering
      const createActions = automation.actions.filter(a => 
        a.actionData.action === 'create_category' || a.actionData.action === 'create_tag');
      
      const addActions = automation.actions.filter(a => 
        a.actionData.action === 'add_category' || a.actionData.action === 'add_tag');
      
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
        automationId,
        createdResources: (createdResources.categories.length > 0 || createdResources.tags.length > 0)
          ? createdResources
          : undefined
      };
    } catch (error) {
      console.error('Error approving automation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Reject a pending automation and mark all actions as rejected
   */
  async rejectAutomation(automationId: string): Promise<CategorizationResult> {
    const repos = getServerRepositories();
    
    try {
      // Get the automation
      const automation = await this.getAutomation(automationId);
      if (!automation) {
        return {
          success: false,
          error: 'Automation not found'
        };
      }
      
      // Verify the automation is in pending status
      if (automation.status !== 'pending') {
        return {
          success: false,
          error: `Automation is already ${automation.status}`
        };
      }
      
      // Update automation status to rejected
      await repos.automations.updateAutomationStatus(automationId, 'rejected');
      
      // Mark all pending actions as rejected
      await repos.automations.updateAllActionStatusForAutomation(automationId, 'rejected', { currentStatus: 'pending' });
      
      return { success: true, automationId };
    } catch (error) {
      console.error('Error rejecting automation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Revert an approved automation
   */
  async revertAutomation(automationId: string): Promise<CategorizationResult> {
    const repos = getServerRepositories();
    
    try {
      // Get the automation with actions
      const automation = await this.getAutomation(automationId);
      if (!automation) {
        return {
          success: false,
          error: 'Automation not found'
        };
      }
      
      // Verify the automation is in approved status
      if (automation.status !== 'approved') {
        return {
          success: false,
          error: `Can only revert approved automations, current status: ${automation.status}`
        };
      }
      
      // First mark the automation and actions as reverted in the database
      await repos.automations.revertAutomation(automationId);
      
      // Then let the application layer handle the actual reversion
      await repos.automations.revertAutomationActions(automationId);
      
      return { success: true, automationId };
    } catch (error) {
      console.error('Error reverting automation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Execute a single action using JSONB data
   */
  private async executeAction(
    action: CategorizationAction, 
    createdResources: { categories: Category[], tags: Tag[] }
  ): Promise<void> {
    if (!action.id) return;
    
    const actionData = action.actionData;
    
    if (actionData.action === 'create_category') {
      await this.executeCreateCategoryAction(
        action.id, 
        actionData as { action: 'create_category', category_name: string },
        createdResources
      );
    } else if (actionData.action === 'create_tag') {
      await this.executeCreateTagAction(
        action.id, 
        actionData as { action: 'create_tag', tag_name: string },
        createdResources
      );
    } else if (actionData.action === 'add_category') {
      await this.executeAddCategoryAction(
        action.id, 
        actionData as { action: 'add_category', target: ResourceType, target_id: string, category_id: string }
      );
    } else if (actionData.action === 'add_tag') {
      await this.executeAddTagAction(
        action.id, 
        actionData as { action: 'add_tag', target: ResourceType, target_id: string, tag_id: string, tag_name?: string }
      );
    }
  }
  
  private async executeCreateCategoryAction(
    actionId: string, 
    data: { action: 'create_category', category_name: string },
    createdResources: { categories: Category[], tags: Tag[] }
  ): Promise<void> {
    const repos = getServerRepositories();
    
    const newCategory = await repos.categories.createCategory({
      name: data.category_name
    });
    
    createdResources.categories.push({
      id: newCategory.id,
      name: newCategory.name,
      slug: newCategory.slug
    });
    
    await repos.automations.markActionAsExecuted(actionId);
  }
  
  private async executeCreateTagAction(
    actionId: string, 
    data: { action: 'create_tag', tag_name: string },
    createdResources: { categories: Category[], tags: Tag[] }
  ): Promise<void> {
    const repos = getServerRepositories();
    
    const newTagResult = await repos.categorization.createTag(data.tag_name);
    const newTag = newTagResult.data;
    
    if (!newTag) {
      throw new Error(`Failed to create tag: ${newTagResult.error?.message || 'Unknown error'}`);
    }
    
    createdResources.tags.push({
      id: newTag.id,
      name: newTag.name
    });
    
    await repos.automations.markActionAsExecuted(actionId);
  }
  
  private async executeAddCategoryAction(
    actionId: string, 
    data: { action: 'add_category', target: ResourceType, target_id: string, category_id: string }
  ): Promise<void> {
    const repos = getServerRepositories();
    
    const automationAction = await repos.automations.getAutomationActionById(actionId);
    if (!automationAction) {
      throw new Error(`Automation action ${actionId} not found`);
    }
    
    const automation = await repos.automations.getAutomationById(automationAction.automation_id);
    if (!automation) {
      throw new Error(`Automation ${automationAction.automation_id} not found`);
    }
    
    const resource: Resource = {
      id: data.target_id,
      type: data.target,
      userId: automation.user_id
    };
    
    await repos.automations.addCategoryToResource(resource, data.category_id, actionId);
    await repos.automations.markActionAsExecuted(actionId);
  }
  
  private async executeAddTagAction(
    actionId: string, 
    data: { action: 'add_tag', target: ResourceType, target_id: string, tag_id: string, tag_name?: string }
  ): Promise<void> {
    const repos = getServerRepositories();
    
    const automationAction = await repos.automations.getAutomationActionById(actionId);
    if (!automationAction) {
      throw new Error(`Automation action ${actionId} not found`);
    }
    
    const automation = await repos.automations.getAutomationById(automationAction.automation_id);
    if (!automation) {
      throw new Error(`Automation ${automationAction.automation_id} not found`);
    }
    
    const resource: Resource = {
      id: data.target_id,
      type: data.target,
      userId: automation.user_id
    };
    
    // If tag_id is empty and tag_name is provided, find or create the tag
    let tagId = data.tag_id;
    if ((!tagId || tagId.trim() === '') && data.tag_name) {
      // Try to find an existing tag with this name
      const { data: existingTag } = await repos.categorization.findTagByName(data.tag_name);
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // Create the tag if it doesn't exist
        const { data: newTag, error } = await repos.categorization.createTag(data.tag_name);
        if (newTag) {
          tagId = newTag.id;
        } else {
          throw new Error(`Failed to create tag '${data.tag_name}': ${error?.message || 'Unknown error'}`);
        }
      }
    }
    
    await repos.automations.addTagToResource(resource, tagId, actionId);
    await repos.automations.markActionAsExecuted(actionId);
  }
  
  private getCategoryJunctionTable(resourceType: ResourceType): string {
    const tables: Record<ResourceType, string> = {
      book: 'book_categories',
      highlight: 'highlight_categories',
      spark: 'spark_categories'
    };
    
    return tables[resourceType];
  }
  
  private getTagJunctionTable(resourceType: ResourceType): string {
    const tables: Record<ResourceType, string> = {
      book: 'book_tags',
      highlight: 'highlight_tags',
      spark: 'spark_tags'
    };
    
    return tables[resourceType];
  }
  
  private getResourceIdColumn(resourceType: ResourceType): string {
    const columns: Record<ResourceType, string> = {
      book: 'book_id',
      highlight: 'highlight_id',
      spark: 'spark_id'
    };
    
    return columns[resourceType];
  }
  
  /**
   * Find which automation added a category/tag to a resource
   */
  async findOriginatingAutomation(resource: Resource, categoryId?: string, tagId?: string): Promise<CategorizationAutomation | null> {
    if (!categoryId && !tagId) {
      return null; // Must provide either categoryId or tagId
    }
    
    const repos = getServerRepositories();
    let actionId: string | null = null;
    
    if (categoryId) {
      actionId = await repos.categorization.findCategoryAutomationAction(resource, categoryId);
    } else if (tagId) {
      actionId = await repos.categorization.findTagAutomationAction(resource, tagId);
    }
    
    if (!actionId) {
      return null; // No automation found for this category/tag
    }
    
    const automationAction = await repos.automations.getAutomationActionById(actionId);
    if (!automationAction) {
      return null;
    }
    
    return this.getAutomation(automationAction.automation_id);
  }
} 