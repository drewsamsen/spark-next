# Scheduled Task Automations - Implementation Guide

## Overview

The application now features a centralized **Scheduled Task Automation** system. Users can configure any supported Inngest function to run automatically on a schedule (hourly, daily, weekly, or monthly) directly from the **Automations** tab in Settings.

### Supported Schedulable Tasks

Currently, the following tasks can be scheduled:
- **Import Readwise Books** - Sync books from Readwise
- **Sync Readwise Highlights** - Import highlights from Readwise
- **Import Sparks from Airtable** - Import sparks from Airtable

All scheduling is managed through a single, compact dropdown interface in the Automations table.

## How It Works

### Architecture

The system uses a **generic, scalable approach** with Inngest's cron scheduling:

1. **Single Cron Job** - One hourly cron function (`scheduled-tasks-cron`) handles all scheduled tasks
2. **Centralized Configuration** - Task schedules stored in `user_settings.scheduledTasks`
3. **Task Registry** - `TASK_CONFIG` mapping defines how each task is triggered
4. **UI Integration** - Simple dropdown selectors in the Automations table

**Why Inngest Instead of Vercel Cron Jobs:**
- Already using Inngest for all background jobs
- Inngest handles retries and error handling automatically
- No additional Vercel configuration needed
- All executions automatically logged to database

### Components

#### 1. Cron Function (`src/inngest/functions/scheduled/tasks-cron.ts`)

- **Schedule**: Runs **hourly** at minute 0 (`0 * * * *` cron expression)
- **Process**:
  1. Queries all users with any scheduled tasks configured
  2. For each user's enabled tasks:
     - Validates required settings (API keys, etc.)
     - Checks if task is due based on frequency:
       - **Hourly**: Runs if ≥1 hour has passed
       - **Daily**: Runs if ≥23 hours have passed
       - **Weekly**: Runs if ≥7 days have passed
       - **Monthly**: Runs if ≥30 days have passed
  3. Triggers the appropriate Inngest event for each eligible task
  4. Updates `lastRun` timestamp after triggering

#### 2. Task Configuration Registry

The `TASK_CONFIG` object maps task IDs to their execution logic:

```typescript
{
  "airtable-import-sparks": {
    eventName: "airtable/import-sparks",
    getEventData: (userId, settings) => ({...}),
    validateSettings: (settings) => {...}
  },
  "readwise-books-import": {...},
  "readwise-highlights-sync": {...}
}
```

Adding a new schedulable task requires:
1. Adding entry to `TASK_CONFIG`
2. Setting `isSchedulable: true` in task definition
3. No UI changes needed!

#### 3. User Settings Structure

The `user_settings` table now includes a generic `scheduledTasks` object:

```typescript
{
  scheduledTasks: {
    [taskId: string]: {
      enabled: boolean;
      frequency: 'off' | 'hourly' | 'daily' | 'weekly' | 'monthly';
      lastRun?: string;
    }
  }
}
```

Example:
```json
{
  "scheduledTasks": {
    "airtable-import-sparks": {
      "enabled": true,
      "frequency": "daily",
      "lastRun": "2025-10-08T14:00:00Z"
    },
    "readwise-highlights-sync": {
      "enabled": true,
      "frequency": "weekly",
      "lastRun": "2025-10-07T14:00:00Z"
    }
  }
}
```

#### 4. UI Component (`src/components/ScheduledTasks/TaskRow.tsx`)

Each task row in the Automations table includes:

- **Schedule Dropdown** - Simple select with options:
  - Off
  - Hourly
  - Daily
  - Weekly
  - Monthly
- **Auto-save** - Changes save immediately on selection
- **Smart Visibility** - Only shows for tasks marked `isSchedulable: true`
- **Validation** - Automatically checks if user has required API keys

## Deployment Considerations

### Vercel Deployment

Since this uses Inngest cron jobs, no special Vercel configuration is needed. The cron job will work automatically once deployed because:

1. Inngest runs the cron jobs on their infrastructure
2. They call your deployed API endpoint (`/api/inngest`) to execute the function
3. The Inngest dashboard will show all scheduled runs

### Environment Variables Required

Make sure these are set in your Vercel environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### Inngest Configuration

1. **Register the app** - Make sure your app is registered with Inngest
2. **Sync functions** - After deployment, Inngest will automatically detect the new cron function
3. **Monitor** - View cron job executions in the Inngest dashboard at https://app.inngest.com

## User Guide

### Setting Up Scheduled Tasks

1. **Configure Integration** (if needed):
   - Go to **Settings → Integrations**
   - Set up Airtable or Readwise credentials
   - Save and verify connection

2. **Schedule a Task**:
   - Go to **Settings → Automations**
   - Find the task you want to schedule
   - Use the **Schedule** dropdown to select frequency:
     - **Off** - Disable scheduling
     - **Hourly** - Run every hour
     - **Daily** - Run once per day
     - **Weekly** - Run once per week
     - **Monthly** - Run once per month
   - Changes save automatically!

