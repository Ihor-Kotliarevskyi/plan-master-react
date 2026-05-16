# Dependencies and CPM

## Current Data Format

The current canonical dependency format is object-based:

```js
task.deps = [
  { id: "task-uuid-1", type: "FS", threshold: 0 },
  { id: "task-uuid-2", type: "SS", threshold: 25 },
  { id: "task-uuid-3", type: "FF", threshold: 0 },
];
```

Notes:

- `id` points to the predecessor task UUID
- `type` is one of `FS`, `SS`, `FF`
- `threshold` is only meaningful for `SS`

Older numeric/string references are still migrated at runtime in `js/storage.js`.

## Dependency Types

### `FS`

Finish-to-start: the successor begins after the predecessor finishes.

### `SS`

Start-to-start: the successor may begin after the predecessor starts.  
`threshold` is the minimal completion percentage used by the UI/editor for this relation.

### `FF`

Finish-to-finish: shown in the UI and arrow layer, but currently excluded from the critical-path graph in `js/critical.js`.

## Where Dependencies Are Used

Dependencies drive three separate layers:

- task modal editing in `js/modal.js`
- gantt arrow rendering in `js/dep-arrows.js`
- critical-path calculation in `js/critical.js`

## Editing Flow

The task modal:

- stores modal dependencies in `_modalDeps`
- lets the user add predecessors from existing tasks
- supports type switching between `FS`, `SS`, `FF`
- exposes `%` threshold editing for `SS`
- renders a lightweight dependency mini-network inside the modal

The dependency list modal:

- shows all dependencies in the project
- filters by `all`, `FS`, `SS`, `FF`
- highlights the selected chain on the gantt after clicking a row

## SVG Arrows

`js/dep-arrows.js` renders dependency arrows over the gantt table.

### Current behavior

- arrow colors:
  - `FS`: blue
  - `SS`: orange
  - `FF`: gray
  - critical relation: red
- arrows are drawn between visible task bars
- clicking a bar highlights its dependency chain
- when the graph is large, only the active chain is rendered

### Large-project optimization

Current threshold:

```js
const autoHide = tasks.length > 50;
```

If there are more than `50` tasks:

- all arrows are hidden by default
- arrows appear after a chain is selected

## Chain Highlighting

Chain highlighting uses BFS in two directions:

- upward through predecessors
- downward through successors

Result:

- related rows get `.dep-hi`
- unrelated rows get `.dep-dim`
- arrow opacity is adjusted accordingly

## Critical Path

`js/critical.js` computes `criticalSet`.

### Important implementation details

- task lookup is UUID-based: `byId[t.id]`
- the graph ignores `FF` dependencies
- order is built through indegree/topological processing where possible
- if the graph is invalid or cyclic, it falls back to processing tasks in array order

### Duration model

Task duration is based on `dur(t)` and clamped to at least `1`.

### Forward pass

For each task:

- `ES` comes from the maximum predecessor `EF` plus one
- `EF = ES + duration - 1`

### Backward pass

For each task:

- `LF` comes from the minimum successor `LS` minus one
- `LS = LF - duration + 1`

### Critical rule

A task is marked critical when:

- it is connected to the dependency graph
- and its slack is zero or negative in the current discrete model

## Practical Constraints

- The dependency graph is only as good as task ids and migrated data.
- `FF` affects visibility/documentation, but not current CPM logic.
- Very old imported JSON can still be loaded because import normalizes legacy refs to UUID-based dependencies.

## Related Files

- `js/modal.js`
- `js/dep-arrows.js`
- `js/critical.js`
- `js/storage.js`
- `docs/DATABASE.md`
