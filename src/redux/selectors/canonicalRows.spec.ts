import { configureStore } from '@reduxjs/toolkit';
import CanonicalReducer, {
    setCanonical,
    replaceLine,
    transposeAll,
    pasteChords,
    copySelected,
    setSelected,
    moveDown,
    moveUp,
} from '@/redux/reducer/CanonicalReducer';
import AppReducer from '@/redux/reducer/AppReducer';
import ToastReducer from '@/redux/reducer/ToastReducer';
import { selectRows, selectChordTokens, selectKey } from './canonicalRows';

function makeStore(value = '') {
    const store = configureStore({
        reducer: { canonical: CanonicalReducer, app: AppReducer, toast: ToastReducer },
        preloadedState: {
            canonical: {
                value,
                history: [],
                lineIds: [],
                selected: { anchor: undefined, indexes: [] },
                clipboard: [],
                key: undefined,
            },
        },
    });
    return store;
}

describe('selectRows', () => {
    describe('sourceLineIndex → replaceLine integration', () => {
        it('using sourceLineIndex from selectRows targets the correct canonical line', () => {
            const store = makeStore('[Am]verse one\n[G]verse two\n[F]verse three');
            const state = store.getState();
            const rows = selectRows(state);

            // Row at display index 1 corresponds to "[G]verse two"
            const targetRow = rows[1];
            store.dispatch(
                replaceLine({
                    lineIndex: targetRow.sourceLineIndex,
                    newLine: '[C]replaced',
                })
            );

            const newCanonical = store.getState().canonical.value;
            const lines = newCanonical.split('\n');
            expect(lines[targetRow.sourceLineIndex]).toBe('[C]replaced');
            // Other lines untouched
            expect(lines[0]).toBe('[Am]verse one');
            expect(lines[2]).toBe('[F]verse three');
        });

        it('replacing a chord updates only that line — other rows unchanged', () => {
            const store = makeStore('amazing grace\nhow sweet the sound');
            const state = store.getState();
            const rows = selectRows(state);

            store.dispatch(
                replaceLine({
                    lineIndex: rows[0].sourceLineIndex,
                    newLine: '[Am]amazing grace',
                })
            );

            const lines = store.getState().canonical.value.split('\n');
            expect(lines[0]).toBe('[Am]amazing grace');
            expect(lines[1]).toBe('how sweet the sound');
        });

        it('instrumental row sourceLineIndex round-trips correctly', () => {
            const store = makeStore('Am G\namazing grace');
            const state = store.getState();
            const rows = selectRows(state);

            const instrumental = rows.find((r) => r.isInstrumental);
            expect(instrumental).toBeDefined();

            store.dispatch(
                replaceLine({
                    lineIndex: instrumental!.sourceLineIndex,
                    newLine: 'C F',
                })
            );

            const lines = store.getState().canonical.value.split('\n');
            expect(lines[instrumental!.sourceLineIndex]).toBe('C F');
        });
    });

    describe('transposeAll — only bracketed segments change', () => {
        it('bracket tokens are transposed, lyric text is unchanged', () => {
            const store = makeStore('[Am]love [G]me');
            store.dispatch(transposeAll(2));
            const value = store.getState().canonical.value;
            // Am up 2 = Bm, G up 2 = A
            expect(value).toContain('[Bm]');
            expect(value).toContain('[A]');
            // Lyric words untouched
            expect(value).toContain('love');
            expect(value).toContain('me');
        });

        it('chord-only lines (no brackets) are also transposed', () => {
            const store = makeStore('Am G\namazing grace');
            store.dispatch(transposeAll(2));
            const value = store.getState().canonical.value;
            expect(value).toContain('B');
            expect(value).toContain('A');
            expect(value).toContain('amazing grace');
        });

        it('pure lyric line has no bracket tokens and is left unchanged', () => {
            const store = makeStore('amazing grace\nhow sweet');
            store.dispatch(transposeAll(3));
            expect(store.getState().canonical.value).toBe('amazing grace\nhow sweet');
        });
    });

    describe('pasteChords — overwrites chord values downward, no line insertion', () => {
        it('replaces chord values at target going downward; line count unchanged', () => {
            const store = makeStore('[Am]verse\n[G]chorus\nbridge\noutro');
            store.dispatch(setSelected({ index: 0, mode: 'single' }));
            store.dispatch(setSelected({ index: 1, mode: 'range' }));
            store.dispatch(copySelected());
            store.dispatch(pasteChords(2));
            const lines = store.getState().canonical.value.split('\n');
            // 4 lines still — no insertion
            expect(lines).toHaveLength(4);
            // lyrics preserved
            expect(lines[0]).toBe('[Am]verse');
            expect(lines[1]).toBe('[G]chorus');
            // chord values pasted onto rows 2 and 3
            expect(lines[2]).toBe('[Am]bridge');
            expect(lines[3]).toBe('[G]outro');
        });
    });

    describe('moveDown / moveUp — chord-only swap semantics', () => {
        it('moveDown swaps chord values; lyrics stay in place', () => {
            const store = makeStore('[Am]verse\nchorus');
            store.dispatch(moveDown(0));
            const lines = store.getState().canonical.value.split('\n');
            // Am moves to sit above 'chorus'; 'verse' row has no chord now
            expect(lines[0]).toBe('verse');
            expect(lines[1]).toBe('[Am]chorus');
        });

        it('moveUp swaps chord values; lyrics stay in place', () => {
            const store = makeStore('[Am]verse\n[G]chorus');
            store.dispatch(moveUp(1));
            const lines = store.getState().canonical.value.split('\n');
            expect(lines[0]).toBe('[G]verse');
            expect(lines[1]).toBe('[Am]chorus');
        });
    });

    describe('memoisation', () => {
        it('selectRows returns the same reference when state is unchanged', () => {
            const store = makeStore('[Am]love me');
            const state = store.getState();
            const rows1 = selectRows(state);
            const rows2 = selectRows(state);
            expect(rows1).toBe(rows2);
        });

        it('selectRows returns new reference after state changes', () => {
            const store = makeStore('[Am]love me');
            const before = selectRows(store.getState());
            store.dispatch(setCanonical('[G]love me'));
            const after = selectRows(store.getState());
            expect(before).not.toBe(after);
        });
    });
});

describe('selectChordTokens', () => {
    it('returns flat list of chord names from all rows', () => {
        const store = makeStore('[Am]verse [G]line\n[C]chorus');
        const tokens = selectChordTokens(store.getState());
        expect(tokens).toContain('Am');
        expect(tokens).toContain('G');
        expect(tokens).toContain('C');
    });

    it('returns empty array when no chords', () => {
        const store = makeStore('plain lyrics here');
        expect(selectChordTokens(store.getState())).toEqual([]);
    });
});

describe('selectKey', () => {
    it('detects key from bracket tokens', () => {
        const store = makeStore('[C]love [G]me [Am]always [F]');
        const key = selectKey(store.getState());
        expect(key).toBeDefined();
    });

    it('returns undefined when no bracket tokens present', () => {
        const store = makeStore('love me');
        expect(selectKey(store.getState())).toBeUndefined();
    });
});
