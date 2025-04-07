import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { AutomationServiceImpl } from '@/lib/categorization/automation-service';
import { getRepositories, getServerRepositories } from '@/repositories';
import { CategorizationAction, Category, Tag } from '@/lib/categorization/types';

/**
 * Server-side endpoint for approving automations
 * This executes with the service role client to bypass RLS restrictions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { automationId } = await request.json();

    if (!automationId) {
      return NextResponse.json({ success: false, error: 'Missing automationId' }, { status: 400 });
    }

    // Create server client with service role
    const supabase = createServerClient();
    
    // Get the user's session
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Verify user owns this automation
    const { data: automation } = await supabase
      .from('automations')
      .select('user_id')
      .eq('id', automationId)
      .single();

    if (!automation) {
      return NextResponse.json({ success: false, error: 'Automation not found' }, { status: 404 });
    }

    if (automation.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not authorized to approve this automation' }, { status: 403 });
    }

    // Create a server-side automation service
    class ServerAutomationService extends AutomationServiceImpl {
      // Override to use server repositories
      async getAutomation(automationId: string) {
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
          const categorizationActions = actions.map(action => {
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
      
      // Server-side implementation of approveAutomation using service role
      async serverApproveAutomation(automationId: string) {
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
          
          // Execute actions with server permissions for each action
          for (const action of createActions) {
            if (!action.id) continue;
            await this.serverExecuteAction(action, automation.userId, createdResources);
          }
          
          for (const action of addActions) {
            if (!action.id) continue;
            await this.serverExecuteAction(action, automation.userId, createdResources);
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

      // Server-side executeAction implementation using service role
      async serverExecuteAction(
        action: CategorizationAction, 
        userId: string,
        createdResources: { categories: Category[], tags: Tag[] }
      ): Promise<void> {
        if (!action.id) return;
        
        const repos = getServerRepositories();
        const actionData = action.actionData;
        
        console.log('Executing action:', {
          actionId: action.id,
          actionType: actionData.action,
          userId
        });

        if (actionData.action === 'create_category') {
          // Create the category using service role
          const data = actionData as { action: 'create_category', category_name: string };
          
          // Create category with user_id
          const newCategory = await repos.categories.createCategory({
            name: data.category_name
          });
          
          createdResources.categories.push({
            id: newCategory.id,
            name: newCategory.name,
            slug: newCategory.slug
          });
          
          await repos.automations.markActionAsExecuted(action.id);
        } 
        else if (actionData.action === 'create_tag') {
          // Create the tag using service role
          const data = actionData as { action: 'create_tag', tag_name: string };
          
          // First check if the tag already exists
          const { data: existingTag } = await repos.categorization.findTagByName(data.tag_name, userId);
          
          if (existingTag) {
            // Tag already exists, use it
            createdResources.tags.push({
              id: existingTag.id,
              name: existingTag.name
            });
          } else {
            // Create the tag with explicit user_id
            const { data: newTag, error } = await supabase
              .from('tags')
              .insert({ 
                name: data.tag_name,
                user_id: userId
              })
              .select()
              .single();
            
            if (error || !newTag) {
              throw new Error(`Failed to create tag: ${error?.message || 'Unknown error'}`);
            }
            
            createdResources.tags.push({
              id: newTag.id,
              name: newTag.name
            });
          }
          
          await repos.automations.markActionAsExecuted(action.id);
        }
        else if (actionData.action === 'add_category') {
          const data = actionData as { 
            action: 'add_category', 
            target: string, 
            target_id: string, 
            category_id: string 
          };
          
          // Add category to resource using service role
          const resource = {
            id: data.target_id,
            type: data.target as any, // Type conversion
            userId: userId
          };
          
          console.log('Adding category to resource with action:', {
            resource,
            categoryId: data.category_id,
            actionId: action.id
          });

          try {
            // Use direct SQL query with the service role client
            const junctionTable = this.getServerCategoryJunctionTable(resource.type);
            const resourceIdColumn = this.getServerResourceIdColumn(resource.type);
            
            console.log('Using junction table:', {
              junctionTable,
              resourceIdColumn
            });
            
            const { error } = await supabase
              .from(junctionTable)
              .upsert({
                [resourceIdColumn]: resource.id,
                category_id: data.category_id,
                automation_action_id: action.id, // Use the new column name
                created_by: 'automation'
              });
            
            if (error) {
              console.error(`Error adding category to resource via direct query:`, error);
              
              // Add detailed error information
              if (error.details) console.error('Error details:', error.details);
              if (error.hint) console.error('Error hint:', error.hint);
              if (error.code) console.error('Error code:', error.code);
              
              throw new Error(`Error adding category to resource: ${error.message}`);
            }
            
            await repos.automations.markActionAsExecuted(action.id);
          } catch (error) {
            console.error('Error in category addition:', error);
            throw error;
          }
        }
        else if (actionData.action === 'add_tag') {
          const data = actionData as {
            action: 'add_tag', 
            target: string, 
            target_id: string, 
            tag_id: string,
            tag_name?: string
          };
          
          // Handle tag_name if provided and tag_id is empty
          let tagId = data.tag_id;
          if ((!tagId || tagId.trim() === '') && data.tag_name) {
            // Try to find existing tag
            const { data: existingTag } = await repos.categorization.findTagByName(data.tag_name, userId);
            
            if (existingTag) {
              tagId = existingTag.id;
            } else {
              // Create the tag with service role permissions
              const { data: newTag, error } = await supabase
                .from('tags')
                .insert({ 
                  name: data.tag_name,
                  user_id: userId
                })
                .select()
                .single();
              
              if (error || !newTag) {
                throw new Error(`Failed to create tag: ${error?.message || 'Unknown error'}`);
              }
              
              tagId = newTag.id;
            }
          }
          
          // Add tag to resource
          const resource = {
            id: data.target_id,
            type: data.target as any, // Type conversion
            userId: userId
          };
          
          console.log('Adding tag to resource with action:', {
            resource,
            tagId,
            actionId: action.id
          });

          try {
            // Use a more direct approach with the service role client
            // This bypasses the repository layer which might have outdated column names
            const junctionTable = this.getServerTagJunctionTable(resource.type);
            const resourceIdColumn = this.getServerResourceIdColumn(resource.type);
            
            console.log('Using junction table:', {
              junctionTable,
              resourceIdColumn
            });
            
            // Use direct SQL query with the service role client
            const { error } = await supabase
              .from(junctionTable)
              .upsert({
                [resourceIdColumn]: resource.id,
                tag_id: tagId,
                automation_action_id: action.id, // Use the new column name
                created_by: 'automation'
              });
            
            if (error) {
              console.error(`Error adding tag to resource via direct query:`, error);
              
              // Add detailed error information
              if (error.details) console.error('Error details:', error.details);
              if (error.hint) console.error('Error hint:', error.hint);
              if (error.code) console.error('Error code:', error.code);
              
              throw new Error(`Error adding tag to resource: ${error.message}`);
            }
            
            await repos.automations.markActionAsExecuted(action.id);
          } catch (error) {
            console.error('Error in tag addition:', error);
            
            // Try querying the table structure to help debugging
            const supabase = createServerClient();
            try {
              const { data: tableInfo, error: tableError } = await supabase.rpc(
                'get_tables_in_schema', 
                { schema_name: 'public' }
              );
              
              if (!tableError && tableInfo) {
                console.log('Available tables:', tableInfo);
              } else {
                console.error('Error getting table info:', tableError);
              }
            } catch (e) {
              console.error('Error in debugging query:', e);
            }
            
            throw error;
          }
        }
      }
      
      // Helper methods to ensure consistent junction table access
      private getServerTagJunctionTable(resourceType: string): string {
        const junctionTables: Record<string, string> = {
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
      
      private getServerCategoryJunctionTable(resourceType: string): string {
        const junctionTables: Record<string, string> = {
          book: 'book_categories',
          highlight: 'highlight_categories',
          spark: 'spark_categories'
        };
        
        const tableName = junctionTables[resourceType];
        if (!tableName) {
          console.error(`Invalid resource type: ${resourceType}`);
          throw new Error(`Invalid resource type: ${resourceType}`);
        }
        
        return tableName;
      }
      
      private getServerResourceIdColumn(resourceType: string): string {
        const idColumns: Record<string, string> = {
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
    }

    // Execute the automation approval with server permissions
    const serverAutomationService = new ServerAutomationService();
    const result = await serverAutomationService.serverApproveAutomation(automationId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in approve automation endpoint:', error);
    
    // Add more detailed error logging for database errors
    if (error instanceof Error && 'details' in error) {
      console.error('Database error details:', error.details);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 