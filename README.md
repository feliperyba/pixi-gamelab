<p align="center">
  <img src="./repo/header.png" />
</p>
<p align="center">
  Three interactive demos built with <strong>PixiJS v8</strong> and <strong>TypeScript</strong>.<br>
  <a href="https://feliperyba.github.io/pixi-gamelab/" style="font-size: 2em;">Live Demo</a>
</p>

---

## Quick Start

| Script            | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Start Vite dev server                                  |
| `npm run build`   | Lint + typecheck + format check, then production build |
| `npm run check`   | Run lint, format check, and typecheck together         |
| `npm run preview` | Preview the production build locally                   |

---

## Architecture

The project follows a layered, feature-based architecture where **domain logic has zero PixiJS imports** and the presentation layer acts as a thin projection. Each feature module is further divided into:

| Layer             | Purpose                                   | Depends on PixiJS? |
| ----------------- | ----------------------------------------- | ------------------ |
| `config/`         | Tunable constants and type definitions    | No                 |
| `application/`    | Domain logic, state machines, layout math | No                 |
| `infrastructure/` | Data fetching, texture generation, I/O    | Minimal            |
| `presentation/`   | PixiJS sprites, containers, animations    | Yes                |

This separation means the core game logic for each task can be reasoned about and tested independently of the renderer and keep the dependencies clear.

### Scene Lifecycle

Every scene implements a common `Scene` interface:

```typescript
interface Scene {
  readonly id: SceneId;
  enter(): Promise<void>;
  exit(): Promise<void>;
  update(dt: number): void;
  resize(viewport: Viewport): void;
}
```

The `SceneCoordinator` manages transitions: on navigation, the active scene is torn down (`exit()` + `destroy()`), a new scene is created via its factory, then `enter()` and `resize()` are called. The `PixiGameRuntime` feeds `update(dt)` every frame and `resize(viewport)` on window resize.

### Dependency Injection (DI-Lite)

All DI wiring lives in a single composition root (`src/infrastructure/bootstrap.ts`). Dependencies are wired **manually through constructor parameters**, no service locator, no DI container, no decorator-based injection.

This approach was chosen because with 4 scenes and ~10 shared services, every dependency can be traced by reading one file. A DI framework would add indirection without proportional benefit at this scale.

The `SceneCoordinator` creates scenes on demand via factory functions registered at bootstrap time, and each factory closure captures the shared dependencies the scene needs.

### UI Component Pattern: MVVM Lite

Shared UI components follow a lightweight **MVVM** approach. Each component receives its concerns as three separate, externally-supplied contracts keeping the familiar Model-View-ViewModel separation while avoiding the boilerplate of a full MVVM framework.

Components are constructed in two phases:

```typescript
const button = new PixiTextButton(model, skin); // Phase 1: behavior + visuals
button.applyLayout(layout); // Phase 2: geometry (re-callable on resize)
```

The same button class serves as "Back", "Reset Defaults", and "Next Page" by varying only the ViewModel. The Skin and Layout are shared. A component can be re-skinned without touching behavior or geometry, or re-laid out on window resize without reconstruction.

**Liberties taken from strict MVVM:**

- **No reactive binding** There is no observable or binding layer. The parent calls methods imperatively (`updateValue()`, `setValue()`, `resetTo()`, `applyLayout()`). This avoids the complexity and indirection of a binding infrastructure while keeping the data flow easy to trace.
- **Skin as a separate concern** In classic MVVM, the View owns both appearance and geometry. Here, visual properties (textures, tints, fonts) are extracted into a `Skin` contract so they can be shared across component instances and swapped independently of layout.
- **Layout as a post-construction step** Geometry is applied via a separate `applyLayout()` call rather than at construction time. This decouples component creation from sizing, enabling re-layout on resize without reconstruction.
- **No separate Controller** User input handling lives directly in the component, which delegates to ViewModel callbacks. Adding a controller class for every button and slider would add boilerplate without clarity at this scale.

### Minimal Dependencies

The entire project runs on just **three runtime dependencies**:

