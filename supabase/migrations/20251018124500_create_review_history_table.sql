-- migration: create review_history table
-- description: creates immutable review_history table for tracking all user review sessions
-- tables affected: review_history (new)
-- special notes: 
--   - immutable table: no UPDATE or DELETE policies (only SELECT and INSERT)
--   - stores complete audit trail of all flashcard reviews
--   - captures before/after state for SM-2 algorithm analysis
--   - records are only deleted via CASCADE when user/flashcard is deleted (GDPR compliance)

-- ============================================================================
-- table: review_history
-- description: immutable audit log of all flashcard review sessions and ratings
-- ============================================================================
create table public.review_history (
  id bigserial primary key,
  flashcard_id bigint not null references public.flashcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null 
    check (rating in (0, 1, 2, 3)),
  review_duration_ms integer 
    check (review_duration_ms > 0),
  previous_interval integer not null 
    check (previous_interval >= 0),
  new_interval integer not null 
    check (new_interval >= 0),
  previous_easiness_factor decimal(3,2) not null 
    check (previous_easiness_factor >= 1.30 and previous_easiness_factor <= 3.00),
  new_easiness_factor decimal(3,2) not null 
    check (new_easiness_factor >= 1.30 and new_easiness_factor <= 3.00),
  reviewed_at timestamptz not null default now()
);

-- add comment to table
comment on table public.review_history is 
  'immutable audit log of all flashcard reviews with before/after SM-2 state (no updates or deletes allowed)';

-- add comments to columns
comment on column public.review_history.flashcard_id is 
  'reference to the reviewed flashcard';

comment on column public.review_history.user_id is 
  'reference to the user who performed the review';

comment on column public.review_history.rating is 
  'user self-assessment rating: 0=again (forgot), 1=hard, 2=good, 3=easy';

comment on column public.review_history.review_duration_ms is 
  'optional time taken to review flashcard in milliseconds';

comment on column public.review_history.previous_interval is 
  'interval in days before this review (captures state before review)';

comment on column public.review_history.new_interval is 
  'interval in days after this review (captures state after SM-2 calculation)';

comment on column public.review_history.previous_easiness_factor is 
  'easiness factor before this review (captures state before review)';

comment on column public.review_history.new_easiness_factor is 
  'easiness factor after this review (captures state after SM-2 calculation)';

comment on column public.review_history.reviewed_at is 
  'timestamp when review was completed';

-- ============================================================================
-- indexes: review_history table
-- description: optimized indexes for analytics and history queries
-- ============================================================================

-- index for fetching all review history for a user
create index idx_review_history_user_id 
  on public.review_history(user_id);

comment on index public.idx_review_history_user_id is 
  'speeds up queries for all user review history';

-- index for fetching review history of specific flashcard
create index idx_review_history_flashcard_id 
  on public.review_history(flashcard_id);

comment on index public.idx_review_history_flashcard_id is 
  'speeds up queries for review history of specific flashcard';

-- composite index for user analytics sorted by date (most recent first)
create index idx_review_history_reviewed_at 
  on public.review_history(user_id, reviewed_at desc);

comment on index public.idx_review_history_reviewed_at is 
  'speeds up queries for user review history sorted by date (for analytics)';

-- composite index for flashcard history in chronological order
create index idx_review_history_flashcard_reviewed 
  on public.review_history(flashcard_id, reviewed_at desc);

comment on index public.idx_review_history_flashcard_reviewed is 
  'speeds up queries for flashcard review timeline (for progress tracking)';

-- ============================================================================
-- row level security: enable RLS on review_history table
-- description: enables row-level security to ensure data isolation per user
-- ============================================================================
alter table public.review_history enable row level security;

-- ============================================================================
-- RLS policies: review_history table (IMMUTABLE)
-- description: read-only access for users to their own history, insert-only for creating new records
-- rationale: history is immutable for audit integrity - no updates or deletes allowed
--            records are only removed via CASCADE when user or flashcard is deleted (GDPR)
-- ============================================================================

-- policy: authenticated users can select their own review history
create policy "review_history_select_policy_authenticated"
  on public.review_history
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "review_history_select_policy_authenticated" on public.review_history is 
  'allows authenticated users to view only their own review history';

-- policy: authenticated users can insert their own review history
create policy "review_history_insert_policy_authenticated"
  on public.review_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy "review_history_insert_policy_authenticated" on public.review_history is 
  'allows authenticated users to create review history entries for themselves only';

-- note: no UPDATE or DELETE policies - review history is immutable
-- records are only deleted via CASCADE when parent user or flashcard is deleted

