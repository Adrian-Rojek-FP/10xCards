-- migration: enable RLS policies on all tables
-- description: re-enables row level security on flashcards, generations, and generation_error_logs tables
--              with granular policies for all CRUD operations
-- tables affected: flashcards, generations, generation_error_logs
-- special notes: 
--   - this migration reverses the changes from 20251009130000_disable_rls_policies.sql
--   - implements separate policies for each operation (select, insert, update, delete)
--   - policies are scoped to authenticated users only
--   - each user can only access their own data based on user_id column

-- ============================================================================
-- enable row level security on all tables
-- description: activates RLS to enforce data isolation per user
-- ============================================================================

alter table public.flashcards enable row level security;
alter table public.generations enable row level security;
alter table public.generation_error_logs enable row level security;

-- ============================================================================
-- RLS policies: flashcards table
-- description: ensures authenticated users can perform CRUD operations only on their own flashcards
-- rationale: flashcards contain user-specific learning content and must remain private to each user
-- ============================================================================

-- policy: authenticated users can select their own flashcards
create policy "flashcards_select_policy_authenticated"
  on public.flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "flashcards_select_policy_authenticated" on public.flashcards is 
  'allows authenticated users to view only their own flashcards';

-- policy: authenticated users can insert their own flashcards
create policy "flashcards_insert_policy_authenticated"
  on public.flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy "flashcards_insert_policy_authenticated" on public.flashcards is 
  'allows authenticated users to create flashcards for themselves only';

-- policy: authenticated users can update their own flashcards
create policy "flashcards_update_policy_authenticated"
  on public.flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on policy "flashcards_update_policy_authenticated" on public.flashcards is 
  'allows authenticated users to update only their own flashcards';

-- policy: authenticated users can delete their own flashcards
create policy "flashcards_delete_policy_authenticated"
  on public.flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy "flashcards_delete_policy_authenticated" on public.flashcards is 
  'allows authenticated users to delete only their own flashcards';

-- ============================================================================
-- RLS policies: generations table
-- description: ensures authenticated users can perform CRUD operations only on their own generation records
-- rationale: generation metadata is user-specific and should remain private to track individual usage patterns
-- ============================================================================

-- policy: authenticated users can select their own generations
create policy "generations_select_policy_authenticated"
  on public.generations
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "generations_select_policy_authenticated" on public.generations is 
  'allows authenticated users to view only their own generation history';

-- policy: authenticated users can insert their own generations
create policy "generations_insert_policy_authenticated"
  on public.generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy "generations_insert_policy_authenticated" on public.generations is 
  'allows authenticated users to create generation records for themselves only';

-- policy: authenticated users can update their own generations
create policy "generations_update_policy_authenticated"
  on public.generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on policy "generations_update_policy_authenticated" on public.generations is 
  'allows authenticated users to update only their own generation records';

-- policy: authenticated users can delete their own generations
create policy "generations_delete_policy_authenticated"
  on public.generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy "generations_delete_policy_authenticated" on public.generations is 
  'allows authenticated users to delete only their own generation records';

-- ============================================================================
-- RLS policies: generation_error_logs table
-- description: ensures authenticated users can perform CRUD operations only on their own error logs
-- rationale: error logs contain user activity data and should remain private for debugging purposes
-- ============================================================================

-- policy: authenticated users can select their own error logs
create policy "generation_error_logs_select_policy_authenticated"
  on public.generation_error_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "generation_error_logs_select_policy_authenticated" on public.generation_error_logs is 
  'allows authenticated users to view only their own error logs';

-- policy: authenticated users can insert their own error logs
create policy "generation_error_logs_insert_policy_authenticated"
  on public.generation_error_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy "generation_error_logs_insert_policy_authenticated" on public.generation_error_logs is 
  'allows authenticated users to create error log entries for themselves only';

-- policy: authenticated users can update their own error logs
create policy "generation_error_logs_update_policy_authenticated"
  on public.generation_error_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on policy "generation_error_logs_update_policy_authenticated" on public.generation_error_logs is 
  'allows authenticated users to update only their own error log entries';

-- policy: authenticated users can delete their own error logs
create policy "generation_error_logs_delete_policy_authenticated"
  on public.generation_error_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy "generation_error_logs_delete_policy_authenticated" on public.generation_error_logs is 
  'allows authenticated users to delete only their own error log entries';

