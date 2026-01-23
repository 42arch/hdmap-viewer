# OpenDRIVE Parser Specification

## Overview

The `opendrive-parser` package is responsible for ingesting raw OpenDRIVE XML content and producing a structured, easy-to-consume TypeScript object model. It handles the complexities of the XML structure and provides geometric helpers to simplify rendering and analysis.

## Key Components

### `OpenDrive` Class

The entry point for the library.

- **Constructor**: `new OpenDrive(xml: string, step: number)`
    - `xml`: Raw OpenDRIVE XML string.
    - `step`: Sampling step for discretizing curves (e.g., for generating polyline approximations of road geometry).
- **Properties**:
    - `header`: Meta-information about the map (date, version, bounds).
    - `roads`: Array of `Road` objects.
    - `junctions`: Array of `Junction` objects.
    - `referenceLines`: Array of processed `ReferenceLine` objects.
- **Methods**:
    - `process()`: Triggers the calculation of geometry (reference lines, lane boundaries). **Must be called after instantiation.**

### `Road` Class

Represents a single road segment.

- **Attributes**: `id`, `length`, `junction` ID.
- **Components**:
    - `PlanView`: The geometry of the road reference line.
    - `Lanes`: Contains `LaneSection`s, which in turn contain `Lane`s.
- **Geometry Processing**:
    - The parser handles the evaluation of parametric curves (lines, spirals, arcs, poly3) to generate discrete points for the reference line.

### `Lane` Class

Represents a single lane within a road.

- **Attributes**: `id`, `type` (driving, border, shoulder, etc.), `level`.
- **Geometry**:
    - `getBoundary()`: Returns the vertices defining the lane's polygon.
    - `getBoundaryLine()`: Returns the polyline defining the outer edge of the lane.

## Parsing Pipeline

1.  **XML to JSON**: Uses `fast-xml-parser` to convert the XML string into a raw JavaScript object (`RawOpenDrive`).
2.  **Object Instantiation**: Wraps raw data in typed classes (`Header`, `Road`, `Junction`).
3.  **Geometry Processing (`process()` method)**:
    - Iterates over all roads.
    - Calculates the "Reference Line" geometry based on the sampling `step`.
    - Offsets the reference line to calculate lane boundaries.
    - Builds a routing graph (connectivity between lanes).

## Usage Example

```typescript
import OpenDrive from 'opendrive-parser';

const xmlData = `...`; // Load your .xodr file content
const step = 0.5; // Sample geometry every 0.5 meters

const map = new OpenDrive(xmlData, step);
map.process();

const roads = map.getRoads();
console.log(`Parsed ${roads.length} roads.`);
```
