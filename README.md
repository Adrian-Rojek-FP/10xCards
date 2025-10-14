# 10xCards

A web application for rapid flashcard creation and learning, powered by AI and a simple spaced repetition system.

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
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
| **Testing**           | [Vitest](https://vitest.dev/) (Unit Tests), [Playwright](https://playwright.dev/) (E2E Tests), [Testing Library](https://testing-library.com/) |
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

### Development
- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run preview`: Serves the production build locally for preview.

### Code Quality
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

### Testing
- `npm run test`: Run unit tests in watch mode (Vitest).
- `npm run test:run`: Run unit tests once.
- `npm run test:ui`: Run unit tests with UI interface.
- `npm run test:coverage`: Generate code coverage report.
- `npm run test:e2e`: Run end-to-end tests (Playwright).
- `npm run test:e2e:ui`: Run E2E tests with UI interface.
- `npm run test:e2e:debug`: Debug E2E tests.

For more testing information, see [tests/README.md](tests/README.md) and [TESTING_SETUP.md](TESTING_SETUP.md).

## Testing

The project includes comprehensive testing setup for both unit and E2E tests:

### Unit Tests (Vitest)
- Component testing with React Testing Library
- Service and utility function testing
- Mocking support with `vi` object
- Watch mode for development
- Coverage reporting

### E2E Tests (Playwright)
- Browser automation testing (Chromium)
- Page Object Model pattern
- Resilient locators
- API testing support
- Visual regression testing
- Trace viewer for debugging

### Quick Start

Run unit tests:
```sh
npm run test
```

Run E2E tests:
```sh
npm run test:e2e
```

For detailed testing documentation, see:
- [tests/README.md](tests/README.md) - Full testing guide
- [tests/QUICK_START.md](tests/QUICK_START.md) - Quick start guide
- [tests/SNIPPETS.md](tests/SNIPPETS.md) - Code snippets and templates
- [TESTING_SETUP.md](TESTING_SETUP.md) - Setup documentation

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