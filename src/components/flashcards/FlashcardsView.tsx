import * as React from "react";
import { Button } from "@/components/ui/button";
import { useFlashcards } from "@/components/hooks/useFlashcards";
import { FlashcardList } from "./FlashcardList";
import { FlashcardFormModal } from "./FlashcardFormModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { PaginationControls } from "./PaginationControls";
import type { FlashcardViewModel, FlashcardCreateDto, FlashcardUpdateDto } from "@/types";

/**
 * Main view component for "My Flashcards" page.
 * Manages state and coordinates interactions between child components.
 */
export function FlashcardsView() {
  const { flashcards, pagination, isLoading, error, createFlashcard, updateFlashcard, deleteFlashcard, setPage } =
    useFlashcards();

  // Modal state management
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingFlashcard, setEditingFlashcard] = React.useState<FlashcardViewModel | null>(null);
  const [deletingFlashcard, setDeletingFlashcard] = React.useState<FlashcardViewModel | null>(null);

  // Handlers for flashcard actions
  const handleAddFlashcard = () => {
    setEditingFlashcard(null);
    setIsFormModalOpen(true);
  };

  const handleEditFlashcard = (flashcard: FlashcardViewModel) => {
    setEditingFlashcard(flashcard);
    setIsFormModalOpen(true);
  };

  const handleDeleteFlashcard = (flashcard: FlashcardViewModel) => {
    setDeletingFlashcard(flashcard);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSave = async (data: FlashcardCreateDto | FlashcardUpdateDto) => {
    try {
      if (editingFlashcard) {
        await updateFlashcard(editingFlashcard.id, data as FlashcardUpdateDto);
      } else {
        await createFlashcard(data as FlashcardCreateDto);
      }
      setIsFormModalOpen(false);
      setEditingFlashcard(null);
    } catch (error) {
      console.error("Error saving flashcard:", error);
      // Error is already set in the hook
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFlashcard) return;

    try {
      await deleteFlashcard(deletingFlashcard.id);
      setIsDeleteDialogOpen(false);
      setDeletingFlashcard(null);
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      // Error is already set in the hook
    }
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingFlashcard(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingFlashcard(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Page header with title and add button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Moje Fiszki</h1>
              {pagination && (
                <p className="text-sm text-muted-foreground mt-1">
                  Łącznie: {pagination.total} {pagination.total === 1 ? "fiszka" : "fiszek"}
                </p>
              )}
            </div>
            <Button onClick={handleAddFlashcard} size="lg">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Dodaj fiszkę
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Nie udało się załadować fiszek. Spróbuj ponownie później.
                  </p>
                  {error.message && <p className="text-xs text-destructive/80 mt-1">{error.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Flashcards list */}
          <FlashcardList
            flashcards={flashcards}
            isLoading={isLoading}
            onEdit={handleEditFlashcard}
            onDelete={handleDeleteFlashcard}
          />

          {/* Pagination controls */}
          {pagination && <PaginationControls pagination={pagination} onPageChange={setPage} />}
        </div>
      </main>

      {/* Form modal for create/edit */}
      <FlashcardFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleFormSave}
        initialData={editingFlashcard || undefined}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
