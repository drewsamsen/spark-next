# Readwise Highlights Sync Optimization Plan

## Context
Current implementation handles ~500 books and ~15,000 highlights per user. While functional, there are several optimization opportunities to improve performance, reduce API calls, and minimize database operations.

**Note:** The `sync-books.ts` file has identical performance issues (one-by-one updates, no incremental sync). The optimizations in this plan should be applied to both `sync-highlights.ts` and `sync-books.ts` for consistency.

## Current Performance Issues

1. **Inefficient Updates**: Updates are executed one-by-one in a loop (lines 286-298), causing 100+ individual database queries for updated highlights
2. **No Incremental Sync**: Always fetches ALL highlights from Readwise API, even unchanged ones
3. **Duplicate Logic**: Separate insert and update code paths that could be unified
4. **Memory Overhead**: Builds large in-memory arrays for 15k highlights before any database operations

## Optimization Strategy

Focus on high-impact, low-risk improvements that leverage existing Readwise API features and Supabase capabilities.

---

## Developer Stories (Execute in Order)

### Story 1: Replace Individual Updates with Batch Upsert ✅ COMPLETED
**Priority**: HIGH | **Impact**: CRITICAL | **Effort**: Medium

#### Problem
Currently, updates are executed one-by-one:
```typescript
for (const highlight of batch) {
  const { id, ...updateData } = highlight;
  const { error: updateError } = await supabase
    .from('highlights')
    .update(updateData)
    .eq('id', id);  // One query per highlight!
}
```

For 1,000 updated highlights, this creates 1,000 separate database queries.

#### Solution
Use Supabase's `upsert` operation to handle both inserts and updates in a single batch operation.

#### Implementation Steps
1. Remove the separate `highlightsToInsert` and `highlightsToUpdate` arrays
2. Create a single `highlightsToUpsert` array
3. Add all highlights (new and existing) to this single array
4. Use `.upsert()` with `onConflict: 'rw_id,user_id'` to handle both cases:
   ```typescript
   const { error } = await supabase
     .from('highlights')
     .upsert(batch, { 
       onConflict: 'rw_id,user_id',
       ignoreDuplicates: false 
     });
   ```

#### Requirements
- Ensure a unique index exists on `(rw_id, user_id)` in the highlights table
- Update logging to reflect upserted count instead of separate insert/update counts
- Maintain batch size of 100 for upsert operations

#### Expected Impact
- Reduces database queries from ~1,000+ to ~10 (for 1,000 highlights in batches of 100)
- Simplifies code by removing conditional logic
- Atomic operations reduce race condition risks

#### Completion Notes
- ✅ Removed separate `highlightsToInsert` and `highlightsToUpdate` arrays
- ✅ Created single `highlightsToUpsert` array
- ✅ Implemented `.upsert()` with `onConflict: 'user_id,rw_id'`
- ✅ Verified unique constraint exists on `(user_id, rw_id)` in highlights table
- ✅ Updated all logging to use `upserted` count instead of separate insert/update counts
- ✅ Removed timestamp comparison logic (no longer needed with upsert)
- ✅ Maintained batch size of 100 for upsert operations
- File modified: `src/inngest/functions/readwise/sync-highlights.ts`

---

### Story 2: Implement Incremental Sync with `updated_after` Parameter ✅ COMPLETED
**Priority**: HIGH | **Impact**: CRITICAL | **Effort**: Medium

#### Problem
Current implementation fetches ALL highlights from Readwise on every sync, even if only 5 highlights changed since last sync. For 15,000 highlights across 150 pages, this is wasteful.

#### Solution
Use Readwise API's `updated_after` parameter to only fetch highlights modified since last sync.

#### Implementation Steps
1. Before fetching from Readwise, retrieve the last sync timestamp from user_settings:
   ```typescript
   const { data: settings } = await supabase
     .from('user_settings')
     .select('integrations')
     .eq('user_id', userId)
     .single();
   
   const lastSynced = settings?.integrations?.readwise?.lastSynced;
   ```

