import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CanonicalReducer, {
    setCanonical,
    setSelected,
} from '@/redux/reducer/CanonicalReducer';
import ToastReducer from '@/redux/reducer/ToastReducer';
import AppReducer from '@/redux/reducer/AppReducer';
import SelectionActionBar from './index';

/** Canonical with 4 lines: bracketed + lyric pairs */
const FOUR_LINE = '[Am]Amazing\ngrace\n[G]how sweet\nthe sound';

function makeStore(canonical = FOUR_LINE, clipboardChords: string[] = []) {
    const store = configureStore({
        reducer: { canonical: CanonicalReducer, toast: ToastReducer, app: AppReducer },
        preloadedState: {
            canonical: {
                value: canonical,
                history: [],
                lineIds: ['a', 'b', 'c', 'd'],
                selected: { anchor: undefined, indexes: [] },
                clipboard: clipboardChords,
                key: undefined,
            },
        },
    });
    return store;
}

function renderBar(
    store: ReturnType<typeof makeStore>,
    hoveredRowIndex?: number,
    focusedRowIndex?: number,
) {
    render(
        <Provider store={store}>
            <SelectionActionBar
                hoveredRowIndex={hoveredRowIndex}
                focusedRowIndex={focusedRowIndex}
            />
        </Provider>,
    );
}

// ── Visibility ──────────────────────────────────────────────────────────────

describe('SelectionActionBar visibility', () => {
    it('renders nothing when no rows selected', () => {
        const store = makeStore();
        const { container } = render(
            <Provider store={store}>
                <SelectionActionBar />
            </Provider>,
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders when at least one row is selected', () => {
        const store = makeStore();
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store);
        expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });
});

// ── Pill count ───────────────────────────────────────────────────────────────

describe('SelectionActionBar pill', () => {
    it('shows singular label for 1 row', () => {
        const store = makeStore();
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store);
        expect(screen.getByText('1 row selected')).toBeInTheDocument();
    });

    it('shows plural label for 2 rows', () => {
        const store = makeStore();
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        store.dispatch(setSelected({ index: 1, mode: 'range' }));
        renderBar(store);
        expect(screen.getByText('2 rows selected')).toBeInTheDocument();
    });
});

// ── Move up/down button enable logic ─────────────────────────────────────────

describe('SelectionActionBar Move buttons', () => {
    it('Move ↑ disabled when selection at top (minIdx === 0)', () => {
        const store = makeStore();
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store);
        expect(screen.getByTitle('Move up')).toBeDisabled();
    });

    it('Move ↑ enabled when selection not at top and contiguous', () => {
        const store = makeStore();
        store.dispatch(setSelected({ index: 1, mode: 'single' }));
        renderBar(store);
        expect(screen.getByTitle('Move up')).not.toBeDisabled();
    });

    it('Move ↓ disabled when selection at bottom (maxIdx === rows.length - 1)', () => {
        const store = makeStore();
        store.dispatch(setSelected({ index: 3, mode: 'single' }));
        renderBar(store);
        expect(screen.getByTitle('Move down')).toBeDisabled();
    });

    it('Move ↓ enabled when selection not at bottom and contiguous', () => {
        const store = makeStore();
        store.dispatch(setSelected({ index: 2, mode: 'single' }));
        renderBar(store);
        expect(screen.getByTitle('Move down')).not.toBeDisabled();
    });

    it('Move ↑ disabled for non-contiguous selection', () => {
        const store = makeStore();
        store.dispatch(setSelected({ index: 1, mode: 'single' }));
        store.dispatch(setSelected({ index: 3, mode: 'toggle' }));
        renderBar(store);
        expect(screen.getByTitle('Move up')).toBeDisabled();
    });

    it('Move ↓ disabled for non-contiguous selection', () => {
        const store = makeStore();
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        store.dispatch(setSelected({ index: 2, mode: 'toggle' }));
        renderBar(store);
        expect(screen.getByTitle('Move down')).toBeDisabled();
    });
});

// ── Paste button enable logic ─────────────────────────────────────────────────

describe('SelectionActionBar Paste button', () => {
    it('disabled when clipboard empty', () => {
        const store = makeStore(FOUR_LINE, []);
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store, 0);
        expect(screen.getByTitle('Paste chord values')).toBeDisabled();
    });

    it('disabled when clipboard has chords but no paste target', () => {
        const store = makeStore(FOUR_LINE, ['Am', 'G']);
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store); // no hoveredRowIndex / focusedRowIndex
        expect(screen.getByTitle('Paste chord values')).toBeDisabled();
    });

    it('enabled when clipboard has chords and focusedRowIndex set', () => {
        const store = makeStore(FOUR_LINE, ['Am', 'G']);
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store, undefined, 1);
        expect(screen.getByTitle('Paste chord values')).not.toBeDisabled();
    });

    it('enabled when clipboard has chords and hoveredRowIndex set', () => {
        const store = makeStore(FOUR_LINE, ['Am', 'G']);
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store, 2);
        expect(screen.getByTitle('Paste chord values')).not.toBeDisabled();
    });

    it('focusedRowIndex takes precedence over hoveredRowIndex for paste target', () => {
        const store = makeStore(FOUR_LINE, ['Am']);
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store, 2, 1); // hovered = row 2, focused = row 1
        // Both are valid targets; button should be enabled
        expect(screen.getByTitle('Paste chord values')).not.toBeDisabled();
    });
});

// ── Button dispatches ─────────────────────────────────────────────────────────

describe('SelectionActionBar dispatches', () => {
    it('Copy button copies chord values to clipboard', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store);
        await user.click(screen.getByTitle('Copy chord values'));
        expect(store.getState().canonical.clipboard).toEqual(['Am']);
    });

    it('Cut button clears chord values and puts them in clipboard', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store);
        await user.click(screen.getByTitle('Cut chord values'));
        const state = store.getState().canonical;
        expect(state.clipboard).toEqual(['Am']);
        // Line count unchanged — no canonical lines deleted
        expect(state.value.split('\n')).toHaveLength(4);
    });

    it('Clear chords clears chord values without touching clipboard', async () => {
        const user = userEvent.setup();
        const store = makeStore(FOUR_LINE, ['existing']);
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store);
        await user.click(screen.getByTitle('Clear chord values'));
        const state = store.getState().canonical;
        // Clipboard unchanged
        expect(state.clipboard).toEqual(['existing']);
        // Line count unchanged
        expect(state.value.split('\n')).toHaveLength(4);
    });

    it('Clear selection clears indexes', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store);
        await user.click(screen.getByTitle('Clear selection'));
        expect(store.getState().canonical.selected.indexes).toHaveLength(0);
    });

    it('Paste overwrites chord values downward from focused row', async () => {
        const user = userEvent.setup();
        const store = makeStore(FOUR_LINE, ['G7']);
        store.dispatch(setSelected({ index: 0, mode: 'single' }));
        renderBar(store, undefined, 2); // focused = row 2 (sourceLineIndex 2 = '[G]how sweet')
        await user.click(screen.getByTitle('Paste chord values'));
        const lines = store.getState().canonical.value.split('\n');
        // Row 2 chord should now be G7 (was G)
        expect(lines[2]).toContain('G7');
        // Line count unchanged
        expect(lines).toHaveLength(4);
    });
});
