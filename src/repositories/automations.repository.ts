import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError } from '@/lib/errors';
import { Resource, ResourceType, ActionData, AddTagActionData, AddCategoryActionData, CreateTagActionData, CreateCategoryActionData } from '@/lib/categorization/types';
import { createClient } from '@supabase/supabase-js';

/**
 * Database model for an automation
 */
export interface AutomationModel {
  id: string;
  user_id: string;
  name: string;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database model for an automation action
 */
export interface AutomationActionModel {
  id: string;
  automation_id: string;
  action_data: ActionData;
  status: string;
  executed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Domain model for an automation creation result
 */
export interface AutomationCreationResult {
  success: boolean;
  automationId?: string;
  error?: string;
}

/**
 * Input to create a new automation
 */
export interface CreateAutomationInput {
  userId: string;
  name: string;
  source: 'ai' | 'user' | 'system';
}

/**
 * Input to create an automation action
 */
export interface CreateAutomationActionInput {
  automationId: string;
  action_data: ActionData;
}

/**
 * Repository for automations
 */
export class AutomationsRepository extends BaseRepository<AutomationModel> {
  constructor(client: DbClient) {
    super(client, 'automations');
  }

  /**
   * Create a new automation
   */
  async createAutomation(input: CreateAutomationInput): Promise<AutomationModel> {
    const { data, error } = await this.client
      .from('automations')
      .insert({
        user_id: input.userId,
        name: input.name,
        source: input.source,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError('Error creating automation', error);
    }
    
    return data;
  }

  /**
   * Create a new automation action with JSONB data
   */
  async createAutomationAction(input: CreateAutomationActionInput): Promise<AutomationActionModel> {
    const { data, error } = await this.client
      .from('automation_actions')
      .insert({
        automation_id: input.automationId, // Column now named automation_id in the database
        action_data: input.action_data
      })
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError('Error creating automation action', error);
    }
    
    // Map the response to our model with correct naming
    return data as AutomationActionModel;
  }