2. Construct Readwise API URL with date filter parameter:
   ```typescript
   // Readwise List API uses updated__gt parameter (double underscore)
   const readwiseUrl = lastSynced 
     ? `https://readwise.io/api/v2/highlights/?updated__gt=${lastSynced}`
     : `https://readwise.io/api/v2/highlights/`;
   ```

3. For first-time syncs (no lastSynced), fetch all highlights as before

4. Log whether this is a full sync or incremental sync for monitoring

#### Requirements
- **IMPORTANT**: The Readwise List API uses `updated__gt` parameter (double underscore) for filtering by update date
- Alternative: The Export API may use `updatedAfter` - test both if needed
- Handle the case where lastSynced doesn't exist (first sync)
- Ensure timestamp format matches Readwise API expectations (ISO 8601: `YYYY-MM-DDTHH:mm:ss`)
- **Verification Step**: Test the parameter to confirm it works correctly before full implementation

#### Expected Impact
- **First sync**: Same performance (fetches all)
- **Subsequent syncs**: Fetches only changed highlights (could be 99% reduction in API calls)
- Dramatically faster sync times after initial import
- Reduced API rate limiting issues

#### Completion Notes
- ✅ Added new step to fetch last sync timestamp from user_settings before API call
- ✅ Implemented sync type detection (incremental vs full) based on lastSynced value
- ✅ Constructed Readwise API URL with `updated__gt` parameter for incremental syncs
- ✅ Added comprehensive logging to indicate sync type and API URL being used
- ✅ Handled first-time sync case (no lastSynced) by performing full sync
- ✅ Used ISO 8601 timestamp format (already stored in this format in user_settings)
- ✅ Updated step numbering throughout the function for clarity
- File modified: `src/inngest/functions/readwise/sync-highlights.ts`

---

### Story 3: Optimize Existing Highlights Lookup ✅ COMPLETED
**Priority**: MEDIUM | **Impact**: MODERATE | **Effort**: Low

#### Problem
With incremental sync (Story 2), we still fetch ALL user highlights from database to build the lookup map. For 15,000 highlights, this is unnecessary when only checking 10 new ones.

#### Solution
Two-phase approach based on sync type:

**For Incremental Syncs (most common):**
- Skip fetching existing highlights entirely
- Rely on upsert's conflict resolution
- Only fetch if you need to report stats about what changed

**For Full Syncs (first time only):**
- Keep current approach of fetching all

#### Implementation Steps
1. Add a `syncType` variable to track 'full' vs 'incremental'
2. Conditionally fetch existing highlights:
   ```typescript
   const syncType = lastSynced ? 'incremental' : 'full';
   
   if (syncType === 'full') {
     // Fetch existing highlights for deduplication stats
   } else {
     // Skip fetch, let upsert handle conflicts
   }
   ```

3. Adjust logging/stats collection based on available data

#### Expected Impact
- Eliminates large SELECT query on incremental syncs
- Reduces memory footprint significantly
- Faster sync start time

#### Completion Notes
- ✅ Reordered steps to determine sync type BEFORE fetching existing highlights
- ✅ Implemented conditional fetch: only fetches existing highlights for full syncs
- ✅ For incremental syncs, skips the database SELECT entirely and relies on upsert conflict resolution
- ✅ Added comprehensive logging to indicate when fetch is skipped
- ✅ Removed unused lookup map creation (no longer needed with upsert-only approach)
- ✅ Updated step numbering throughout the function (Step 1-5 instead of 1-6)
- ✅ Set `existingHighlightsCount` to 0 for incremental syncs (can be calculated post-sync if needed)
- File modified: `src/inngest/functions/readwise/sync-highlights.ts`

---

### Story 4: Remove Unnecessary Timestamp Comparison Logic
**Priority**: LOW | **Impact**: MODERATE | **Effort**: Low

#### Problem
With upsert and incremental sync, the timestamp comparison logic (lines 215-223) becomes redundant:
```typescript
const newUpdated = new Date(highlight.updated);
if (newUpdated > existingHighlight.rwUpdated) {
  highlightsToUpdate.push(...);
}
```

#### Solution
Remove timestamp comparison - let the database and API handle this:
- Readwise API's `updated_after` ensures we only get changed highlights
- Upsert will update existing records with new data
- No need for application-level comparison

#### Implementation Steps
1. After implementing Stories 1-2, remove the `if (newUpdated > existingHighlight.rwUpdated)` check
2. Simplify to: "if from API, upsert it"
3. Remove the `rwUpdated` field from the existing highlights fetch (no longer needed)

#### Expected Impact
- Cleaner, more maintainable code
- Slight performance improvement (fewer date comparisons)
- Reduced cognitive complexity

---

### Story 5: Add Sync Statistics and Monitoring ✅ COMPLETED
**Priority**: MEDIUM | **Impact**: LOW | **Effort**: Low

#### Problem
After optimizations, we lose some visibility into what changed during sync (inserts vs updates).

#### Solution
Enhance logging to provide insights without sacrificing performance.

#### Implementation Steps
1. Log sync type (full vs incremental) at start
2. Log API fetch metrics:
   - Total highlights from API
   - Number of pages fetched
   - Time taken for API calls
   
3. Log database operation metrics:
   - Total upserted
   - Batch count
   - Time taken for DB operations

4. Consider adding a simple query after upsert to count how many highlights exist (optional):
   ```typescript
   const { count } = await supabase
     .from('highlights')
     .select('*', { count: 'exact', head: true })
     .eq('user_id', userId);
   ```

#### Expected Impact
- Better observability
- Easier debugging
- Performance insights for future optimization

#### Completion Notes
- ✅ Added timing metrics for API fetch operations with `apiStartTime` and duration calculation
- ✅ Added timing metrics for database operations with `dbStartTime` and duration calculation
- ✅ Enhanced API fetch summary logging with pages fetched, highlights received, and duration
- ✅ Enhanced DB operation summary logging with batch count, upserts, and duration
- ✅ Implemented optional total highlights count query after sync for monitoring
- ✅ Updated final success log to include all new metrics: syncType, totalInDatabase, apiDuration, dbDuration, pagesProcessed
- ✅ Updated return object to include all monitoring metrics for observability
- File modified: `src/inngest/functions/readwise/sync-highlights.ts`

---

### Story 6: Implement Error Recovery for Partial Failures
**Priority**: LOW | **Impact**: MODERATE | **Effort**: Medium

#### Problem
If a batch upsert fails midway through processing, we lose visibility into what succeeded/failed.

#### Solution
Add error handling and retry logic for individual batches.

#### Implementation Steps
1. Wrap each batch upsert in try-catch
2. On batch failure, log the error with batch details
3. Continue processing remaining batches (don't fail entire sync)
4. Track failed batches for final report:
   ```typescript
   const failedBatches = [];
   
   for (let i = 0; i < highlightsToUpsert.length; i += batchSize) {
     try {
       const batch = highlightsToUpsert.slice(i, i + batchSize);
       await supabase.from('highlights').upsert(batch, ...);
       successCount += batch.length;
     } catch (error) {
       logger.error(`Batch ${i/batchSize} failed`, error);
       failedBatches.push({ batchIndex: i, error });
     }
   }
   ```

4. Include failed batch info in final return

#### Expected Impact
- More resilient syncs
- Partial success instead of complete failure
- Better error diagnostics

---

## Performance Expectations

### Current Performance (15,000 highlights, ~100 changed)
- API Calls: ~150 pages (all highlights)
- DB Queries: ~1 SELECT + 100 individual UPDATEs + 10 batch INSERTs = ~111 queries
- Sync Time: ~2-3 minutes

### Optimized Performance (after all stories)
- API Calls: ~1 page (only changed highlights)
- DB Queries: 1 SELECT (settings) + 1 batch UPSERT = 2 queries
- Sync Time: ~5-10 seconds

**~95% improvement in sync time for incremental syncs**

---

## Testing Checklist

After implementing each story:
- [ ] Test first-time sync (no existing highlights)
- [ ] Test incremental sync (existing highlights, some updated)
- [ ] Test incremental sync (existing highlights, none updated)
- [ ] Test with highlights that have no book_id
- [ ] Test with highlights for books not in database
- [ ] Test error scenarios (API timeout, DB connection loss)
- [ ] Verify lastSynced timestamp updates correctly
- [ ] Check logs provide useful information

---

## Rollback Plan

If issues arise:
1. Stories 1-2 are the core changes - they're independent and can be rolled back separately
2. Keep the original file as `sync-highlights.ts.backup`
3. Feature flag could control which version runs
4. Monitor error rates in Inngest dashboard after deployment

---

## Additional Considerations

### Database Index Requirements
Ensure these indexes exist for optimal performance:

**For Highlights:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS highlights_rw_id_user_id_unique 
ON highlights(rw_id, user_id);

CREATE INDEX IF NOT EXISTS highlights_user_id_idx 
ON highlights(user_id);

CREATE INDEX IF NOT EXISTS highlights_book_id_idx 
ON highlights(book_id);
```

