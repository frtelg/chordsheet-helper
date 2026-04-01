# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server (localhost:3000)
yarn build        # Build production bundle
yarn test         # Run all Jest tests
yarn lint         # Run ESLint
yarn lint:fix     # Auto-fix ESLint issues
```

Run a single test file:
```bash
yarn test src/lib/chord/parseChord.spec.ts
```

Node version: 24 (see `.nvmrc`). Pre-commit hooks run gitleaks (secrets scan) and lint-staged (ESLint + Prettier) via Husky.

## Quality gate — run before every commit

Before committing any change, run the full quality gate in this order:

1. **Unit tests** — `yarn test --watchAll=false` — all suites must pass
2. **Production build** — `yarn build` — must complete without errors
3. **Dev server smoke test** — start `yarn dev`, open http://localhost:3000 with Playwright, verify the app loads and core interactions work (type lyrics, confirm chord detection modal, check editor renders with correct key), then stop the server

All three steps must pass. Do not commit if any step fails.

## Commit messages and PR titles

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<optional scope>): <short description>
```

Common types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `perf`, `ci`.

Examples:
- `feat(transposer): add support for sharp notation`
- `fix(parseChord): handle edge case for diminished seventh`
- `chore: upgrade Node.js to v24`

## Git hooks — never skip

**Never use `--no-verify` or any other mechanism to bypass pre-commit or pre-push hooks.** If a hook fails, fix the underlying issue before committing. This applies without exception, even when explicitly asked to commit quickly.

## Architecture

This is a Next.js 13 App Router app with Redux Toolkit for state management. The app has two main views: an **editor** and a **result** view, toggled by `AppReducer.showResult`.

### State (src/redux/reducer/)

Three Redux slices:
- **ChordSheetReducer** — core state: chords per row, key detection, transposition, row selection, undo history
- **SongTextReducer** — the raw lyrics text
- **AppReducer** — UI state (show editor vs. result)

### Containers (src/container/)

- **SongTextInput** — paste raw lyrics; opens `ProcessChordLinesModal` to extract chord rows from pasted text containing both chords and lyrics
- **ChordSheetEditor** — main editing UI; one row per lyric line; `HelpersBar` (copy/paste/move rows), `Transposer`, `ChordSheetRow` per line
- **ChordSheetResult** — read-only display with detected key; exports to OnSong format via `DownloadTextAsFileLink`

### Domain Model (src/model/)

- `NoteName` enum — C, D, E, F, G, A, B plus flats (no sharps internally)
- `MusicNote` — a note with interval arithmetic
- `Chord` interface — root `MusicNote` + array of additional `MusicNote` intervals; concrete types: Major, Minor, Diminished, Augmented, Suspended, Power

### Business Logic (src/lib/)

- `chord/parseChord` — parses chord strings (Am, Dm7, Gmaj7, etc.) into `Chord` objects
- `chord/isChordsOnly` — validates that a line contains only chord tokens
- `key/findKey` — detects musical key by matching a chord set against major scales
- `transposer/TransposerUtil` — transposes all chords N half steps; flats are used (not sharps)
- `note/NoteUtil` — note utilities
- `songTextChordsSeparator/` — separates chord rows from lyric rows in pasted text

### Code Style

- TypeScript strict mode; path alias `@/*` → `src/*`
- Prettier: 100-char line width, 4-space indent, single quotes
- Tests: Jest + Testing Library, jsdom environment, files named `*.spec.ts(x)` or `*.test.ts`
