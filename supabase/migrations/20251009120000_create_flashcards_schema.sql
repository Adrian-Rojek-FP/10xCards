-- migration: create flashcards schema
-- description: creates the core schema for 10xCards application including flashcards, 
--              generations, and generation_error_logs tables with proper RLS policies
-- tables affected: flashcards, generations, generation_error_logs
-- special notes: 
--   - users table is managed by Supabase Auth (auth.users)
--   - includes trigger for auto-updating updated_at column in flashcards
--   - implements granular RLS policies for authenticated users

-- ============================================================================
-- table: generations
-- description: stores metadata about AI generation sessions for flashcards
-- ============================================================================
create table public.generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  generation_duration integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comment to table
comment on table public.generations is 'stores metadata about AI-generated flashcard sessions';

-- add comments to columns
comment on column public.generations.model is 'AI model used for generation';
comment on column public.generations.generated_count is 'total number of flashcards generated in this session';
comment on column public.generations.accepted_unedited_count is 'number of cards accepted without edits';
comment on column public.generations.accepted_edited_count is 'number of cards accepted after editing';
comment on column public.generations.source_text_hash is 'hash of source text to detect duplicates';
comment on column public.generations.source_text_length is 'length of source text in characters (1000-10000)';
comment on column public.generations.generation_duration is 'time taken for generation in milliseconds';

-- ============================================================================
-- table: flashcards
-- description: stores individual flashcards with front/back content and metadata
-- ============================================================================
create table public.flashcards (
  id bigserial primary key,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generation_id bigint references public.generations(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade
);

-- add comment to table
comment on table public.flashcards is 'stores user flashcards with front and back content';

-- add comments to columns
comment on column public.flashcards.front is 'front side of flashcard (max 200 chars)';
comment on column public.flashcards.back is 'back side of flashcard (max 500 chars)';
comment on column public.flashcards.source is 'origin of flashcard: ai-full (unedited), ai-edited, or manual';
comment on column public.flashcards.generation_id is 'optional reference to generation session';

-- ============================================================================
-- table: generation_error_logs
-- description: logs errors that occur during AI generation attempts
-- ============================================================================
create table public.generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- add comment to table
comment on table public.generation_error_logs is 'logs errors from AI generation attempts for debugging and monitoring';

-- add comments to columns
comment on column public.generation_error_logs.error_code is 'standardized error code for categorization';
comment on column public.generation_error_logs.error_message is 'detailed error message for debugging';

-- ============================================================================
-- indexes
-- description: improves query performance for common access patterns
-- ============================================================================

-- index for flashcards queries by user
create index idx_flashcards_user_id on public.flashcards(user_id);
comment on index public.idx_flashcards_user_id is 'speeds up queries for user flashcards';

-- index for flashcards queries by generation
create index idx_flashcards_generation_id on public.flashcards(generation_id);
comment on index public.idx_flashcards_generation_id is 'speeds up queries for flashcards from specific generation';

-- index for generations queries by user
create index idx_generations_user_id on public.generations(user_id);
comment on index public.idx_generations_user_id is 'speeds up queries for user generation history';

-- index for error logs queries by user
create index idx_generation_error_logs_user_id on public.generation_error_logs(user_id);
comment on index public.idx_generation_error_logs_user_id is 'speeds up queries for user error logs';

-- ============================================================================
-- trigger function: update_updated_at_column
-- description: automatically updates updated_at timestamp on record modification
-- ============================================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.update_updated_at_column is 'trigger function to auto-update updated_at timestamp';

-- ============================================================================
-- trigger: update_flashcards_updated_at
-- description: fires before update on flashcards to set updated_at timestamp
-- ============================================================================
create trigger update_flashcards_updated_at
  before update on public.flashcards
  for each row
  execute function public.update_updated_at_column();

comment on trigger update_flashcards_updated_at on public.flashcards is 'auto-updates updated_at on flashcard modifications';

-- ============================================================================
-- row level security (RLS) - enable RLS on all tables
-- description: enables row-level security to ensure data isolation per user
-- ============================================================================

alter table public.flashcards enable row level security;
alter table public.generations enable row level security;
alter table public.generation_error_logs enable row level security;

-- ============================================================================
-- RLS policies: flashcards table
-- description: ensures users can only access their own flashcards
-- rationale: flashcards contain user-specific learning content and must be private
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
-- description: ensures users can only access their own generation history
-- rationale: generation metadata is user-specific and should remain private
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
-- description: ensures users can only access their own error logs
-- rationale: error logs contain user activity data and should remain private
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