**For Books:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS books_rw_id_user_id_unique 
ON books(rw_id, user_id);

CREATE INDEX IF NOT EXISTS books_user_id_idx 
ON books(user_id);
```

### Rate Limiting
Readwise API has rate limits. Current throttling should be sufficient, but monitor:
- Stay under 20 requests/minute (current implementation handles this)
- Consider adding exponential backoff for 429 responses

### Applying to sync-books.ts
All optimizations in this plan should be applied to `sync-books.ts` with the following adjustments:
- Story 1: Replace individual book updates with upsert (same pattern as highlights)
- Story 2: Use `updatedAfter` parameter for incremental book sync
- Story 3: Skip fetching all books on incremental syncs
- Stories 4-6: Apply same patterns as highlights

The implementation is nearly identical - just replace "highlights" with "books" and adjust field names.

### Future Optimizations (Out of Scope)
- Parallel processing of batches (requires careful transaction management)
- Streaming upserts instead of batch (for very large datasets)
- Delta sync with checksum comparison (overkill for current scale)
- Database stored procedures for bulk operations (adds complexity)

---

## Success Metrics

Track these metrics before and after optimization:
- Average sync duration (incremental)
- Average sync duration (full)
- API requests per sync
- Database queries per sync
- Error rate
- User-reported sync issues

Target: 90%+ reduction in sync time for incremental syncs

