# Plinko Game — Technical Implementation

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Architecture Overview](#3-architecture-overview)
4. [Game State Machine](#4-game-state-machine)
5. [Physics & Path Generation](#5-physics--path-generation)
6. [Geometry System](#6-geometry-system)
7. [PixiJS Rendering](#7-pixijs-rendering)
8. [Ball Animation System](#8-ball-animation-system)
9. [Sound Engine](#9-sound-engine)
10. [Vue Component Layer](#10-vue-component-layer)
11. [Pinia Store](#11-pinia-store)
12. [Multiplier Table & Payout](#12-multiplier-table--payout)
13. [Round Lifecycle (Data Flow)](#13-round-lifecycle-data-flow)
14. [Constants Reference](#14-constants-reference)
15. [Tests](#15-tests)

---

## 1. Tech Stack

| Layer | Library / Tool |
|---|---|
| UI framework | Vue 3 (Composition API, `<script setup>`) |
| State management | Pinia 3 |
| Canvas rendering | PixiJS v8 (WebGL/WebGPU auto-detected) |
| Audio | Web Audio API (procedural synthesis, no asset files) |
| Build | Vite 8 + `@vitejs/plugin-vue` |
| Type checking | TypeScript 6, `vue-tsc` |
| Unit tests | Vitest 4, `@vue/test-utils` |
| Linting | ESLint 10 + oxlint |

---

## 2. Project Structure

```
src/
├── main.ts                  # App entry — mounts Vue, registers Pinia
├── App.vue                  # Root component — renders GameLayout
├── assets/tokens.css        # CSS custom properties (colours, spacing, radii)
│
├── layouts/
│   └── GameLayout.vue       # Full-viewport shell: TopBar + sidebar + canvas area
│
├── components/
│   ├── PlinkoCanvas.vue     # PixiJS host div; wires store actions → spawnBalls
│   ├── ControlPanel.vue     # Sidebar: groups all control inputs
│   ├── TopBar.vue           # Brand name + balance display + mute toggle
│   ├── DropButton.vue       # "DROP N BALLS $X.XX" CTA button
│   ├── BetInput.vue         # Numeric bet input with half/double helpers
│   ├── BallsSlider.vue      # 1–10 balls-per-drop slider
│   ├── RowsSlider.vue       # 8–16 rows slider
│   ├── BalanceDisplay.vue   # Animated balance counter
│   ├── LastResultBadge.vue  # Last-payout multiplier badge
│   └── modals/
│       ├── ModalBase.vue         # Teleport backdrop + card + Esc key close
│       ├── ModalBigWin.vue       # Animated count-up, confetti burst, auto-close
│       └── ModalInsufficient.vue # "Insufficient balance" error dialog
│
├── composables/
│   ├── usePlinkoBoard.ts    # PixiJS lifecycle, ball spawning, resize, ticker
│   └── useSound.ts          # Web Audio engine — procedural sound synthesis
│
├── pixi/
│   ├── layers.ts            # Five named PixiJS Containers in z-order
│   ├── drawBoard.ts         # Clears & redraws pegs + bucket strip; returns refs
│   ├── ball.ts              # Texture builder, sprite factory, trail ghosts, stepBall
│   ├── pegTextures.ts       # Pre-rendered default/inner/active peg textures
│   ├── pegStates.ts         # PegStateController — hit-flash state machine
│   ├── particles.ts         # ParticleSystem — hit-spark particles
│   └── effects.ts           # flashBucket, spawnWinText helpers
│
├── stores/
│   └── plinkoStore.ts       # All game state; path generation; payout accounting
│
├── utils/
│   ├── geometry.ts          # computeGeometry, pegPosition, bucketCenter
│   ├── physics.ts           # computePath, buildWaypoints, lerp, easeInOutQuad
│   └── money.ts             # round2, formatUSD
│
├── constants/
│   ├── layout.ts            # Padding, peg spacing caps, bucket dimensions, trail
│   ├── ball.ts              # Speed, gravity, arc, trail, highlight constants
│   ├── colors.ts            # PixiJS hex colour constants
│   └── multipliers.ts       # Payout table keyed by row count
│
├── types/
│   └── plinko.ts            # GameState enum, Point, Geometry, ActiveBall, RoundResult
│
└── __tests__/               # Vitest unit tests (store, geometry, money, physics)
```

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Vue component tree  (reactive UI layer)            │
│  GameLayout → TopBar / ControlPanel / PlinkoCanvas  │
└────────────────────┬────────────────────────────────┘
                     │  store.$onAction / store.dropBall()
                     ▼
┌─────────────────────────────────────────────────────┐
│  Pinia store  (plinkoStore.ts)                      │
│  • owns all game state                              │
│  • deducts bet, calls computePath, returns paths    │
│  • receives onBallLanded, credits payout            │
└────────────┬────────────────────────────────────────┘
             │  paths[][]  /  onBallLanded(bin)
             ▼
┌─────────────────────────────────────────────────────┐
│  usePlinkoBoard  (composable)                       │
│  • owns PixiJS Application lifecycle                │
│  • spawnBalls: creates ActiveBall structs           │
│  • tick() : advances all balls each frame           │
│  • watches store.rows / gameState for redraw        │
└────────────┬────────────────────────────────────────┘
             │  PixiJS scene graph mutations
             ▼
┌─────────────────────────────────────────────────────┐
│  PixiJS v8 rendering pipeline                       │
│  Layers: pegs | buckets | ball | particles | ui     │
└─────────────────────────────────────────────────────┘
```

The store is the single source of truth for game state. The composable owns the PixiJS world. Vue components are thin shells that read reactive store state and delegate actions.

---

## 4. Game State Machine

Defined in `src/types/plinko.ts`:

```
         dropBall()
  Idle ──────────────► Dropping
   ▲                       │
   │  (300 ms timeout)      │  last ball onBallLanded
   │                       ▼
 Result ◄─────────── Settling
```

| State | Meaning |
|---|---|
| `Idle` | Board ready; controls enabled |
| `Dropping` | One or more balls in flight; controls disabled |
| `Settling` | All balls landed; transition guard state |
| `Result` | Brief hold (300 ms) so effects finish before returning to Idle |

`isIdleGameState()` is used throughout the codebase as a type-narrowing guard. A row change requested while `Dropping` is queued in `store.pendingRowChange` and applied via `store.flushPendingRowChange()` when the game returns to `Idle`.

---

## 5. Physics & Path Generation

### Path (`computePath`)

```
src/utils/physics.ts
```

A **Galton board** path is a sequence of `rows` random binary values:
- `0` → deflect left
- `1` → deflect right

The cumulative sum of the path equals the final **bin index** (0 = leftmost bucket, `rows` = rightmost).

```typescript
export function computePath(rows: number): number[] {
  return Array.from({ length: rows }, () => (Math.random() < 0.5 ? 0 : 1));
}
```

Each ball in a multi-ball drop gets its own independently random path. The distribution of landing bins follows a **binomial distribution** centred on the middle buckets — which is why edge multipliers are highest.

### Waypoints (`buildWaypoints`)

Converts a binary path into an ordered array of canvas `Point`s:

```
[ drop_point, peg_contact_0, peg_contact_1, ..., peg_contact_(rows-1), bucket_center ]
```
Total length = `rows + 2`.

Each **peg contact point** is offset from the peg centre by `pegRadius + ballRadius` in the direction opposite to the ball's approach vector. This prevents the ball sprite from visually sinking into the peg and ensures the bounce arc looks physically plausible.

The **approach vector** is derived from which direction the ball came from (left or right of the preceding peg):
- Right deflection → came from upper-left → approach vector is `(+pegSpacingX/2, +pegSpacingY)`.
- Left deflection → came from upper-right → approach vector is `(-pegSpacingX/2, +pegSpacingY)`.

The contact point = peg centre − (unit approach vector × contact distance).

---

## 6. Geometry System

```
src/utils/geometry.ts
src/constants/layout.ts
```

`computeGeometry(canvasW, canvasH, rows)` derives all spatial constants from the live canvas dimensions and current row count. This is called on every resize and every row change.

| Property | Formula |
|---|---|
| `pegSpacingX` | `min((canvasW − 2·PAD_X) / (rows+1),  MAX_PEG_SPACING_X)` |
| `pegSpacingY` | `min(availH / rows,  MAX_PEG_SPACING_Y)` |
| `pegRadius` | `clamp(3, 6, pegSpacingX × 0.18)` |
| `ballRadius` | `pegRadius × BALL_RADIUS_FACTOR` |
| `originX` | `canvasW / 2` (top peg is always centred) |
| `originY` | `PAD_TOP` |
| `bucketY` | `originY + rows × pegSpacingY + BUCKET_GAP` |

`pegPosition(row, col, g)` returns the canvas coordinate of any peg in the triangular grid:
```
x = originX + (col − row/2) × pegSpacingX
y = originY + row × pegSpacingY
```

`bucketCenter(bin, rows, g)` returns the centre of bucket slot `bin` in the bottom strip.

---

## 7. PixiJS Rendering

### Application Init

`usePlinkoBoard.mount()` creates a `new Application()` and calls `await app.init()` with:

```typescript
{
  resizeTo: hostEl,      // auto-resize to container
  background: 0x0b0b18, // dark navy
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio ?? 1,
}
```

A `ResizeObserver` on `hostEl` calls `redraw()` on container resize. If a ball is in flight during resize, a `pendingRedraw` flag is set and flushed when the game returns to `Idle`.

### Layer Stack

Five `Container`s are created in z-order by `createLayers()`:

| Layer | z-order | Contents |
|---|---|---|
| `pegs` | 0 (bottom) | Peg `Sprite`s. `isRenderGroup: true` for GPU batching |
| `buckets` | 1 | Multiplier box `Graphics` + label `Text` |
| `ball` | 2 | Ball `Graphics` + trail ghost `Sprite`s |
| `particles` | 3 | Hit-spark particle sprites. `isRenderGroup: true` |
| `ui` | 4 (top) | Floating win-text `Text` objects |

### Board Drawing (`drawBoard`)

`drawBoard()` is called on every `redraw()`. It:
1. Clears and destroys all children in `pegs` and `buckets` containers.
2. Creates one `Sprite` per peg positioned with `pegPosition()`. Sprites use pre-built `pegTextures.default`.
3. Returns a `BoardState` containing a `Map<PegKey, Sprite>` for pegs and a `Graphics[]` for buckets, so animations can target them by reference.

**Buckets** are drawn as white-filled `Graphics` boxes with a `.tint` colour. This allows `flashBucket()` to animate the tint from its original value → white → original (cheap GPU-side colour lerp, no re-draw needed).

### Peg Textures (`pegTextures.ts`)

Three GPU textures are pre-rendered once per `redraw()`:

| Texture | Appearance |
|---|---|
| `default` | Light grey ring — the normal peg state |
| `inner` | Bright white inner circle — glowing core |
| `active` | Amber/orange — briefly shown when hit |

`PegStateController` manages the active-flash state machine: on each `setActive(key)` call it swaps the peg's texture to `active` for ~200 ms then restores to `default`, with an optional intermediate `inner` flash.

### Effects (`effects.ts`)

- **`flashBucket(bin, app, bucketSprites)`** — animates the bucket box tint from original → 0xffffff (white) and back over ~400 ms using the PixiJS ticker.
- **`spawnWinText(payout, bet, pos, app, uiLayer)`** — creates a floating `Text` at the ball landing position showing the payout amount (green for profit, grey for neutral), floats it upward with alpha fade, then destroys it.

### Particles (`particles.ts`)

`ParticleSystem` manages a pool of lightweight spark sprites. On `spawnHitSparks(point)` it emits several particles from the peg contact point, each with a random velocity and a short lifetime. `update(deltaTime)` advances their position and fades alpha.

---

## 8. Ball Animation System

### ActiveBall Structure

```typescript
interface ActiveBall {
  sprite: Graphics          // the visible ball
  trail: Sprite[]           // 3 ghost sprites trailing behind
  trailPositions: Point[]   // ring-buffer of last 3 ball positions
  trailHead: number         // ring-buffer write head
  pegKeys: Array<PegKey | null>  // peg at each waypoint index
  waypoints: Point[]        // ordered path points on canvas
  wpIdx: number             // current segment index
  progress: number          // 0..1 within current segment
  speed: number             // current speed (increases with gravity)
  finalBin: number          // pre-computed landing bin
  settled: boolean
  delayMs: number           // staggered spawn delay for multi-ball drops
}
```

### Segment Interpolation (`stepBall`)

Each frame, `stepBall()` advances `progress` by `(dt / 60) × speed`. When progress reaches 1, it advances `wpIdx` and calls the relevant callbacks.

Two interpolation modes are used within a segment:

**Peg-to-peg segments** (all but the last):
```
x = lerp(from.x, to.x, t)
y = lerp(from.y, to.y, t) − arcHeight × sin(π·t)
```
The `sin(π·t)` term creates a parabolic bounce arc that peaks at the midpoint, giving the ball a natural "bouncing" appearance between consecutive pegs.

**Last segment (free-fall into bucket)**:
```
x = lerp(from.x, to.x, t)
y = lerp(from.y, to.y, t^BALL_FREE_FALL_EXPONENT)
```
The power curve on `t` makes the ball accelerate downward as it falls into the bucket.

### Gravity Accumulation

Speed increases every `BALL_GRAVITY_INTERVAL` peg contacts:
```
speed = BALL_BASE_SPEED × (1 + floor(wpIdx / BALL_GRAVITY_INTERVAL) × BALL_GRAVITY_FACTOR)
```
This simulates the ball accelerating as it descends the board.

### Trail Ghosts

Three ghost `Sprite`s share the same ball texture (rendered once, reused). They use a ring-buffer (`trailPositions`) to track the last 3 ball positions. Each ghost has decreasing alpha (`[0.35, 0.18, 0.07]`) and decreasing scale (`[0.85, 0.70, 0.55]`), producing a smooth motion-blur tail.

### Multi-Ball Staggering

When `ballsPerDrop > 1`, balls are spawned with a `delayMs` offset (`i × BALL_SPAWN_DELAY_MS`). While `delayMs > 0` the sprite is hidden and `stepBall` is skipped.

---

## 9. Sound Engine

```
src/composables/useSound.ts
```

All audio is **procedurally synthesised** using the Web Audio API — no external audio files are needed.

The `AudioContext` is created lazily on the first `play()` call to satisfy browser autoplay policies (a user gesture has always occurred first).

A module-level singleton `_enabled` ref is shared across all `useSound()` calls, so muting in one component is reflected everywhere. The mute state persists across reloads via `localStorage`.

### Sound IDs

| ID | Trigger | Synthesis |
|---|---|---|
| `peg_hit` | Ball contacts a peg | Sine + triangle oscillators, pitch increases with peg row depth |
| `bucket_land` | Ball lands in a bucket | C major triad (C5, E5, G5) with triangle waves |
| `balance_update` | Payout credited | Descending E6→A5 sine glide |
| `big_win` | Multiplier ≥ big-win threshold | C major arpeggio + chord + shimmer |

Peg-hit sounds are **throttled** to one per 40 ms (`PEG_HIT_THROTTLE_MS`) to prevent audio phasing when multiple balls hit pegs in rapid succession.

Pitch for peg hits is modulated per row:
```
pitch = 1.0 + (pegRow / totalRows) × 0.4 + random(0, 0.05)
```

---

## 10. Vue Component Layer

### Layout

```
GameLayout
├── TopBar          (brand + balance + mute toggle)
└── body
    ├── aside > ControlPanel
    │   ├── BetInput
    │   ├── BallsSlider
    │   ├── RowsSlider
    │   ├── LastResultBadge
    │   └── DropButton
    └── canvas-area > PlinkoCanvas
```

The layout is fully responsive:
- **Desktop (≥ 1024 px)**: 280 px sidebar on the left, canvas fills the rest.
- **Tablet (768–1023 px)**: 240 px sidebar.
- **Mobile (< 768 px)**: stacked column — canvas on top, controls below.

### PlinkoCanvas.vue

The bridge between Vue and PixiJS:

```typescript
const stopWatchingDropBallAction = store.$onAction(({ name, after }) => {
  if (name !== 'dropBall') return;
  after((paths) => {
    if (paths) spawnBalls(paths);
  });
});
```

`store.$onAction` subscribes to the Pinia `dropBall` action. When it completes and returns a `paths` array, `spawnBalls(paths)` creates the PixiJS ball sprites. This keeps the store pure (no PixiJS imports) and the composable independent of Vue's template system.

### ModalBase.vue

Wraps content in a `<Teleport to="body">` + `<Transition>` for scale/fade animations. Closes on backdrop click or Escape key. The `ModalBigWin` uses a `setInterval` count-up animation (0 → payout over 800 ms) and auto-closes after 4 seconds.

---

## 11. Pinia Store

```
src/stores/plinkoStore.ts
```

### State

| Field | Type | Description |
|---|---|---|
| `rows` | `number` | Active row count (8–16) |
| `gameState` | `GameState` | Current state machine node |
| `balance` | `number` | Player balance (starts at $1,000) |
| `betAmount` | `number` | Current bet per ball |
| `ballsPerDrop` | `number` | How many balls to drop at once (1–10) |
| `history` | `RoundResult[]` | Last 20 round results |
| `lastBin` | `number \| null` | Most recently landed bin index |
| `_ballsInFlight` | `number` | Count of balls not yet settled |
| `pendingRowChange` | `number \| null` | Row change queued during a drop |

### Key Actions

**`dropBall()`**
1. Guards: `canDrop` must be true (idle state, bet ≥ MIN_BET, total bet ≤ balance).
2. Deducts `betAmount × ballsPerDrop` from balance.
3. Sets `gameState = Dropping`, `_ballsInFlight = ballsPerDrop`.
4. Generates one `computePath(rows)` per ball.
5. Returns the array of paths to `PlinkoCanvas` via `$onAction`.

**`onBallLanded(bin)`**
1. Looks up `MULTIPLIERS[rows][bin]` and credits `betAmount × mult` to balance.
2. Pushes a `RoundResult` to `history` (capped at 20 entries).
3. Decrements `_ballsInFlight`.
4. When `_ballsInFlight === 0`: transitions `Settling → Result`, then `Result → Idle` after 300 ms.

**`setRows(n)`**
If the game is idle, updates `rows` immediately. If dropping, stores the value in `pendingRowChange`. The composable calls `flushPendingRowChange()` when idle resumes.

---

## 12. Multiplier Table & Payout

```
src/constants/multipliers.ts
```

The payout multipliers are symmetric, highest at the edges (rare outcomes), lowest in the centre (common outcomes), matching the binomial distribution:

| Rows | Edge × | Near-edge × | Centre × |
|---|---|---|---|
| 8 | 5.6 | 2.1 | 0.5 |
| 12 | 10 | 3 | 0.5 |
| 16 | 23 | 9 | 0.5 |

Payout = `betAmount × multiplier`, rounded to 2 decimal places with `round2()`.

Bucket colours are assigned by tier:

| Tier | Colour |
|---|---|
| ≥ 10× | Red (jackpot) |
| ≥ 5× | Amber (high) |
| ≥ 2× | Green (medium) |
| ≥ 1× | Blue (low) |
| < 1× | Muted purple-grey (loss) |

---

## 13. Round Lifecycle (Data Flow)

```
User clicks DropButton
        │
        ▼
store.dropBall()
  • guards canDrop
  • balance -= totalBet
  • gameState = Dropping
  • generates paths[][]
  • returns paths
        │
        ▼ (via store.$onAction in PlinkoCanvas)
usePlinkoBoard.spawnBalls(paths)
  • computeGeometry()
  • buildWaypoints() per ball
  • createBall() + createTrailGhosts() sprites added to layers.ball
  • makeActiveBall() pushed to activeBalls[]
        │
        ▼  (each frame: app.ticker → tick())
stepBall()
  • advances progress along waypoints
  • on peg contact → pegStates.setActive() + particles.spawnHitSparks()
                   → sound.play('peg_hit', pitch)
  • on settle → flashBucket() + spawnWinText()
              → sound.play('bucket_land') + sound.play('balance_update')
              → store.onBallLanded(bin)
        │
        ▼
store.onBallLanded(bin)
  • balance += payout
  • history.push(result)
  • _ballsInFlight--
  • if _ballsInFlight === 0:
      gameState → Settling → Result
      setTimeout 300ms → gameState → Idle
        │
        ▼
usePlinkoBoard watches gameState → Idle
  • store.flushPendingRowChange() (if queued)
  • redraw() if pendingRedraw
```

---

## 14. Constants Reference

### `src/constants/layout.ts`

| Constant | Value | Purpose |
|---|---|---|
| `PAD_X` | 10 px | Horizontal canvas padding |
| `PAD_TOP` | 40 px | Space above top peg |
| `PAD_BOTTOM` | 10 px | Space below bucket strip |
| `ROWS_MIN` | 8 | Minimum row count |
| `ROWS_MAX` | 16 | Maximum row count |
| `BALLS_MAX` | 10 | Maximum balls per drop |
| `MAX_PEG_SPACING_X` | 50 px | Peg spacing cap (wide screens) |
| `MAX_PEG_SPACING_Y` | 56 px | Peg spacing cap (tall screens) |
| `BUCKET_H` | 32 px | Bucket box height |
| `BUCKET_GAP` | 8 px | Gap between last peg row and buckets |
| `TRAIL_COUNT` | 3 | Number of trail ghost sprites |
| `TRAIL_ALPHA` | [0.35, 0.18, 0.07] | Alpha per ghost (oldest → newest) |
| `TRAIL_RADIUS_FACTOR` | [0.85, 0.70, 0.55] | Scale per ghost |

### `src/constants/ball.ts` (key values)

| Constant | Purpose |
|---|---|
| `BALL_BASE_SPEED` | Baseline segment-traversal speed per frame |
| `BALL_GRAVITY_FACTOR` | Speed multiplier added every N waypoints |
| `BALL_GRAVITY_INTERVAL` | How many peg contacts between speed increases |
| `BALL_ARC_FACTOR` | Controls parabolic bounce height between pegs |
| `BALL_FREE_FALL_EXPONENT` | Power curve for the last (bucket) segment |
| `BALL_RADIUS_FACTOR` | Ball radius as a fraction of peg radius |
| `BALL_SPAWN_DELAY_MS` | Stagger between multi-ball spawns |

---

## 15. Tests

Unit tests live in `src/__tests__/` and run with `pnpm test:unit` (Vitest).

| File | What is tested |
|---|---|
| `stores/plinkoStore.spec.ts` | dropBall guards, balance accounting, multi-ball flight count, row-change deferral |
| `utils/physics.spec.ts` | `computePath` output length and range, `buildWaypoints` point count and coordinates |
| `utils/geometry.spec.ts` | `computeGeometry` clamping, `pegPosition` coordinates, `bucketCenter` alignment |
| `utils/money.spec.ts` | `round2` precision, `formatUSD` output strings |
