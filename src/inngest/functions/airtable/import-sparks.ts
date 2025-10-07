import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { createClient } from "@supabase/supabase-js";

interface AirtableRecord {
  id: string;
  fields: {
    uid?: string;
    content?: string;
    Categories?: string[];  // Array of category record IDs
    "Name (from Categories)"?: string[];  // Array of category names
    Tags?: string[];  // Array of tag record IDs
    "Name (from Tags)"?: string[];  // Array of tag names
    originallyCreated?: string;
    toDoId?: string;
    [key: string]: any;
  };
  createdTime?: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

/**
 * Apply text replacements to clean up spark content
 */
function cleanSparkContent(content: string): string {
  let cleaned = content;
  
  // Apply replacements (case-insensitive)
  const replacements: Array<[RegExp, string]> = [
    [/\bxtians\b/gi, 'Christians'],
    [/\bxtian\b/gi, 'Christian'],
    [/\bq for\b/gi, 'question for'],
    [/\bq:\s/gi, 'question: '],
  ];
  
  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  
  return cleaned;
}

/**
 * Import sparks from Airtable "Thoughts Manager" base.
 * Fetches records from the "Thoughts All" table and creates sparks in Supabase.
 * 
 * VALIDATION REQUIREMENTS:
 * - content field must be present and non-empty
 * - "Name (from Categories)" must have at least one category name
 * - "Name (from Tags)" must have at least one tag name
 * - uid field must be present (for deduplication)
 * 
 * AIRTABLE DATA STRUCTURE:
 * - Categories: Array of Airtable record IDs
 * - "Name (from Categories)": Array of category names (takes first one)
 * - Tags: Array of Airtable record IDs
 * - "Name (from Tags)": Array of tag names
 * 
 * DEDUPLICATION:
 * - Uses the existing uid field from Airtable
 * - Stores it in md5_uid field (existing unique field for deduplication)
 * - Checks for existing sparks using md5_uid before importing
 * - Only imports new records not already in the database
 * - Safe to run on a schedule without creating duplicates
 * 
 * TRIGGERED BY: User action in integrations settings or scheduled automation
 * SIDE EFFECTS:
 * - Creates sparks in sparks table with md5_uid set
 * - Creates/links categories and tags via junction tables
 * - Updates user_settings with import metadata
 * - Logs the names of newly created categories and tags
 * 
 * @param event - Contains userId, apiKey, baseId, tableId
 * @returns Summary of imported records with counts, skip reasons, and names of newly created categories/tags
 */
export const airtableImportSparksFn = inngest.createFunction(
  { id: "airtable-import-sparks" },
  { event: "airtable/import-sparks" },
  async ({ event, step, logger }) => {
    const { userId, apiKey, baseId, tableId } = event.data;
    
    logger.info("Starting Airtable data import", { userId, baseId, tableId });
    
    if (!userId || !apiKey || !baseId || !tableId) {
      logger.error("Missing required parameters");
      return markAsError({ 
        success: false, 
        error: "Missing required parameters",
        importedRecords: 0
      });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("Missing Supabase configuration");
      return markAsError({ 
        success: false, 
        error: "Server configuration error",
        importedRecords: 0
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      // Step 1: Fetch data from Airtable
      const airtableResult = await step.run("fetch-data-from-airtable", async () => {
        logger.info(`Fetching data from Airtable: base ${baseId}, table ${tableId}`);
        
        const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
        
        try {
          // Get first page of records
          const allRecords: AirtableRecord[] = [];
          let nextOffset: string | null = null;
          let pageNum = 1;
          
          do {
            const queryUrl: string = nextOffset 
              ? `${url}?offset=${nextOffset}`
              : url;
            
            logger.info(`Fetching page ${pageNum} from Airtable`);
            
            const response = await fetch(queryUrl, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
              }
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Airtable API error (${response.status}): ${errorText}`);
            }
            
            const data: AirtableResponse = await response.json();
            const records = data.records || [];
            
            logger.info(`Received ${records.length} records on page ${pageNum}`);
            allRecords.push(...records);
            
            // Check if there's another page
            nextOffset = data.offset || null;
            pageNum++;
            
            // Avoid rate limits
            if (nextOffset) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } while (nextOffset);
          
          logger.info(`Total records fetched from Airtable: ${allRecords.length}`);
          
          return {
            records: allRecords,
            success: true
          };
        } catch (error) {
          logger.error("Error fetching data from Airtable:", error);
          throw error;
        }
      });
      
      if (!airtableResult.success || !airtableResult.records.length) {
        logger.error("Failed to fetch data from Airtable or no records found");
        return markAsError({ 
          success: false, 
          error: "Failed to fetch data from Airtable or no records found",
          importedRecords: 0
        });
      }
      
      logger.info(`Successfully fetched ${airtableResult.records.length} records from Airtable`);
      
      // Step 2: Process and transform data
      const processResult = await step.run("process-airtable-data", async () => {
        logger.info("Processing Airtable data");
        
        let skippedNoContent = 0;
        let skippedNoCategory = 0;
        let skippedNoTags = 0;
        let skippedNoUid = 0;
        
        // Transform Airtable records to our format
        const processedRecords = airtableResult.records.map(record => {
          const fields = record.fields;
          
          // Validate uid field - required for deduplication
          if (!fields.uid || typeof fields.uid !== 'string' || fields.uid.trim().length === 0) {
            skippedNoUid++;
            logger.debug(`Skipping record ${record.id}: missing or empty uid`);
            return null;
          }
          
          // Validate content field
          if (!fields.content || typeof fields.content !== 'string' || fields.content.trim().length === 0) {
            skippedNoContent++;
            return null;
          }
          
          // Validate Categories field - required (comes as array of IDs)
          // Use "Name (from Categories)" to get the actual category name
          const categoryNames = fields["Name (from Categories)"];
          if (!categoryNames || !Array.isArray(categoryNames) || categoryNames.length === 0) {
            skippedNoCategory++;
            logger.debug(`Skipping record ${record.id}: missing or empty category name`);
            return null;
          }
          
          // Get the first category name (should only be one)
          const categoryName = categoryNames[0];
          if (!categoryName || typeof categoryName !== 'string' || categoryName.trim().length === 0) {
            skippedNoCategory++;
            logger.debug(`Skipping record ${record.id}: invalid category name`);
            return null;
          }
          
          // Validate Tags field - must have at least one tag
          // Use "Name (from Tags)" to get actual tag names
          const tagNames = fields["Name (from Tags)"];
          if (!tagNames || !Array.isArray(tagNames) || tagNames.length === 0) {
            skippedNoTags++;
            logger.debug(`Skipping record ${record.id}: no valid tags`);
            return null;
          }
          
          const validTags = tagNames.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
          
          if (validTags.length === 0) {
            skippedNoTags++;
            logger.debug(`Skipping record ${record.id}: no valid tag names`);
            return null;
          }
          
          // Create a consistent record structure with cleaned content
          return {
            airtable_id: record.id,
            md5_uid: fields.uid.trim(),
            user_id: userId,
            body: cleanSparkContent(fields.content.trim()),
            category: categoryName.trim(),
            tags: validTags,
            todo_id: fields.toDoId || null,
            todo_created_at: fields.originallyCreated || null,
          };
        }).filter(record => record !== null);
        
        logger.info(`Processed ${processedRecords.length} valid records`, {
          skipped: {
            noUid: skippedNoUid,
            noContent: skippedNoContent,
            noCategory: skippedNoCategory,
            noTags: skippedNoTags,
            total: skippedNoUid + skippedNoContent + skippedNoCategory + skippedNoTags
          }
        });
        
        return {
          records: processedRecords,
          skipped: {
            noUid: skippedNoUid,
            noContent: skippedNoContent,
            noCategory: skippedNoCategory,
            noTags: skippedNoTags
          },
          success: true
        };
      });
      
      // Step 3: Check for existing sparks and filter out duplicates
      const deduplicationResult = await step.run("check-for-duplicates", async () => {
        const records = processResult.records;
        logger.info(`Checking for duplicates among ${records.length} records`);
        
        if (records.length === 0) {
          return {
            newRecords: [],
            duplicateCount: 0,
            success: true
          };
        }
        
        // Get all md5_uids from processed records
        const md5Uids = records.map(r => r.md5_uid);
        
        // Check in batches to avoid URI too large errors
        const batchSize = 100;
        const existingIds = new Set<string>();
        
        for (let i = 0; i < md5Uids.length; i += batchSize) {
          const batch = md5Uids.slice(i, i + batchSize);
          logger.info(`Checking batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(md5Uids.length/batchSize)}`);
          
          const { data: existingSparks, error } = await supabase
            .from('sparks')
            .select('md5_uid')
            .eq('user_id', userId)
            .in('md5_uid', batch);
          
          if (error) {
            logger.error("Error checking for existing sparks in batch:", error);
            throw error;
          }
          
          // Add found IDs to the set
          if (existingSparks) {
            existingSparks.forEach(s => existingIds.add(s.md5_uid));
          }
        }
        
        // Filter out records that already exist
        const newRecords = records.filter(r => !existingIds.has(r.md5_uid));
        
        logger.info(`Deduplication complete: ${newRecords.length} new records, ${existingIds.size} duplicates skipped`);
        
        return {
          newRecords,
          duplicateCount: existingIds.size,
          success: true
        };
      });
      
      // Step 4: Import new sparks to Supabase
      const importResult = await step.run("import-to-supabase", async () => {
        const records = deduplicationResult.newRecords;
        logger.info(`Importing ${records.length} new records to Supabase`);
        
        if (records.length === 0) {
          logger.info("No new records to import");
          return {
            importedCount: 0,
            importedSparks: [],
            skippedDuplicates: deduplicationResult.duplicateCount,
            success: true
          };
        }
        
        let importedCount = 0;
        const importedSparks: Array<{ sparkId: string; category: string; tags: string[] }> = [];
        
        // Import records one by one to handle categories and tags
        for (const record of records) {
          try {
            // Insert the spark with md5_uid for deduplication
            const { data: spark, error: sparkError } = await supabase
              .from('sparks')
              .insert({
                user_id: record.user_id,
                body: record.body,
                md5_uid: record.md5_uid,
                todo_id: record.todo_id,
                todo_created_at: record.todo_created_at,
              })
              .select('id')
              .single();
            
            if (sparkError) {
              logger.error(`Supabase error inserting spark for airtable_id ${record.airtable_id}:`, {
                error: sparkError,
                message: sparkError.message,
                details: sparkError.details,
                hint: sparkError.hint,
                code: sparkError.code
              });
              continue;
            }
            
            if (!spark) {
              logger.error(`No spark returned for airtable_id ${record.airtable_id} (no error but no data)`);
              continue;
            }
            
            importedSparks.push({
              sparkId: spark.id,
              category: record.category,
              tags: record.tags
            });
            
            importedCount++;
          } catch (error) {
            logger.error(`Exception inserting spark for airtable_id ${record.airtable_id}:`, {
              error,
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        }
        
        logger.info(`Completed spark imports. Imported: ${importedCount} records`);
        
        return {
          importedCount,
          importedSparks,
          skippedDuplicates: deduplicationResult.duplicateCount,
          success: true
        };
      });
      
      // Step 5: Handle categories and tags
      const categorizationResult = await step.run("add-categories-and-tags", async () => {
        const sparks = importResult.importedSparks;
        logger.info(`Adding categories and tags for ${sparks.length} sparks`);
        
        if (sparks.length === 0) {
          return { 
            newCategories: [],
            newTags: [],
            success: true 
          };
        }
        
        const newCategories: string[] = [];
        const newTags: string[] = [];
        
        for (const spark of sparks) {
          try {
            // Get or create category
            const categorySlug = spark.category.toLowerCase().replace(/\s+/g, '-');
            
            let categoryId: string | null = null;
            
            // Try to find existing category
            const { data: existingCategories } = await supabase
              .from('categories')
              .select('id')
              .eq('slug', categorySlug)
              .eq('user_id', userId)
              .limit(1);
            
            if (existingCategories && existingCategories.length > 0) {
              categoryId = existingCategories[0].id;
            } else {
              // Create new category
              const { data: newCategory, error: categoryError } = await supabase
                .from('categories')
                .insert({
                  name: spark.category,
                  slug: categorySlug,
                  user_id: userId
                })
                .select('id')
                .single();
              
              if (newCategory) {
                categoryId = newCategory.id;
                newCategories.push(spark.category);
                logger.info(`Created new category: ${spark.category}`);
              } else {
                logger.error(`Failed to create category ${spark.category}:`, categoryError);
              }
            }
            
            // Link spark to category
            if (categoryId) {
              const { error: junctionError } = await supabase
                .from('spark_categories')
                .insert({
                  spark_id: spark.sparkId,
                  category_id: categoryId,
                  created_by: 'airtable-import'
                });
              
              if (junctionError) {
                logger.error(`Failed to link spark ${spark.sparkId} to category:`, junctionError);
              }
            }
            
            // Process tags
            for (const tagName of spark.tags) {
              try {
                let tagId: string | null = null;
                
                // Try to find existing tag
                const { data: existingTags } = await supabase
                  .from('tags')
                  .select('id')
                  .eq('name', tagName)
                  .eq('user_id', userId)
                  .limit(1);
                
                if (existingTags && existingTags.length > 0) {
                  tagId = existingTags[0].id;
                } else {
                  // Create new tag
                  const { data: newTag, error: tagError } = await supabase
                    .from('tags')
                    .insert({
                      name: tagName,
                      user_id: userId
                    })
                    .select('id')
                    .single();
                  
                  if (newTag) {
                    tagId = newTag.id;
                    newTags.push(tagName);
                    logger.info(`Created new tag: ${tagName}`);
                  } else {
                    logger.error(`Failed to create tag ${tagName}:`, tagError);
                  }
                }
                
                // Link spark to tag
                if (tagId) {
                  const { error: junctionError } = await supabase
                    .from('spark_tags')
                    .insert({
                      spark_id: spark.sparkId,
                      tag_id: tagId,
                      created_by: 'airtable-import'
                    });
                  
                  if (junctionError) {
                    logger.error(`Failed to link spark ${spark.sparkId} to tag:`, junctionError);
                  }
                }
              } catch (error) {
                logger.error(`Exception processing tag ${tagName}:`, error);
              }
            }
          } catch (error) {
            logger.error(`Exception processing spark ${spark.sparkId}:`, error);
          }
        }
        
        logger.info(`Categories and tags processed`, {
          newCategoriesCount: newCategories.length,
          newCategories,
          newTagsCount: newTags.length,
          newTags
        });
        
        return {
          newCategories,
          newTags,
          success: true
        };
      });
      
      // Step 6: Update import status in user settings
      await step.run("update-import-status", async () => {
        logger.info("Updating import status in user settings");
        
        // First get current settings
        const { data: currentSettings, error: getError } = await supabase
          .from('user_settings')
          .select('integrations')
          .eq('user_id', userId)
          .single();
        
        if (getError) {
          logger.error("Failed to get current user settings", getError);
          return { success: false };
        }
        
        // Merge existing settings with new import info
        const updatedSettings = {
          integrations: {
            ...(currentSettings?.integrations || {}),
            airtable: {
              ...(currentSettings?.integrations?.airtable || {}),
              lastImport: {
                date: new Date().toISOString(),
                imported: importResult.importedCount,
                skipped: {
                  duplicates: importResult.skippedDuplicates,
                  noUid: processResult.skipped.noUid,
                  noContent: processResult.skipped.noContent,
                  noCategory: processResult.skipped.noCategory,
                  noTags: processResult.skipped.noTags
                },
                baseId,
                tableId
              }
            }
          }
        };
        
        // Update settings
        const { error } = await supabase
          .from('user_settings')
          .update(updatedSettings)
          .eq('user_id', userId);
          
        if (error) {
          logger.error("Failed to update import status", error);
          return { success: false };
        }
        
        return { success: true };
      });
      
      // Final log and return
      logger.info("Airtable import completed successfully", {
        totalRecords: airtableResult.records.length,
        validRecords: processResult.records.length,
        newRecords: deduplicationResult.newRecords.length,
        imported: importResult.importedCount,
        skipped: {
          duplicates: importResult.skippedDuplicates,
          noUid: processResult.skipped.noUid,
          noContent: processResult.skipped.noContent,
          noCategory: processResult.skipped.noCategory,
          noTags: processResult.skipped.noTags
        },
        newCategories: categorizationResult.newCategories,
        newTags: categorizationResult.newTags
      });
      
      return markAsLastStep({
        success: true,
        totalRecords: airtableResult.records.length,
        validRecords: processResult.records.length,
        importedRecords: importResult.importedCount,
        skippedDuplicates: importResult.skippedDuplicates,
        skippedNoUid: processResult.skipped.noUid,
        skippedNoContent: processResult.skipped.noContent,
        skippedNoCategory: processResult.skipped.noCategory,
        skippedNoTags: processResult.skipped.noTags,
        newCategories: categorizationResult.newCategories,
        newTags: categorizationResult.newTags
      });
    } catch (error) {
      logger.error("Error in Airtable import function:", error);
      return markAsError({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        importedRecords: 0
      });
    }
  }
); 