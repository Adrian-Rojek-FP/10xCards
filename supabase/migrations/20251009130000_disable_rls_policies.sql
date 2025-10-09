-- migration: disable RLS policies for development
-- description: disables all RLS policies on flashcards, generations, and generation_error_logs tables
-- tables affected: flashcards, generations, generation_error_logs
-- special notes: 
--   - This migration is for development purposes
--   - RLS can be re-enabled by creating a reverse migration

-- ============================================================================
-- drop RLS policies: flashcards table
-- ============================================================================

drop policy if exists "flashcards_select_policy_authenticated" on public.flashcards;
drop policy if exists "flashcards_insert_policy_authenticated" on public.flashcards;
drop policy if exists "flashcards_update_policy_authenticated" on public.flashcards;
drop policy if exists "flashcards_delete_policy_authenticated" on public.flashcards;

-- ============================================================================
-- drop RLS policies: generations table
-- ============================================================================

drop policy if exists "generations_select_policy_authenticated" on public.generations;
drop policy if exists "generations_insert_policy_authenticated" on public.generations;
drop policy if exists "generations_update_policy_authenticated" on public.generations;
drop policy if exists "generations_delete_policy_authenticated" on public.generations;

-- ============================================================================
-- drop RLS policies: generation_error_logs table
-- ============================================================================

drop policy if exists "generation_error_logs_select_policy_authenticated" on public.generation_error_logs;
drop policy if exists "generation_error_logs_insert_policy_authenticated" on public.generation_error_logs;
drop policy if exists "generation_error_logs_update_policy_authenticated" on public.generation_error_logs;
drop policy if exists "generation_error_logs_delete_policy_authenticated" on public.generation_error_logs;

-- ============================================================================
-- disable RLS on all tables
-- ============================================================================

alter table public.flashcards disable row level security;
alter table public.generations disable row level security;
alter table public.generation_error_logs disable row level security;

