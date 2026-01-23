# Gemini Agent Guide

This document provides context and instructions for AI agents (like Gemini) working on the `hdmap-viewer` repository.

## Project Context
- **Primary Goal**: Parsing and visualizing OpenDRIVE (`.xodr`) High-Definition maps.
- **Monorepo Structure**: Managed with `pnpm` and `Turbo`.
  - `apps/viewer`: Vue 3 + Three.js visualization app.
  - `packages/opendrive-parser`: Core parsing logic.
  - `packages/apollo-map-parser`: Placeholder for Apollo map support.

## Common Agent Tasks

### 1. Development & Testing
- **Run all apps in dev mode**: `pnpm dev`
- **Build all packages**: `pnpm build`
- **Lint the codebase**: `pnpm lint`
- **Clean artifacts**: `pnpm clean`

### 2. Working with the Parser
- Located in `packages/opendrive-parser`.
- When adding support for new OpenDRIVE elements:
  1. Update `src/types/raw.ts` to reflect the XML structure.
  2. Create/Update element classes in `src/elements/`.
  3. Ensure the `process()` method in `src/elements/opendrive.ts` handles any new geometry calculations.

### 3. Working with the Viewer
- Located in `apps/viewer`.
- Key rendering logic is in `src/libs/viewer.ts`.
- To add a new visualization layer:
  1. Define a new `Group` in the `Viewer` class.
  2. Implement an `add[Element]` method that converts parser data to Three.js `BufferGeometry` or `Line2`.
  3. Update `setOpenDrive` to trigger the new rendering logic.

## Project Conventions
- **Language**: Strict TypeScript.
- **Styling**: ESLint with `@antfu/eslint-config`.
- **UI**: Use Naive UI components for any new interface elements in the viewer.
- **Commits**: Follow conventional commits if possible, and use `changeset` for versioning packages.

## Troubleshooting for Agents
- If geometry isn't appearing: Check the `z` and `y` coordinate mapping in `viewer.ts`. OpenDRIVE often uses a different coordinate system (Right-Handed, but axes might need swapping for Three.js).
- If parsing fails: Ensure `fast-xml-parser` options in `opendrive.ts` are correctly configured (e.g., `ignoreAttributes: false`).
