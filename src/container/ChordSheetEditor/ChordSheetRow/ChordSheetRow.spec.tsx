import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CanonicalReducer, { setSelected } from '@/redux/reducer/CanonicalReducer';
import ToastReducer from '@/redux/reducer/ToastReducer';
import AppReducer from '@/redux/reducer/AppReducer';
import ChordSheetRow, { ChordSheetRowProps } from './index';
import { Row } from '@/redux/selectors/canonicalRows';

const CANONICAL = '[Am]Amazing\ngrace\n[G]how sweet\nthe sound';

function makeStore(selectedIndexes: number[] = [], clipboard: string[] = []) {
    return configureStore({
        reducer: { canonical: CanonicalReducer, toast: ToastReducer, app: AppReducer },
        preloadedState: {
            canonical: {
                value: CANONICAL,
                history: [],
                lineIds: ['id-0', 'id-1', 'id-2', 'id-3'],
                selected: { anchor: selectedIndexes[0], indexes: selectedIndexes },
                clipboard,
                key: undefined,
            },
        },
    });
}

const makeRow = (overrides: Partial<Row> = {}): Row => ({
    id: 'row-0',
    chord: 'Am',
    lyric: 'Amazing',
    sourceLineIndex: 0,
    isInstrumental: false,
    ...overrides,
});

function renderRow(
    store: ReturnType<typeof makeStore>,
    props: Partial<ChordSheetRowProps> = {},
) {
    const row = props.row ?? makeRow();
    render(
        <Provider store={store}>
            <ChordSheetRow
                rowIndex={props.rowIndex ?? 0}
                row={row}
                isFocused={props.isFocused ?? false}
                isNewUx
                isDragging={props.isDragging ?? false}
                isLifted={props.isLifted ?? false}
                dropIndicator={props.dropIndicator ?? null}
                onChordInputBlur={props.onChordInputBlur ?? jest.fn()}
                onLyricInputBlur={props.onLyricInputBlur ?? jest.fn()}
                enableEditLyrics={props.enableEditLyrics ?? false}
                onRowFocus={props.onRowFocus ?? jest.fn()}
                onRowHover={props.onRowHover ?? jest.fn()}
                onRowDragStart={props.onRowDragStart ?? jest.fn()}
                onRowDragOver={props.onRowDragOver ?? jest.fn()}
                onRowDrop={props.onRowDrop ?? jest.fn()}
                onRowDragEnd={props.onRowDragEnd ?? jest.fn()}
            />
        </Provider>,
    );
    return store;
}

// ── aria-selected ─────────────────────────────────────────────────────────────

describe('ChordSheetRow aria-selected', () => {
    it('aria-selected false when row not selected', () => {
        const store = makeStore([]);
        renderRow(store);
        expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');
    });

    it('aria-selected true when row is in selected indexes', () => {
        const store = makeStore([0]);
        renderRow(store);
        expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
    });
});

// ── CSS class on selection ────────────────────────────────────────────────────

describe('ChordSheetRow selection class', () => {
    it('adds --selected class when row is selected', () => {
        const store = makeStore([0]);
        renderRow(store);
        expect(screen.getByRole('option')).toHaveClass('SongTextRowContainer--selected');
    });

    it('no --selected class when row not selected', () => {
        const store = makeStore([]);
        renderRow(store);
        expect(screen.getByRole('option')).not.toHaveClass('SongTextRowContainer--selected');
    });
});

// ── Click dispatches setSelected ─────────────────────────────────────────────