  /**
   * Get an automation by ID
   */
  async getAutomationById(automationId: string): Promise<AutomationModel | null> {
    const { data, error } = await this.client
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching automation with ID ${automationId}`, error);
    }
    
    return data;
  }

  /**
   * Get all actions for an automation
   */
  async getAutomationActions(automationId: string): Promise<AutomationActionModel[]> {
    const { data, error } = await this.client
      .from('automation_actions')
      .select('*')
      .eq('automation_id', automationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw new DatabaseError(`Error fetching actions for automation ${automationId}`, error);
    }
    
    // Return data directly since column is now named correctly
    return data as AutomationActionModel[];
  }

  /**
   * Get executed automation actions
   */
  async getExecutedAutomationActions(automationId: string): Promise<AutomationActionModel[]> {
    console.log(`Getting executed actions for automation ${automationId}`);
    
    const { data, error } = await this.client
      .from('automation_actions')
      .select('*')
      .eq('automation_id', automationId)
      // .eq('status', 'executed')  // Comment this out
      .order('executed_at', { ascending: true });
    
    if (error) {
      console.error(`Error fetching executed actions:`, error);
      throw new DatabaseError(`Error fetching executed actions for automation ${automationId}`, error);
    }
    
    console.log(`Found ${data.length} executed actions`);
    return data as AutomationActionModel[];
  }

  /**
   * Get categories created by an automation
   */
  async getCategoriesCreatedByAutomation(automationId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('created_by_automation_id', automationId);
    
    if (error) {
      throw new DatabaseError(`Error fetching categories created by automation ${automationId}`, error);
    }
    
    return data;
  }

  /**
   * Get tags created by an automation
   */
  async getTagsCreatedByAutomation(automationId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('tags')
      .select('*')
      .eq('created_by_automation_id', automationId);
    
    if (error) {
      throw new DatabaseError(`Error fetching tags created by automation ${automationId}`, error);
    }
    
    return data;
  }

  /**
   * Get all automations for the current user with optional filtering
   */
  async getAutomations(filters?: { status?: string, source?: string }): Promise<AutomationModel[]> {
    const userId = await this.getUserId();
    
    let query = this.client
      .from('automations')
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
      throw new DatabaseError('Error fetching automations', error);
    }
    
    return data;
  }

  /**
   * Update an automation's status
   */
  async updateAutomationStatus(automationId: string, status: 'pending' | 'approved' | 'rejected' | 'reverted'): Promise<void> {
    const { error } = await this.client
      .from('automations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', automationId);
    
    if (error) {
      throw new DatabaseError(`Error updating automation status for automation ${automationId}`, error);
    }
  }

  /**
   * Approve an automation - directly updates the automation status without calling a stored procedure
   */
  async approveAutomation(automationId: string): Promise<void> {
    await this.updateAutomationStatus(automationId, 'approved');
  }

  /**
   * Reject an automation - directly updates the automation and actions status without calling a stored procedure
   */
  async rejectAutomation(automationId: string): Promise<void> {
    // Update automation status to rejected
    await this.updateAutomationStatus(automationId, 'rejected');
    
    // Mark all pending actions as rejected
    await this.updateAllActionStatusForAutomation(automationId, 'rejected', { currentStatus: 'pending' });
  }

  /**
   * Revert an automation - directly updates the automation and actions status without calling a stored procedure
   * The actual reversion of effects is handled by revertAutomationActions
   */
  async revertAutomation(automationId: string, userId?: string): Promise<void> {
    // First delete the data
    await this.revertAutomationActions(automationId, userId);
    
    // Only then update the statuses
    await this.updateAutomationStatus(automationId, 'reverted');
    await this.updateAllActionStatusForAutomation(automationId, 'reverted', { currentStatus: 'executed' });
  }

  /**
   * Find automation action that added a category to a resource
   */
  async findAutomationActionByCategory(resourceId: string, resourceType: ResourceType, categoryId: string): Promise<string | null> {
    const junctionTable = this.getCategoryJunctionTable(resourceType);
    const resourceIdColumn = this.getResourceIdColumn(resourceType);
    
    const { data, error } = await this.client
      .from(junctionTable)
      .select('automation_action_id')
      .eq(resourceIdColumn, resourceId)
      .eq('category_id', categoryId)
      .single();
    
    if (error || !data || !data.automation_action_id) {
      return null;
    }
    
    return data.automation_action_id;
  }

  /**
   * Find automation action that added a tag to a resource
   */
  async findAutomationActionByTag(resourceId: string, resourceType: ResourceType, tagId: string): Promise<string | null> {
    const junctionTable = this.getTagJunctionTable(resourceType);
    const resourceIdColumn = this.getResourceIdColumn(resourceType);
    
    const { data, error } = await this.client
      .from(junctionTable)
      .select('automation_action_id')
      .eq(resourceIdColumn, resourceId)
      .eq('tag_id', tagId)
      .single();
    
    if (error || !data || !data.automation_action_id) {
      return null;
    }
    
    return data.automation_action_id;
  }

  /**
   * Get automation by action ID
   */
  async getAutomationByActionId(actionId: string): Promise<AutomationModel | null> {
    const { data: action, error: actionError } = await this.client
      .from('automation_actions')
      .select('automation_id')
      .eq('id', actionId)
      .single();
      
    if (actionError || !action) {
      return null;
    }
    
    return this.getAutomationById(action.automation_id);
  }

  /**
   * Add a category to a resource with automation tracking
   */
  async addCategoryToResource(resource: Resource, categoryId: string, automationActionId: string): Promise<void> {
    const junctionTable = this.getCategoryJunctionTable(resource.type);
    const resourceIdColumn = this.getResourceIdColumn(resource.type);
    
    const { error } = await this.client
      .from(junctionTable)
      .upsert({
        [resourceIdColumn]: resource.id,
        category_id: categoryId,
        automation_action_id: automationActionId,
        created_by: 'automation'
      });
    
    if (error) {
      throw new DatabaseError(`Error adding category to resource`, error);
    }
  }

  /**
   * Add a tag to a resource with automation tracking
   */
  async addTagToResource(resource: Resource, tagId: string, automationActionId: string): Promise<void> {
    const junctionTable = this.getTagJunctionTable(resource.type);
    const resourceIdColumn = this.getResourceIdColumn(resource.type);
    
    // Log the parameters for debugging
    console.log('Adding tag to resource:', {
      junctionTable,
      resourceIdColumn,
      resourceId: resource.id,
      tagId,
      automationActionId
    });

    const { error } = await this.client
      .from(junctionTable)
      .upsert({
        [resourceIdColumn]: resource.id,
        tag_id: tagId,
        automation_action_id: automationActionId, // This matches the column name in the database after renaming
        created_by: 'automation'
      });
    
    if (error) {
      console.error(`Error adding tag to resource (${junctionTable}):`, error);
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
    
    const tableName = junctionTables[resourceType];
    if (!tableName) {
      console.error(`Invalid resource type: ${resourceType}`);
      throw new Error(`Invalid resource type: ${resourceType}`);
    }
    
    return tableName;
  }

  /**
   * Get the appropriate resource ID column for a resource type
   */
  private getResourceIdColumn(resourceType: ResourceType): string {
    const idColumns: Record<ResourceType, string> = {
      book: 'book_id',
      highlight: 'highlight_id',
      spark: 'spark_id'
    };
    
    const columnName = idColumns[resourceType];
    if (!columnName) {
      console.error(`Invalid resource type: ${resourceType}`);
      throw new Error(`Invalid resource type: ${resourceType}`);
    }
    
    return columnName;
  }

  /**
   * Mark an action as executed
   */
  async markActionAsExecuted(actionId: string): Promise<void> {
    await this.updateActionStatus(actionId, 'executed', new Date());
  }

  /**
   * Execute an automation action
   */
  async executeAutomationAction(actionId: string): Promise<boolean> {
    try {
      // Mark action as executing
      await this.updateActionStatus(actionId, 'executing');
      
      // Get the action data
      const action = await this.getAutomationActionById(actionId);
      if (!action) {
        return false;
      }
      
      // Mark action as executed
      await this.updateActionStatus(actionId, 'executed', new Date());
      
      return true;
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
      await this.updateActionStatus(actionId, 'failed');
      return false;
    }
  }

  /**
   * Revert an automation action
   */
  async revertAutomationAction(actionId: string): Promise<boolean> {
    try {
      // Get the action to determine what to revert
      const action = await this.getAutomationActionById(actionId);
      if (!action) return false;
      
      // Mark the action as reverted
      await this.updateActionStatus(actionId, 'reverted');
      
      return true;
    } catch (error) {
      console.error(`Error reverting action ${actionId}:`, error);
      return false;
    }
  }

  /**
   * Update an action's status
   */
  async updateActionStatus(
    actionId: string, 
    status: 'pending' | 'executing' | 'executed' | 'failed' | 'rejected' | 'reverted',
    executedAt?: Date
  ): Promise<void> {
    const updates: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    // Add executed_at timestamp if provided
    if (executedAt) {
      updates.executed_at = executedAt.toISOString();
    }
    
    const { error } = await this.client
      .from('automation_actions')
      .update(updates)
      .eq('id', actionId);
    
    if (error) {
      throw new DatabaseError(`Error updating action status for action ${actionId}`, error);
    }
  }

  /**
   * Update all action statuses for an automation
   */
  async updateAllActionStatusForAutomation(
    automationId: string, 
    status: 'pending' | 'executing' | 'executed' | 'failed' | 'rejected' | 'reverted',
    filter?: { currentStatus?: string }
  ): Promise<void> {
    let query = this.client
      .from('automation_actions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('automation_id', automationId);
    
    // Apply current status filter if provided
    if (filter?.currentStatus) {
      query = query.eq('status', filter.currentStatus);
    }
    
    const { error } = await query;
    
    if (error) {
      throw new DatabaseError(`Error updating all action statuses for automation ${automationId}`, error);
    }
  }

  /**
   * Get an automation action by ID
   */
  async getAutomationActionById(actionId: string): Promise<AutomationActionModel | null> {
    const { data, error } = await this.client
      .from('automation_actions')
      .select('*')
      .eq('id', actionId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching action with ID ${actionId}`, error);
    }
    
