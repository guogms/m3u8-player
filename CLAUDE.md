# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.

## Architecture

This is a Next.js application that serves as an M3U8 video player.

- **Framework**: The project is built with [Next.js](https://nextjs.org/) (App Router).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) is used for styling, along with CSS modules.
- **UI Components**: The project uses [Shadcn UI](https://ui.shadcn.com/) for its component library. Custom components are located in `components/`, while the Shadcn UI components are in `components/ui/`.
- **Routing**: The application uses the Next.js App Router. The main page is `app/page.tsx`, which provides a form to input an M3U8 URL. The player logic is likely handled by the `/api/player` endpoint and a corresponding page.
- **Utilities**: General utility functions are located in `lib/utils.ts`.
