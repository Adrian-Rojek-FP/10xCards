-- migration: create learning_state table
-- description: creates learning_state table for tracking SM-2 algorithm state per flashcard
-- tables affected: learning_state (new)
-- special notes: 
--   - implements SM-2 (SuperMemo 2) spaced repetition algorithm
--   - one learning_state record per flashcard per user (unique constraint)
--   - automatically created via trigger when flashcard is inserted
--   - includes RLS policies for data isolation

-- ============================================================================
-- table: learning_state
-- description: stores learning progress and SM-2 algorithm state for each flashcard
-- ============================================================================
create table public.learning_state (
  id bigserial primary key,
  flashcard_id bigint not null references public.flashcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.learning_status not null default 'new',
  easiness_factor decimal(3,2) not null default 2.50 
    check (easiness_factor >= 1.30 and easiness_factor <= 3.00),
  interval integer not null default 0 
    check (interval >= 0),
  repetitions integer not null default 0 
    check (repetitions >= 0),
  lapses integer not null default 0 
    check (lapses >= 0),
  next_review_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- unique constraint: one learning state per flashcard per user
  unique(flashcard_id, user_id)
);

-- add comment to table
comment on table public.learning_state is 
  'stores SM-2 algorithm state for spaced repetition learning per flashcard and user';

-- add comments to columns
comment on column public.learning_state.flashcard_id is 
  'reference to the flashcard being learned';

comment on column public.learning_state.user_id is 
  'reference to the user learning this flashcard';

comment on column public.learning_state.status is 
  'current learning phase: new, learning, review, or relearning';

comment on column public.learning_state.easiness_factor is 
  'SM-2 easiness factor (1.30-3.00), determines interval growth rate';

comment on column public.learning_state.interval is 
  'number of days until next review (0 = ready for immediate review)';

comment on column public.learning_state.repetitions is 
  'count of consecutive successful reviews';

comment on column public.learning_state.lapses is 
  'count of times flashcard was forgotten (rating: again)';

comment on column public.learning_state.next_review_date is 
  'timestamp when flashcard becomes available for next review';

-- ============================================================================
-- indexes: learning_state table
-- description: optimized indexes for spaced repetition queries
-- ============================================================================

-- index for fetching all learning states for a user
create index idx_learning_state_user_id 
  on public.learning_state(user_id);

comment on index public.idx_learning_state_user_id is 
  'speeds up queries for all user learning states';

-- index for fetching learning state of specific flashcard
create index idx_learning_state_flashcard_id 
  on public.learning_state(flashcard_id);

comment on index public.idx_learning_state_flashcard_id is 
  'speeds up queries for learning state of specific flashcard';

-- composite index for finding flashcards due for review (most critical for performance)
-- this is the most important index for the learning session queries
create index idx_learning_state_next_review 
  on public.learning_state(user_id, next_review_date, status);

comment on index public.idx_learning_state_next_review is 
  'speeds up queries for flashcards due for review (critical for learning sessions)';

-- composite index for filtering by learning status
create index idx_learning_state_status 
  on public.learning_state(user_id, status);

comment on index public.idx_learning_state_status is 
  'speeds up queries filtering flashcards by learning status';

-- ============================================================================
-- trigger: update_learning_state_updated_at
-- description: automatically updates updated_at timestamp on learning_state modification
-- ============================================================================
create trigger update_learning_state_updated_at
  before update on public.learning_state
  for each row
  execute function public.update_updated_at_column();

comment on trigger update_learning_state_updated_at on public.learning_state is 
  'auto-updates updated_at on learning state modifications';

-- ============================================================================
-- trigger function: create_initial_learning_state
-- description: automatically creates initial learning state when flashcard is created
-- rationale: every flashcard needs a learning state to be usable in learning sessions
-- ============================================================================
create or replace function public.create_initial_learning_state()
returns trigger
language plpgsql
as $$
begin
  insert into public.learning_state (
    flashcard_id,
    user_id,
    status,
    easiness_factor,
    interval,
    repetitions,
    lapses,
    next_review_date
  ) values (
    new.id,
    new.user_id,
    'new',
    2.50,
    0,
    0,
    0,
    now()
  );
  return new;
end;
$$;

comment on function public.create_initial_learning_state is 
  'trigger function to auto-create initial learning state for new flashcards';

-- ============================================================================
-- trigger: create_learning_state_after_flashcard_insert
-- description: fires after flashcard insert to create initial learning state
-- ============================================================================
create trigger create_learning_state_after_flashcard_insert 
  after insert on public.flashcards
  for each row
  execute function public.create_initial_learning_state();

comment on trigger create_learning_state_after_flashcard_insert on public.flashcards is 
  'creates initial learning state (status=new, EF=2.50) when flashcard is created';

-- ============================================================================
-- row level security: enable RLS on learning_state table
-- description: enables row-level security to ensure data isolation per user
-- ============================================================================
alter table public.learning_state enable row level security;

-- ============================================================================
-- RLS policies: learning_state table
-- description: ensures authenticated users can perform CRUD operations only on their own learning states
-- rationale: learning progress is private and must be isolated per user
-- ============================================================================

-- policy: authenticated users can select their own learning states
create policy "learning_state_select_policy_authenticated"
  on public.learning_state
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "learning_state_select_policy_authenticated" on public.learning_state is 
  'allows authenticated users to view only their own learning progress';

-- policy: authenticated users can insert their own learning states
create policy "learning_state_insert_policy_authenticated"
  on public.learning_state
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy "learning_state_insert_policy_authenticated" on public.learning_state is 
  'allows authenticated users to create learning states for themselves only';

-- policy: authenticated users can update their own learning states
create policy "learning_state_update_policy_authenticated"
  on public.learning_state
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on policy "learning_state_update_policy_authenticated" on public.learning_state is 
  'allows authenticated users to update only their own learning progress';

-- policy: authenticated users can delete their own learning states
create policy "learning_state_delete_policy_authenticated"
  on public.learning_state
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy "learning_state_delete_policy_authenticated" on public.learning_state is 
  'allows authenticated users to delete only their own learning states';

