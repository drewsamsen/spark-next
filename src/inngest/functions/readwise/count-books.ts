import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { throttledReadwiseRequest } from "../../utils/readwise-api";

// Readwise book count function - counts total books, does not fetch full content
export const readwiseCountBooksFn = inngest.createFunction(
  { id: "readwise-count-books" },
  { event: "readwise/count-books" },
  async ({ event, step, logger }) => {
    const { userId, apiKey } = event.data;
    
    // Use the built-in logger for operational logs
    logger.info("Starting Readwise book count", { userId });
    
    if (!apiKey) {
      logger.error("No Readwise API key provided");
      return markAsError({ 
        success: false, 
        error: "No API key provided"
      });
    }
    
    try {
      // Fetch all books from Readwise API with pagination to count them
      const result = await step.run("count-books-from-readwise", async () => {
        logger.info(`Counting Readwise books for user ${userId}`);
        
        const readwiseUrl = "https://readwise.io/api/v2/books/";
        
        let nextUrl = readwiseUrl;
        let totalBooks = 0;
        let page = 1;
        
        // Process all pages of results
        while (nextUrl) {
          logger.info(`Fetching page ${page} from ${nextUrl}`);
          
          try {
            // Use throttled request function instead of direct fetch
            const data = await throttledReadwiseRequest(nextUrl, apiKey, logger);
            
            // Count books on this page
            const booksOnPage = data.results ? data.results.length : 0;
            totalBooks += booksOnPage;
            
            logger.info(`Page ${page}: Found ${booksOnPage} books. Total so far: ${totalBooks}`);
            
            // Check if there's another page
            nextUrl = data.next || null;
            page++;
            
            // Safety check to prevent infinite loops
            if (page > 100) {
              logger.warn("Reached 100 pages - stopping to prevent potential infinite loop");
              break;
            }
          } catch (error) {
            logger.error(`Error processing Readwise API page ${page}:`, error);
            throw error;
          }
        }
        
        logger.info(`Finished counting. Total books: ${totalBooks}`);
        
        return {
          count: totalBooks, 
          success: true
        };
      });
      
      logger.info("Book count completed successfully", { count: result.count });
      
      return markAsLastStep({ 
        success: true, 
        bookCount: result.count
      });
    } catch (error) {
      logger.error("Error in Readwise function:", error);
      return markAsError({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
); 