3. **Verify**:
   - The cron job runs every hour at minute 0
   - It checks if each task is due based on your frequency
   - Only runs tasks that haven't run recently enough

### Monitoring Tasks

- **Function Logs**: All task executions are logged in the database (visible in Automations tab)
- **Inngest Dashboard**: Developers can view detailed execution logs at app.inngest.com
- **Last Run Tracking**: Each task stores its `lastRun` timestamp to prevent duplicate runs

## Files Modified

### New Files Created:
- `src/inngest/functions/scheduled/tasks-cron.ts` - Generic cron function for all scheduled tasks
- `src/inngest/functions/scheduled/index.ts` - Export file

### Modified Files:

**Core Types & Services:**
- `src/lib/types.ts` - Added `scheduledTasks` to `UserSettings`
- `src/lib/user-settings-service.ts` - Added `getTaskSchedule()` and `updateTaskSchedule()` functions
- `src/components/ScheduledTasks/types.tsx` - Added `TaskScheduleConfig` interface

**UI Components:**
- `src/components/ScheduledTasks/TaskRow.tsx` - Added schedule dropdown selector
- `src/components/ScheduledTasks/TaskList.tsx` - Marked appropriate tasks as schedulable
- `src/components/integrations/AirtableIntegration.tsx` - Removed scheduling UI, added tip to use Automations tab

**Integration Updates:**
- `src/services/integrations.service.ts` - Cleaned up Airtable settings interface
- `src/repositories/integrations.repository.ts` - Removed scheduled import handling
- `src/inngest/index.ts` - Exported `scheduledTasksCronFn`
- `src/app/api/inngest/route.ts` - Registered the new cron function

## Technical Notes

### Deduplication

The existing import function already handles deduplication using the `md5_uid` field from Airtable. This means:

- Scheduled imports are safe to run repeatedly
- Only new records will be imported
- Existing records are skipped automatically

### Error Handling

- If a user's import fails, it won't affect other users
- Each user's import is wrapped in try-catch blocks
- Errors are logged via Inngest's logging system
- Failed imports won't update the `lastRun` timestamp, so they'll retry on the next cron run

### Performance

- The cron job runs efficiently by batching database queries
- Only users with `scheduledImport.enabled = true` are processed
- The import is triggered asynchronously using Inngest events
- No blocking operations in the cron function

## Testing

### Manual Testing

1. Enable scheduled imports for your account
2. Manually trigger a test by calling the Inngest function directly from the Inngest dashboard
3. Verify in Function Logs that the import completed successfully

### Automated Testing

The cron job will automatically run daily at 2 AM UTC. To test:

1. Set your frequency to "Daily"
2. Wait for the next scheduled run (or trigger manually)
3. Check the "Last scheduled run" timestamp updates correctly
4. Verify new sparks appear in your account

## Troubleshooting

### Imports Not Running

1. **Check Inngest Dashboard** - Verify the cron job is registered and running
2. **Check User Settings** - Ensure `scheduledImport.enabled` is `true` in the database
3. **Check Airtable Credentials** - Verify API key, base ID, and table ID are valid
4. **Check Logs** - Review function logs for any error messages

### Imports Running Too Frequently

- The frequency setting only affects when imports are eligible to run
- The cron job itself always runs daily at 2 AM UTC
- The function checks if enough time has passed based on your frequency setting

### Missing Data

- Check the import function logs for skip reasons
- Common reasons: missing uid, missing content, missing categories/tags
- Verify your Airtable data structure matches the expected format

## Adding New Schedulable Tasks

To make a new Inngest function schedulable:

1. **Add to Task Config** (`src/inngest/functions/scheduled/tasks-cron.ts`):
```typescript
TASK_CONFIG["your-task-id"] = {
  eventName: "your/event-name",
  getEventData: (userId, settings) => ({
    userId,
    // ... other event data
  }),
  validateSettings: (settings) => {
    // Return true if user has required settings
    return !!settings.someRequiredValue;
  }
};
```

2. **Mark as Schedulable** (`src/components/ScheduledTasks/TaskList.tsx`):
```typescript
{
  id: "your-task-id",
  name: "Your Task Name",
  description: "What it does",
  isSchedulable: true,  // ← Set to true
  triggerEndpoint: "/api/inngest/trigger-your-task",
  requiresApiKey: false
}
```

That's it! The UI will automatically show the schedule dropdown.

## Future Enhancements

Potential improvements:

1. **Time-of-Day Selection** - Allow users to choose specific hours
2. **Email Notifications** - Send summary after each run
3. **Pause/Resume** - Temporarily disable without losing settings
4. **Run History** - Show last N runs in the UI
5. **Conditional Scheduling** - Only run if certain conditions are met