describe('ChordSheetRow click mode dispatch', () => {
    it('single-click dispatches single selection', async () => {
        const user = userEvent.setup();
        const store = makeStore([]);
        renderRow(store);
        await user.click(screen.getByRole('option'));
        expect(store.getState().canonical.selected.indexes).toContain(0);
    });

    it('shift-click dispatches range selection', async () => {
        // Pre-select row 0 as anchor, then shift-click row 0 again (toggles but anchor stays)
        const store = makeStore([0]);
        renderRow(store, { row: makeRow({ sourceLineIndex: 0 }) });
        // Simulate shift+click
        fireEvent.click(screen.getByRole('option'), { shiftKey: true });
        // Range from anchor 0 to 0 = just [0]
        expect(store.getState().canonical.selected.indexes).toEqual([0]);
    });

    it('meta-click toggles row off when already selected', async () => {
        const user = userEvent.setup();
        const store = makeStore([0]);
        renderRow(store);
        // Cmd+click on already-selected row → removes it
        await user.click(screen.getByRole('option'), { metaKey: true });
        expect(store.getState().canonical.selected.indexes).not.toContain(0);
    });

    it('plain click on chord input does not change selection', () => {
        const store = makeStore([]);
        renderRow(store);
        const chordInput = screen.getAllByRole('textbox')[0];
        fireEvent.click(chordInput);
        expect(store.getState().canonical.selected.indexes).toEqual([]);
    });

    it('meta-click on chord input still toggles selection', () => {
        const store = makeStore([]);
        renderRow(store);
        const chordInput = screen.getAllByRole('textbox')[0];
        fireEvent.click(chordInput, { metaKey: true });
        expect(store.getState().canonical.selected.indexes).toContain(0);
    });

    it('shift-click on lyric input still extends selection', () => {
        const store = makeStore([]);
        renderRow(store);
        const lyricInput = screen.getAllByRole('textbox')[1];
        fireEvent.click(lyricInput, { shiftKey: true });
        expect(store.getState().canonical.selected.indexes).toContain(0);
    });
});

// ── Kebab menu ────────────────────────────────────────────────────────────────

describe('ChordSheetRow kebab menu', () => {
    async function openKebab() {
        const user = userEvent.setup();
        const store = makeStore([]);
        renderRow(store, { isFocused: true }); // isFocused = true makes affordances visible
        const trigger = screen.getByLabelText('Row actions');
        await user.click(trigger);
        return { store, user };
    }

    it('opens dropdown on trigger click', async () => {
        await openKebab();
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('Move up disabled for top row (sourceLineIndex === 0)', async () => {
        await openKebab();
        expect(screen.getByRole('menuitem', { name: 'Move up' })).toBeDisabled();
    });

    it('Move down dispatches moveDown action', async () => {
        const { store, user } = await openKebab();
        await user.click(screen.getByRole('menuitem', { name: 'Move down' }));
        // Chord value should have swapped between row 0 and row 1
        const lines = store.getState().canonical.value.split('\n');
        // After moveDown from index 0: chord 'Am' moves to line 1, line 0 gets empty chord
        expect(lines[0]).not.toContain('[Am]');
        expect(lines[1]).toContain('[Am]');
    });

    it('Clear chord dispatches clearChords and pushes toast', async () => {
        const { store, user } = await openKebab();
        await user.click(screen.getByRole('menuitem', { name: 'Clear chord' }));
        const state = store.getState();
        // Chord value cleared from row 0
        expect(state.canonical.value.split('\n')[0]).not.toContain('[Am]');
        // Toast pushed
        expect(state.toast.toast?.message).toContain('Cleared');
    });

    it('Clear chord button disabled when row has no chord', async () => {
        const user = userEvent.setup();
        const store = makeStore([]);
        // Row with empty chord
        renderRow(store, {
            isFocused: true,
            row: makeRow({ chord: '', sourceLineIndex: 0 }),
        });
        await user.click(screen.getByLabelText('Row actions'));
        expect(screen.getByRole('menuitem', { name: 'Clear chord' })).toBeDisabled();
    });

    it('Copy chord text button disabled when row has no chord', async () => {
        const user = userEvent.setup();
        const store = makeStore([]);
        renderRow(store, {
            isFocused: true,
            row: makeRow({ chord: '', sourceLineIndex: 0 }),
        });
        await user.click(screen.getByLabelText('Row actions'));
        expect(screen.getByRole('menuitem', { name: 'Copy chord text' })).toBeDisabled();
    });
});

// ── Lyric input visibility ────────────────────────────────────────────────────

describe('ChordSheetRow lyric input', () => {
    it('lyric input hidden for instrumental rows', () => {
        const store = makeStore([]);
        renderRow(store, { row: makeRow({ isInstrumental: true, lyric: '' }) });
        // No lyric input rendered for instrumental rows
        const inputs = screen.getAllByRole('textbox');
        // Only chord input (1 input), no lyric input
        expect(inputs).toHaveLength(1);
    });

    it('lyric input shown for non-instrumental rows', () => {
        const store = makeStore([]);
        renderRow(store);
        const inputs = screen.getAllByRole('textbox');
        expect(inputs).toHaveLength(2); // chord + lyric
    });
});
