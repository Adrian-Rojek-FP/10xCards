# 10xCards

A web application for rapid flashcard creation and learning, powered by AI and a simple spaced repetition system.

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10xCards is designed to solve the problem of tedious and time-consuming manual flashcard creation. It allows users, particularly students, to quickly convert their notes into study material. By simply pasting a block of text, users can leverage AI to automatically generate a set of flashcards. These cards can then be reviewed, edited, and saved into private decks tied to a user account.

The learning process is facilitated by a simple, yet effective, Leitner spaced repetition algorithm to help users efficiently memorize their material.

## Tech Stack

| Category              | Technology                                                              |
| --------------------- | ----------------------------------------------------------------------- |
| **Frontend**          | [Astro](https://astro.build/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/) |
| **Backend**           | [Supabase](https://supabase.com/) (PostgreSQL, Authentication, BaaS)      |
| **AI Integration**    | [OpenRouter.ai](https://openrouter.ai/) (Access to various LLMs)        |
| **CI/CD & Hosting**   | [GitHub Actions](https://github.com/features/actions), [DigitalOcean](https://www.digitalocean.com/) (Docker) |

## Getting Started Locally

Follow these instructions to get the project running on your local machine for development and testing purposes.

### Prerequisites

- **Node.js**: Version `22.14.0`. We recommend using a version manager like [nvm](https://github.com/nvm-sh/nvm).
  ```sh
  nvm use
  ```
- **Git**: You'll need Git to clone the repository.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/10x-cards.git
    cd 10x-cards
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file.
    ```sh
    cp .env.example .env
    ```
    Then, fill in the required environment variables in the `.env` file (e.g., Supabase URL/keys and OpenRouter API key).

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the project:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run preview`: Serves the production build locally for preview.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

## Project Scope

### Key Features (MVP)

- **AI-Powered Flashcard Generation**: Create flashcards automatically from pasted text (1,000-10,000 characters).
- **Review & Edit Workflow**: Users can review, edit, or delete AI-generated flashcards before saving them to a deck.
- **User Authentication**: Secure user accounts (email/password) to store and manage private flashcard decks.
- **Manual Card Creation**: Ability to manually add individual flashcards to a deck.
- **Spaced Repetition System**: A simple Leitner (5-box) system to facilitate learning.
- **Deck Management**: Users can create, view, and delete their flashcard decks.

### Out of Scope (for MVP)

- Advanced or customizable spaced repetition algorithms.
- Importing content from files (e.g., PDF, DOCX).
- Sharing decks between users.
- Native mobile applications (the project is web-only but responsive).
- Password reset functionality and Single Sign-On (SSO).

## Project Status

**Version:** 0.0.1

The project is currently in the initial **MVP (Minimum Viable Product) development phase**. The core features are being built out as defined in the project scope.

## License

This project is currently not under any license.