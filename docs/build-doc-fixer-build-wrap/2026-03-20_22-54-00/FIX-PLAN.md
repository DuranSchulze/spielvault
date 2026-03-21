# Fix Plan

## Step 1: Module '"@/lib/utils"' has no exported member 'formatDate'.

- Addresses: npm run build
- Recommended change: Either export the missing symbol from the target module or replace the import with an existing helper that matches the intended behavior.
- Why now: The build cannot complete until the missing export or import mismatch is corrected.
- Rerun criteria: Rerun all commands.

## Final validation

After all planned fixes land, rerun the full command sequence in order to confirm both lint and build succeed and no new issues are introduced.
