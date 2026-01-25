# Viewer Application Specification

## Overview

The `apps/viewer` application is a Single Page Application (SPA) providing an interactive 3D interface for inspecting OpenDRIVE maps. It is built using Vue 3 and leverages Three.js for rendering.

## User Interface

### Layout
- **Canvas**: Full-screen 3D rendering area.
- **AppTitle**: Displays the application name/logo (Top Left).
- **InfoPanel**: Shows detailed information about the currently selected map element (e.g., Lane ID, Type, Road ID) (Top Right overlay).
- **OperatePanel**: Controls for file loading, rendering options, or camera views (Bottom/Side overlay).

### Interactions
- **Navigation**:
    - **OrbitControls**: Rotate (Left Click + Drag), Pan (Right Click + Drag), Zoom (Scroll).
- **Selection**:
    - **Hover**: Moving the mouse over a lane highlights it.
    - **Highlighting**: Uses a Three.js `Raycaster` to detect intersections with the road mesh.

## Rendering System

### `Viewer` Class (`src/libs/viewer.ts`)

The core rendering logic is encapsulated in the `Viewer` class.

- **Initialization**:
    - Sets up `Scene`, `PerspectiveCamera`, `WebGLRenderer`.
    - Configures `OrbitControls`.
    - Initializes groups for `roads`, `roadmarks`, and `reference-lines`.
- **Map Loading (`setOpenDrive`)**:
    - Clears existing scene.
    - **Road Rendering**:
        - Creates meshes for lanes using `BufferGeometry`.
        - Vertices are derived from the parser's `lane.getBoundary()`.
        - Material: `MeshBasicMaterial` (Grey color).
    - **Boundary Rendering**:
        - Creates lines for lane markings using `Line2` (from `three/examples/jsm/lines/Line2`).
        - Material: `LineMaterial` (White).
    - **Reference Line Rendering**:
        - Renders the road reference line as a dashed orange line for debugging/visualization.
- **Optimization**:
    - Uses `three-perf` in development mode to monitor frame rates and draw calls.
    - Manages disposal of geometries and materials to prevent memory leaks when reloading maps.

## Key Libraries

- **Three.js**: Core 3D engine.
- **three-perf**: Performance monitoring.
- **Naive UI**: UI components for panels and dialogs.
