// Rate limit tracking for Readwise API
const readwiseRateLimit = {
  lastRequestTime: 0,
  requestCount: 0,
  // Default delay is based on endpoint type
  // Books/Highlights APIs: 20 req/min = 3000ms
  // Other endpoints: 240 req/min = 250ms
  defaultDelayMs: {
    list: 3000, // For book/highlight LIST endpoints: 20 req/min
    other: 250  // For other endpoints: 240 req/min
  },
  // Current delay (will be adjusted based on endpoint and responses)
  minDelayMs: 250
};

/**
 * Makes a throttled request to the Readwise API respecting rate limits
 * Automatically adjusts delay based on response headers or errors
 */
export async function throttledReadwiseRequest(
  url: string, 
  apiKey: string, 
  logger: { info: (message: string, context?: any) => void; error: (message: string, context?: any) => void; }
): Promise<any> {
  // Determine endpoint type to apply proper rate limit
  const isListEndpoint = url.includes('/api/v2/books') || url.includes('/api/v2/highlights');
  const endpointType = isListEndpoint ? 'list' : 'other';
  
  // Set appropriate delay for this endpoint type if not already set
  if (readwiseRateLimit.minDelayMs < readwiseRateLimit.defaultDelayMs[endpointType]) {
    readwiseRateLimit.minDelayMs = readwiseRateLimit.defaultDelayMs[endpointType];
    logger.info(`Using ${endpointType} endpoint rate limit: ${readwiseRateLimit.minDelayMs}ms delay`);
  }
  
  // Calculate time since last request
  const now = Date.now();
  const timeSinceLastRequest = now - readwiseRateLimit.lastRequestTime;
  
  // If we need to wait to respect minimum delay
  if (timeSinceLastRequest < readwiseRateLimit.minDelayMs) {
    const waitTime = readwiseRateLimit.minDelayMs - timeSinceLastRequest;
    logger.info(`Throttling Readwise API request, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update tracking variables before request
  readwiseRateLimit.lastRequestTime = Date.now();
  readwiseRateLimit.requestCount++;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    // Check for rate limit headers and adjust our delay if needed
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    
    if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
      // If we're close to hitting the limit, increase the delay
      readwiseRateLimit.minDelayMs = Math.min(5000, readwiseRateLimit.minDelayMs * 2);
      logger.info(`Rate limit getting low (${rateLimitRemaining} remaining), increasing delay to ${readwiseRateLimit.minDelayMs}ms`);
    }
    
    if (!response.ok) {
      // If we get a rate limit error (429), respect the Retry-After header
      if (response.status === 429) {
        // Check for Retry-After header as recommended by Readwise API docs
        const retryAfter = response.headers.get('Retry-After');
        let waitSeconds = 10; // Default wait if no header
        
        if (retryAfter) {
          waitSeconds = parseInt(retryAfter);
          logger.info(`Received Retry-After header: ${waitSeconds} seconds`);
        }
        
        // Convert to milliseconds and add buffer
        const waitTime = (waitSeconds * 1000) + 500;
        
        // Update our delay for future requests
        readwiseRateLimit.minDelayMs = Math.max(readwiseRateLimit.minDelayMs, 
                                               Math.min(5000, readwiseRateLimit.defaultDelayMs[endpointType] * 2));
        
        logger.error(`Hit Readwise rate limit, waiting ${waitTime}ms before retry`);
        
        // Wait the specified time before retrying
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Try again with recursion
        return throttledReadwiseRequest(url, apiKey, logger);
      }
      
      const errorText = await response.text();
      throw new Error(`Readwise API error (${response.status}): ${errorText}`);
    }
    
    // If we've made 20+ successful requests and haven't hit limits, we can cautiously reduce delay
    // but never go below the default for this endpoint type
    if (readwiseRateLimit.requestCount > 20 && readwiseRateLimit.minDelayMs > readwiseRateLimit.defaultDelayMs[endpointType]) {
      readwiseRateLimit.minDelayMs = Math.max(
        readwiseRateLimit.defaultDelayMs[endpointType], 
        readwiseRateLimit.minDelayMs * 0.8
      );
      readwiseRateLimit.requestCount = 0;
      logger.info(`Adjusting Readwise API delay to ${readwiseRateLimit.minDelayMs}ms`);
    }
    
    return await response.json();
  } catch (error) {
    // For network errors, increase delay as a precaution
    if (!(error instanceof Error && error.message.includes('Readwise API error'))) {
      readwiseRateLimit.minDelayMs = Math.min(5000, readwiseRateLimit.minDelayMs * 2);
      logger.error(`Network error with Readwise API, increasing delay to ${readwiseRateLimit.minDelayMs}ms`);
    }
    throw error;
  }
}

/**
 * Makes a throttled auth request to the Readwise API respecting rate limits
 */
export async function throttledReadwiseAuthRequest(
  apiKey: string, 
  logger: { info: (message: string, context?: any) => void; error: (message: string, context?: any) => void; }
): Promise<{ success: boolean, error?: string }> {
  // Auth endpoint uses the standard rate limit
  if (readwiseRateLimit.minDelayMs < readwiseRateLimit.defaultDelayMs.other) {
    readwiseRateLimit.minDelayMs = readwiseRateLimit.defaultDelayMs.other;
  }
  
  // Calculate time since last request
  const now = Date.now();
  const timeSinceLastRequest = now - readwiseRateLimit.lastRequestTime;
  
  // If we need to wait to respect minimum delay
  if (timeSinceLastRequest < readwiseRateLimit.minDelayMs) {
    const waitTime = readwiseRateLimit.minDelayMs - timeSinceLastRequest;
    logger.info(`Throttling Readwise API request, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update tracking variables before request
  readwiseRateLimit.lastRequestTime = Date.now();
  readwiseRateLimit.requestCount++;
  
  try {
    const response = await fetch('https://readwise.io/api/v2/auth/', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    });
    
    // If we get a rate limit error (429), respect the Retry-After header
    if (response.status === 429) {
      // Check for Retry-After header as recommended by Readwise API docs
      const retryAfter = response.headers.get('Retry-After');
      let waitSeconds = 10; // Default wait if no header
      
      if (retryAfter) {
        waitSeconds = parseInt(retryAfter);
        logger.info(`Received Retry-After header: ${waitSeconds} seconds`);
      }
      
      // Convert to milliseconds and add buffer
      const waitTime = (waitSeconds * 1000) + 500;
      
      // Update our delay for future requests
      readwiseRateLimit.minDelayMs = Math.max(readwiseRateLimit.minDelayMs, 
                                           Math.min(5000, readwiseRateLimit.defaultDelayMs.other * 2));
                                           
      logger.error(`Hit Readwise rate limit, waiting ${waitTime}ms before retry`);
      
      // Wait the specified time before retrying
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Try again with recursion
      return throttledReadwiseAuthRequest(apiKey, logger);
    }
    
    if (response.status === 204) {
      return { success: true };
    } else {
      const errorData = await response.json()
        .catch(() => ({ detail: "Invalid API key" }));
      return { success: false, error: errorData.detail || "Invalid API key" };
    }
  } catch (error) {
    // For network errors, increase delay as a precaution
    readwiseRateLimit.minDelayMs = Math.min(5000, readwiseRateLimit.minDelayMs * 2);
    logger.error(`Network error with Readwise API, increasing delay to ${readwiseRateLimit.minDelayMs}ms`);
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Connection failed"
    };
  }
} 