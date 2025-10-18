-- migration: update RLS policies for immutable tables
-- description: removes UPDATE and DELETE policies from generation_error_logs table
--              to enforce immutability for audit integrity
-- tables affected: generation_error_logs
-- special notes: 
--   - generation_error_logs should be immutable like review_history
--   - error logs are append-only for debugging and monitoring
--   - records are only deleted via CASCADE when user is deleted (GDPR compliance)

-- ============================================================================
-- drop unnecessary RLS policies: generation_error_logs table
-- description: remove UPDATE and DELETE policies to enforce immutability
-- rationale: error logs are audit records and should never be modified or manually deleted
-- ============================================================================

-- drop UPDATE policy (error logs should not be modifiable)
drop policy if exists "generation_error_logs_update_policy_authenticated" 
  on public.generation_error_logs;

-- drop DELETE policy (error logs should only be deleted via CASCADE)
drop policy if exists "generation_error_logs_delete_policy_authenticated" 
  on public.generation_error_logs;

-- note: SELECT and INSERT policies remain active
-- users can view their own error logs and create new ones, but cannot modify or delete them