    // Return data directly since column is now named correctly
    return data as AutomationActionModel;
  }

  /**
   * Get automation actions that created a category
   */
  async getAutomationActionsWithCreatedCategory(automationId: string, categoryName: string): Promise<AutomationActionModel[]> {
    const { data, error } = await this.client
      .from('automation_actions')
      .select('*')
      .eq('automation_id', automationId)
      .filter('action_data->action', 'eq', 'create_category')
      .filter('action_data->category_name', 'eq', categoryName);
    
    if (error) {
      throw new DatabaseError(`Error fetching category actions for automation ${automationId}`, error);
    }
    
    // Return data directly since column is now named correctly
    return data as AutomationActionModel[];
  }

  /**
   * Get automation actions that created a tag
   */
  async getAutomationActionsWithCreatedTag(automationId: string, tagName: string): Promise<AutomationActionModel[]> {
    const { data, error } = await this.client
      .from('automation_actions')
      .select('*')
      .eq('automation_id', automationId)
      .filter('action_data->action', 'eq', 'create_tag')
      .filter('action_data->tag_name', 'eq', tagName);
    
    if (error) {
      throw new DatabaseError(`Error fetching tag actions for automation ${automationId}`, error);
    }
    
    // Return data directly since column is now named correctly
    return data as AutomationActionModel[];
  }

