# HD Map Viewer & Parser Monorepo

A monorepo for parsing and visualizing High-Definition (HD) Maps, primarily focused on OpenDRIVE. This project contains a visualization application and standalone parser libraries.

## Features

- **OpenDRIVE Viewer**: A web-based 3D viewer for `.xodr` files.
- **OpenDRIVE Parser**: A TypeScript library to parse OpenDRIVE XML files into JavaScript objects.
- **Apollo Map Parser**: (Work in Progress) A library for parsing Apollo HD Maps.

## Project Structure

This project is a monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces) and [Turbo](https://turbo.build/).

- **apps/**
  - `viewer`: A Vue 3 + Vite application using Three.js to visualize HD Maps.
- **packages/**
  - `opendrive-parser`: A TypeScript library for parsing OpenDRIVE files.
  - `apollo-map-parser`: A placeholder library for future Apollo map parsing support.

## Getting Started

### Prerequisites

- **Node.js**: >= 18
- **pnpm**: >= 10 (This project uses pnpm as its package manager)

### Installation

Install dependencies from the root directory:

```bash
pnpm install
```

## Usage

### Development

To start the development server for all apps and packages:

```bash
pnpm dev
```

To start only the viewer application:

```bash
cd apps/viewer
pnpm dev
```

### Building

To build all apps and packages for production:

```bash
pnpm build
```

To build a specific package (e.g., the parser):

```bash
pnpm build --filter=opendrive-parser
```

### Linting & Formatting

To run linting across the codebase:

```bash
pnpm lint
```

### Cleaning

To clean `node_modules` and build artifacts:

```bash
pnpm clean
```

## Tech Stack

- **Monorepo**: [Turbo](https://turbo.build/), [pnpm workspaces](https://pnpm.io/workspaces), [Changesets](https://github.com/changesets/changesets)
- **Viewer App**:
  - [Vue 3](https://vuejs.org/)
  - [Vite](https://vitejs.dev/)
  - [Three.js](https://threejs.org/) (3D Rendering)
  - [Naive UI](https://www.naiveui.com/) (Component Library)
  - [Pinia](https://pinia.vuejs.org/) (State Management)
- **Parsers**:
  - TypeScript
  - [tsup](https://tsup.egoist.dev/) (Bundler)
  - [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)

## License

ISC