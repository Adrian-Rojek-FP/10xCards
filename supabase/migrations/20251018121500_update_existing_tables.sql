-- migration: update existing tables with enhanced constraints and triggers
-- description: adds missing constraints, indexes, and triggers to generations table
--              and converts flashcards.source to use enum type
-- tables affected: generations, flashcards
-- special notes: 
--   - adds check constraints to generations for data validation
--   - adds triggers for auto-updating generations.updated_at
--   - adds trigger for auto-updating accepted counts in generations
--   - adds composite indexes for better query performance
--   - converts flashcards.source from varchar with check to enum type

-- ============================================================================
-- update table: generations
-- description: add missing check constraints and default values
-- ============================================================================

-- add check constraint for generated_count (must be >= 0)
alter table public.generations 
  add constraint check_generated_count_non_negative 
  check (generated_count >= 0);

comment on constraint check_generated_count_non_negative on public.generations is 
  'ensures generated_count is non-negative';

-- add check constraint for accepted_unedited_count (must be >= 0)
alter table public.generations 
  add constraint check_accepted_unedited_count_non_negative 
  check (accepted_unedited_count >= 0);

comment on constraint check_accepted_unedited_count_non_negative on public.generations is 
  'ensures accepted_unedited_count is non-negative';

-- add check constraint for accepted_edited_count (must be >= 0)
alter table public.generations 
  add constraint check_accepted_edited_count_non_negative 
  check (accepted_edited_count >= 0);

comment on constraint check_accepted_edited_count_non_negative on public.generations is 
  'ensures accepted_edited_count is non-negative';

-- add check constraint for generation_duration (must be > 0 and <= 300000ms = 5 minutes)
alter table public.generations 
  add constraint check_generation_duration_valid 
  check (generation_duration > 0 and generation_duration <= 300000);

comment on constraint check_generation_duration_valid on public.generations is 
  'ensures generation_duration is positive and does not exceed 5 minutes (300000ms)';

-- set default values for accepted counts
alter table public.generations 
  alter column accepted_unedited_count set default 0;

alter table public.generations 
  alter column accepted_edited_count set default 0;

-- update column length constraint for source_text_hash to match SHA-256 output (64 chars)
alter table public.generations 
  alter column source_text_hash type varchar(64);

-- update column length constraint for model
alter table public.generations 
  alter column model type varchar(100);

-- ============================================================================
-- trigger: update_generations_updated_at
-- description: automatically updates updated_at timestamp on generations modification
-- ============================================================================
create trigger update_generations_updated_at
  before update on public.generations
  for each row
  execute function public.update_updated_at_column();

comment on trigger update_generations_updated_at on public.generations is 
  'auto-updates updated_at on generation record modifications';

-- ============================================================================
-- indexes: generations table
-- description: add composite index for deduplication and performance
-- ============================================================================

-- composite index for checking duplicate generations (same user + same source text)
create index idx_generations_hash_lookup 
  on public.generations(user_id, source_text_hash);

comment on index public.idx_generations_hash_lookup is 
  'speeds up deduplication checks for same source text by user';

-- index for sorting generations by creation date
create index idx_generations_created_at 
  on public.generations(user_id, created_at desc);

comment on index public.idx_generations_created_at is 
  'speeds up queries for user generation history sorted by date';

-- ============================================================================
-- indexes: generation_error_logs table
-- description: add index for sorting error logs by creation date
-- ============================================================================

-- index for sorting error logs by creation date (for diagnostics)
create index idx_generation_error_logs_created_at 
  on public.generation_error_logs(created_at desc);

comment on index public.idx_generation_error_logs_created_at is 
  'speeds up queries for recent error logs sorted by date';

-- ============================================================================
-- update table: flashcards
-- description: convert source column from varchar to enum type
-- ============================================================================

-- step 1: add new column with enum type
alter table public.flashcards 
  add column source_enum public.flashcard_source;

-- step 2: migrate data from old column to new column
update public.flashcards 
  set source_enum = source::public.flashcard_source;

-- step 3: drop old column
alter table public.flashcards 
  drop column source;

-- step 4: rename new column to original name
alter table public.flashcards 
  rename column source_enum to source;

-- step 5: add not null constraint
alter table public.flashcards 
  alter column source set not null;

comment on column public.flashcards.source is 
  'origin of flashcard: ai-full (unedited), ai-edited (modified), or manual (user-created)';

-- ============================================================================
-- trigger function: update_generation_accepted_counts
-- description: automatically updates accepted counts in generations table when flashcards are inserted
-- rationale: maintains accurate statistics about user acceptance of AI-generated flashcards
-- ============================================================================
create or replace function public.update_generation_accepted_counts()
returns trigger
language plpgsql
as $$
begin
  -- only process flashcards that reference a generation (AI-generated)
  if new.generation_id is not null then
    -- increment accepted_unedited_count for ai-full source
    if new.source = 'ai-full' then
      update public.generations 
      set accepted_unedited_count = coalesce(accepted_unedited_count, 0) + 1
      where id = new.generation_id;
    
    -- increment accepted_edited_count for ai-edited source
    elsif new.source = 'ai-edited' then
      update public.generations 
      set accepted_edited_count = coalesce(accepted_edited_count, 0) + 1
      where id = new.generation_id;
    end if;
  end if;
  
  return new;
end;
$$;

comment on function public.update_generation_accepted_counts is 
  'trigger function to auto-update accepted counts in generations when flashcards are saved';

-- ============================================================================
-- trigger: update_accepted_counts_after_flashcard_insert
-- description: fires after flashcard insert to update generation statistics
-- ============================================================================
create trigger update_accepted_counts_after_flashcard_insert 
  after insert on public.flashcards
  for each row
  execute function public.update_generation_accepted_counts();

comment on trigger update_accepted_counts_after_flashcard_insert on public.flashcards is 
  'updates generation accepted counts when user saves AI-generated flashcards';