  /**
   * Revert all actions of an automation
   */
  async revertAutomationActions(automationId: string, userId?: string): Promise<void> {
    console.log(`Starting revertAutomationActions for automation ${automationId}`);
    
    // Get all executed actions for this automation
    const actions = await this.getExecutedAutomationActions(automationId);
    console.log(`Found ${actions.length} executed actions to revert`);
    
    // If no actions, log that
    if (actions.length === 0) {
      console.log(`No executed actions found for automation ${automationId}`);
      return;
    }

    // Get user ID from parameter or from session as fallback
    const userIdToUse = userId || await this.getUserId().catch(err => {
      console.error('Failed to get user ID from session', err);
      return null;
    });
    
    if (!userIdToUse) {
      console.error('No user ID available for reversion, cannot proceed');
      throw new Error('No user ID available');
    }
    
    // Process actions in reverse order (LIFO)
    for (const action of actions.reverse()) {
      const actionData = action.action_data;
      
      // Determine what to undo based on action type
      if (actionData.action === 'add_category') {
        const { target, target_id, category_id } = actionData as AddCategoryActionData;
        const resource: Resource = {
          id: target_id,
          type: target,
          userId: userIdToUse
        };
        
        // Remove category from resource
        const junctionTable = this.getCategoryJunctionTable(target);
        const idColumn = this.getResourceIdColumn(target);
        
        try {
          const { data, error } = await this.client
            .from(junctionTable)
            .delete()
            .eq('automation_action_id', action.id)
            .select();
          
          if (error) {
            console.error(`Failed to delete from ${junctionTable}:`, error);
            throw error;
          }
          
          console.log(`Deleted ${data?.length || 0} rows from ${junctionTable}`);
        } catch (err) {
          console.error(`Error during delete operation:`, err);
          throw err;
        }
      } 
      else if (actionData.action === 'add_tag') {
        const { target, target_id, tag_id } = actionData as AddTagActionData;
        const resource: Resource = {
          id: target_id,
          type: target,
          userId: userIdToUse
        };
        
        // Remove tag from resource
        const junctionTable = this.getTagJunctionTable(target);
        const idColumn = this.getResourceIdColumn(target);
        
        try {
          const { data, error } = await this.client
            .from(junctionTable)
            .delete()
            .eq('automation_action_id', action.id)
            .select();
          
          if (error) {
            console.error(`Failed to delete from ${junctionTable}:`, error);
            throw error;
          }
          
          console.log(`Deleted ${data?.length || 0} rows from ${junctionTable}`);
        } catch (err) {
          console.error(`Error during delete operation:`, err);
          throw err;
        }
      }
      else if (actionData.action === 'create_tag') {
        const { tag_name } = actionData as CreateTagActionData;
        
        try {
          console.log(`Removing tag "${tag_name}" created by automation action ${action.id}`);
          
          // First try to find the tag by its link to the automation
          let tagData: { id: string } | null = null;
          let tagError: any = null;
          
          // Try to find by created_by_automation_id (the proper way)
          const { data: linkedTag, error: linkedError } = await this.client
            .from('tags')
            .select('id')
            .eq('created_by_automation_id', automationId)
            .eq('name', tag_name)
            .single();
            
          if (linkedTag) {
            tagData = linkedTag;
          } else {
            // Fallback: try to find by name only if created_by_automation_id is not set
            // This is for backward compatibility with existing data
            console.log(`Tag "${tag_name}" not linked to automation by ID, falling back to name match`);
            const { data: unlinkedTag, error: unlinkedError } = await this.client
              .from('tags')
              .select('id')
              .eq('name', tag_name)
              .is('created_by_automation_id', null)
              .single();
              
            if (unlinkedTag) {
              tagData = unlinkedTag;
              // Try to update the tag to link it to the automation for future reference
              await this.client
                .from('tags')
                .update({ created_by_automation_id: automationId })
                .eq('id', unlinkedTag.id);
            } else {
              tagError = unlinkedError;
            }
          }
          
          if (tagError) {
            console.error(`Error finding tag to delete:`, tagError);
            continue; // Skip to next action if tag not found
          }
          
          if (tagData?.id) {
            // Before deleting the tag, we need to delete all relationships in junction tables
            const junctionTables = ['book_tags', 'highlight_tags', 'spark_tags'];
            
            for (const table of junctionTables) {
              const { error: junctionError } = await this.client
                .from(table)
                .delete()
                .eq('tag_id', tagData.id);
              
              if (junctionError) {
                console.error(`Error cleaning up ${table} for tag ${tagData.id}:`, junctionError);
                // Continue anyway, as the tag itself might still be deletable
              }
            }
            
            // Now delete the tag itself
            const { error: deleteError } = await this.client
              .from('tags')
              .delete()
              .eq('id', tagData.id);
            
            if (deleteError) {
              console.error(`Failed to delete tag:`, deleteError);
              throw deleteError;
            }
            
            console.log(`Successfully deleted tag "${tag_name}" (${tagData.id})`);
          } else {
            console.log(`Tag "${tag_name}" not found or not created by this automation`);
          }
        } catch (err) {
          console.error(`Error during tag deletion:`, err);
          throw err;
        }
      }
      else if (actionData.action === 'create_category') {
        const { category_name } = actionData as CreateCategoryActionData;
        
        try {
          console.log(`Removing category "${category_name}" created by automation action ${action.id}`);
          
          // First get the category ID using its name
          const { data: categoryData, error: categoryError } = await this.client
            .from('categories')
            .select('id')
            .eq('name', category_name)
            .eq('created_by_automation_id', automationId)
            .single();
          
          if (categoryError) {
            console.error(`Error finding category to delete:`, categoryError);
            continue; // Skip to next action if category not found
          }
          
          if (categoryData?.id) {
            // Before deleting the category, we need to delete all relationships in junction tables
            const junctionTables = ['book_categories', 'highlight_categories', 'spark_categories'];
            
            for (const table of junctionTables) {
              const { error: junctionError } = await this.client
                .from(table)
                .delete()
                .eq('category_id', categoryData.id);
              
              if (junctionError) {
                console.error(`Error cleaning up ${table} for category ${categoryData.id}:`, junctionError);
                // Continue anyway, as the category itself might still be deletable
              }
            }
            
            // Now delete the category itself
            const { error: deleteError } = await this.client
              .from('categories')
              .delete()
              .eq('id', categoryData.id);
            
            if (deleteError) {
              console.error(`Failed to delete category:`, deleteError);
              throw deleteError;
            }
            
            console.log(`Successfully deleted category "${category_name}" (${categoryData.id})`);
          } else {
            console.log(`Category "${category_name}" not found or not created by this automation`);
          }
        } catch (err) {
          console.error(`Error during category deletion:`, err);
          throw err;
        }
      }
    }
  }
} 