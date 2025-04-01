import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { createClient } from "@supabase/supabase-js";

interface AirtableRecord {
  id: string;
  fields: {
    Text?: string;
    Notes?: string;
    Source?: string;
    Author?: string;
    URL?: string;
    Tags?: string[] | string;
    [key: string]: any;
  };
  createdTime?: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

// Function to import data from Airtable
export const airtableImportDataFn = inngest.createFunction(
  { id: "airtable-import-data" },
  { event: "airtable/import-data" },
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
        
        // Transform Airtable records to our format
        const processedRecords = airtableResult.records.map(record => {
          const fields = record.fields;
          
          // Basic validation
          if (!fields.Text || typeof fields.Text !== 'string') {
            return null;
          }
          
          // Create a consistent record structure
          return {
            airtable_id: record.id,
            user_id: userId,
            text: fields.Text,
            note: fields.Notes || null,
            source: fields.Source || 'Airtable Import',
            author: fields.Author || null,
            url: fields.URL || null,
            tags: fields.Tags ? (Array.isArray(fields.Tags) ? fields.Tags : [fields.Tags]) : [],
            created_at: new Date().toISOString(),
            imported_at: new Date().toISOString(),
          };
        }).filter(record => record !== null);
        
        logger.info(`Processed ${processedRecords.length} valid records`);
        
        return {
          records: processedRecords,
          success: true
        };
      });
      
      // Step 3: Import processed records to Supabase
      const importResult = await step.run("import-to-supabase", async () => {
        const records = processResult.records;
        logger.info(`Importing ${records.length} records to Supabase`);
        
        let importedCount = 0;
        
        // Import in batches to avoid size limits
        if (records.length > 0) {
          const batchSize = 100;
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            logger.info(`Importing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(records.length/batchSize)}: ${batch.length} records`);
            
            const { error } = await supabase
              .from('imported_highlights')
              .insert(batch);
              
            if (error) {
              logger.error("Error importing records batch:", error);
            } else {
              importedCount += batch.length;
              logger.info(`Successfully imported batch: ${batch.length} records`);
            }
          }
        }
        
        logger.info(`Completed database import. Imported: ${importedCount} records`);
        
        return {
          importedCount,
          success: true
        };
      });
      
      // Step 4: Update import status in user settings
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
                count: importResult.importedCount,
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
        processed: processResult.records.length,
        imported: importResult.importedCount
      });
      
      return markAsLastStep({
        success: true,
        totalRecords: airtableResult.records.length,
        processedRecords: processResult.records.length,
        importedRecords: importResult.importedCount
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