| Package                       | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `pixi.js` v8                  | WebGL rendering                                                     |
| `gsap`                        | Animation (menu choreography, dialogue sequencing, scroll tweening) |
| `@barvynkoa/particle-emitter` | PixiJS v8-compatible particle system (community fork)               |

No state management library, no DI framework, no routing library, no UI framework. Everything else (scene management, component system, responsive scaling, scroll handling) is built from scratch to keep the dependency surface small.

---

## Task 1 Ace of Shadows

> Create 144 sprites stacked like cards in a deck. Every 1 second the top card moves to a different stack. The animation takes 2 seconds.

### The Challenge

Managing 144 sprites with overlapping transfer animations without corrupting z-order, leaking memory, or dropping frames.

### Domain Model

The game state is modeled as pure domain objects with no PixiJS dependency:

- **`AceBoard`** Aggregate root owning three `CardStack` instances and a `Uint8Array` for face-up state. The `Uint8Array` was chosen over a `Map` or `boolean[]` for O(1) indexed access, contiguous memory layout, and zero garbage-collection pressure.
- **`CardStack`** Simple ordered array of `CardId` values with `push`/`pop`/`top`.
- **`TransferPlan`** / **`TransferResolution`** Value objects describing the source, target, timing, and face-up state before and after the transfer.
- **`NextTransferPolicy`** Deterministic routing: the source stack stays fixed until empty, then rotates to the next non-empty stack. Target is always `(source + 1) % 3`, guaranteeing a card never returns to its origin.
- **`AceOfShadowsSession`** Game loop orchestrator that ticks time, requests the next transfer every 1000ms, and gates on whether the presentation layer reports the card as still mid-flight.

### Sprite Pool

All 144 `Sprite` instances are pre-allocated in `CardSpritePool` on scene entry and reused for the entire scene lifetime. Two `Uint8Array(144)` arrays track per-card state:

- **`_transferFlags`** Is this card currently mid-flight?
- **`_faceUpFlags`** Is this card showing its face or back?

Texture swaps are dirty-checked: `applyCardFace()` only swaps the texture when the face-up state actually changes, avoiding redundant GPU uploads.

### Card Textures

Rather than shipping 52 individual card images, face-card textures are **generated at runtime** from a single `cardFront.png` base texture plus rank text and suit symbol sprites, composited via `renderer.generateTexture()`. A `DeckPatternCatalog` defines the standard 52-card pattern (13 ranks × 4 suits), and `CardTextureAtlas` caches the resulting textures. The 144 cards cycle through this pattern deterministically via `cardId % 52`.

### Table Background

The green felt table background is composited from multiple layers: a dark-to-green linear gradient base, a lamp radial gradient for overhead illumination, a warmth radial for orange ambient light, procedural fiber lines drawn with a seeded PRNG for deterministic texture, a vignette overlay, and a warm rim glow at the bottom.

### Performance Considerations

- **Bitmask dirty-tracking** Only stacks that actually changed are re-laid out. A `(1 << from) | (1 << to)` bitmask tracks which stacks need visual updates.
- **In-place array compaction** The animator removes completed transfers using a write-index pattern instead of `splice()` or `filter()`, avoiding per-frame allocations.
- **Texture dirty-checking** Card face/back swaps only occur when the state actually changes.

---

## Task 2 Magic Words

> Create a system that combines text and images like custom emojis. Render a dialogue between characters with data from a remote endpoint.

### The Challenge

Rendering mixed text and emoji content inline where emojis are remote images of unknown dimensions while handling an unreliable API that returns misspelled keys, missing avatar entries, and broken URLs.

### Resilient API Parsing

The `MagicWordsDataSource` fetches from the remote endpoint with a 5-second `AbortSignal.timeout()`. The raw JSON is parsed defensively:

- Each record in `dialogue`, `emojies`, and `avatars` is individually validated. Items that are not objects, or that have missing/empty string fields, are silently skipped rather than causing a crash.
- Any network error, HTTP error, timeout, or parse failure returns `null`, and the scene gracefully shows an empty-state message.

The sample payload contains several failure modes that are all handled:

