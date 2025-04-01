/**
 * IMPORTANT: Function Completion Convention
 * 
 * All Inngest functions MUST include `isLastStep: true` in their final return value.
 * This marker is used by our database logger middleware to accurately track when a
 * function has truly completed rather than just finished an intermediate step.
 * 
 * Example:
 * ```
 * return {
 *   success: true,
 *   // other data...
 *   isLastStep: true  // Required for proper logging
 * }
 * ```
 * 
 * Without this marker, functions with multiple steps may appear to complete prematurely
 * in logs and UI components.
 */

/**
 * Helper to mark a return value as the last step in a function
 */
export function markAsLastStep<T extends Record<string, any>>(result: T): T & { isLastStep: true } {
  return {
    ...result,
    isLastStep: true
  };
}

/**
 * Helper to mark a return value as an error, automatically adding isLastStep
 */
export function markAsError<T extends { success: false; error: string }>(result: T): T & { isLastStep: true } {
  return markAsLastStep(result);
} 