- `{affirmative}` and `{win}` tokens appear in dialogue but have no emoji definition they become **omitted tokens**.
- `Neighbour` has no avatar entry the local fallback SVG is used.
- Sheldon's avatar URL uses port `:82` which times out the fallback SVG is used.

### Rich Text Tokenizer

`RichTextTokenizer` parses message text like `"I admit {satisfied} the design"` into an `InlineToken[]` array. Each token is one of three kinds:

| Kind      | Meaning                    | Rendering                                             |
| --------- | -------------------------- | ----------------------------------------------------- |
| `text`    | Literal text content       | Rendered as a PixiJS `Text` node                      |
| `emoji`   | A known `{name}` marker    | Rendered as a PixiJS `Sprite` with the remote texture |
| `omitted` | An unknown `{name}` marker | Stripped from layout entirely                         |

Unknown markers become `omitted` tokens so raw placeholder strings like `{win}` never leak into the visible bubble. The tokenizer also normalizes emoji keys by trimming, collapsing whitespace, and lowercasing ensuring case-insensitive matching between dialogue entries, emoji definitions, and avatar definitions.

### Inline Layout Engine

`computeInlineLayout()` is a custom word-wrapping engine that handles mixed text and emoji content. Key behaviors:

- Omitted tokens are stripped before layout no spacing artifacts from missing emojis.
- Consecutive text tokens are merged to avoid fragmented text runs.
- Newlines create explicit line breaks.
- Text that exceeds `maxWidth` wraps at word boundaries. Individual words wider than `maxWidth` fall back to **per-character breaking** to keep the bubble width bounded.
- Emojis are sized to a fixed `emojiSize` and vertically centered relative to the text line height.
- Each segment records a `unitStart` index for progressive text reveal animation.

### Remote Texture Resolution

`RemoteTextureCache` downloads emoji and avatar images from the network and converts them to PixiJS textures:

- URLs are validated via `new URL()` non-HTTP/HTTPS schemes are rejected.
- Results are cached by alias a failing URL only fetches once per session.
- Downloads use `AbortController` with a configurable timeout.
- Images are decoded via `createImageBitmap()` for efficient GPU upload.
- On any failure (network, HTTP, timeout, decode), the provided fallback texture is used instead.
- A checked-in DiceBear-style SVG (`avatarFallback.svg`) serves as the local fallback for any avatar that cannot be loaded.

The `MagicWordsTextureCoordinator` resolves all emoji and avatar textures in parallel, then applies them to the already-rendered dialogue rows. This means the dialogue skeleton appears immediately and textures populate asynchronously.

### Dialogue Sequencing

`DialogueSequencer` orchestrates a GSAP master timeline with labeled segments for each row:

1. The row's avatar, speaker label, and bubble are offset to initial positions.
2. An entrance animation fades in, slides from the speaker's side, and scales up.
3. Text reveals progressively character by character at a configurable rate.
4. A hold pause follows each message.
5. Auto-scroll smoothly follows the active row.

Tapping anywhere during text reveal skips to the end of the current message. Tapping during a hold pause immediately advances to the next row.

---

## Task 3 Phoenix Flame

> Make a particle-effect demo showing a great fire effect. Keep the number of images at max 10 sprites on the screen at the same time.

### The Challenge

Creating a convincing fire effect that reads as fire not as random floating blobs while never exceeding 10 simultaneous sprites on screen.

### Budget Allocator

The `BudgetAllocator` is the core mechanism that enforces the 10-sprite cap. It distributes the total budget across three emitter types using a **priority-weighted algorithm**:

| Emitter | Priority Weight   | Condition for Active                 |
| ------- | ----------------- | ------------------------------------ |
| Flame   | 3                 | Has textures and `intensity > 0`     |
| Ember   | 2 × `emberAmount` | Has textures and `emberAmount > 0.1` |
| Smoke   | 1 × `smokeAmount` | Has textures and `smokeAmount > 0.1` |

Active emitters share the full budget proportionally to their weighted scores. The allocation guarantees:

- The three values always sum to exactly `min(maxParticles, 10)`.
- Inactive emitters get zero slots, and their budget is redistributed to active ones.
- When only one emitter is active, it receives the entire budget (e.g., flame-only = 10 sprites).
- Each active emitter is guaranteed at least 1 slot.
- Leftover slots from rounding are distributed from highest priority first.

### Frame Budget Safety

Delta time is capped at 1/24 second to prevent particle explosions when the browser tab resumes from a background state. Without this cap, a several-second dt would cause emitters to spawn many particles in a single frame, violating the 10-sprite budget.

### Flame Effect Architecture

`FlameEffect` manages three `Emitter` instances (flame, smoke, ember), each in its own container for z-ordering. On any config or texture change, **all three emitters are rebuilt** not just the changed one because the budget is a shared pool. Rebuilding only the dirty emitter would leave the others with stale `maxParticles`, causing the total to exceed the 10-sprite cap.

### Procedural Fallback Textures

`TextureCatalog` generates soft-circle textures at startup using radial `FillGradient` on `Graphics` objects. These serve as fallbacks when atlas textures are unavailable. The atlas provides 6 flame textures, 8 smoke textures, and 2 symbol textures the texture picker in the control panel lets users mix and match.

### Interactive Control Panel

A "Fire Lab" panel provides real-time control over 18 parameters across 3 pages (Flame, Smoke, Embers), plus texture mix pickers and a reset-to-defaults button. Changes are applied immediately with no lag the emitter rebuilds on the next frame.

---

## Technical Decisions

### Why PixiJS v8?

PixiJS v8 introduced a modernized API with `FillGradient`, improved `generateTexture()`, and better TypeScript types. The main trade-off was that some community libraries (including the official particle emitter) had not yet updated their type definitions, requiring a fork.

### Why `@barvynkoa/particle-emitter`?

The official `@pixi/particle-emitter` v5.0.10 ships TypeScript types targeting PixiJS v7's `Container<DisplayObject>`. PixiJS v8 uses `Container<ContainerChild>`, which is structurally incompatible. The `@barvynkoa` fork resolves this by declaring `peerDependencies: "pixi.js": ">=6.0.4 <9.0.0"` and updating types for v8 compatibility. The API surface is identical to the official library.

### Why GSAP (and where)?

GSAP is used for the menu entrance choreography, the Magic Words dialogue sequencing, and scroll tweening. It is **not** used for Ace of Shadows that task uses a manual ticker because the transfer animation needs precise, frame-level control over arc position and flip timing that integrates tightly with the domain model's transfer resolution.

### Why Letterbox Scaling?

A fixed 1920×1080 design viewport simplifies all layout math every component positions itself relative to these known dimensions. The `ViewportService` computes a uniform scale factor and offset to fit this viewport into any screen size, adding black bars where needed. This avoids the complexity of percentage-based responsive layouts while guaranteeing consistent visual proportions across devices.

### Why Canvas 2D for the Felt Texture?

PixiJS v8's `renderer.generateTexture()` does not correctly render `FillGradient` on `Graphics` objects that are not on the display list. The felt table requires multiple overlapping radial gradients (lamp, warmth, vignette) that cannot be achieved with solid fills. Using the native Canvas 2D API to composite all layers, then uploading the result as a PixiJS `Texture`, was the pragmatic workaround.

### Why `Uint8Array` for Per-Card State?

For the Ace of Shadows sprite pool, `Uint8Array` was chosen over `Map<number, boolean>` or `boolean[]` for three reasons: O(1) indexed access by card ID, contiguous memory layout that is CPU-cache friendly when iterating all 144 cards, and zero garbage-collection pressure since the array is allocated once and never grows or shrinks.

## Credits

- **Build** [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Rendering** [PixiJS](https://pixijs.com/) v8
- **Animation** [GSAP](https://gsap.com/)
- **Particle emitter** [`@barvynkoa/particle-emitter`](https://github.com/andriibarvynko/particle-emitter) (MIT), a community fork of `@pixi/particle-emitter`
- **Sprite and UI assets** [Kenney](https://kenney.nl/)
- **Fonts** [Poppins](https://fonts.google.com/specimen/Poppins) (heading) and [Roboto](https://fonts.google.com/specimen/Roboto) (body) via Google Fonts
