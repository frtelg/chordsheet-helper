import { configureStore } from '@reduxjs/toolkit';
import CanonicalReducer, {
    setCanonical,
    replaceLine,
    transposeAll,
    pasteSelected,
    setSelected,
    moveDown,
    moveUp,
} from '@/redux/reducer/CanonicalReducer';
import AppReducer from '@/redux/reducer/AppReducer';
import { selectRows, selectChordTokens, selectKey } from './canonicalRows';

function makeStore(value = '') {
    const store = configureStore({
        reducer: { canonical: CanonicalReducer, app: AppReducer },
        preloadedState: {
            canonical: { value, history: [], selected: {}, key: undefined },
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

    describe('pasteSelected — other lines preserved', () => {
        it('pasted rows replace target while preserving untouched lines', () => {
            const store = makeStore('line0\nline1\nline2\nline3');
            store.dispatch(setSelected(1));
            store.dispatch(pasteSelected(3));
            const lines = store.getState().canonical.value.split('\n');
            expect(lines).toContain('line1');
            expect(lines).toContain('line0');
        });
    });

    describe('moveDown / moveUp — line order preserved', () => {
        it('moveDown strips chord from current line, applies to next', () => {
            const store = makeStore('[Am]verse\nchorus');
            store.dispatch(moveDown(0));
            const lines = store.getState().canonical.value.split('\n');
            expect(lines[0]).toBe('verse');
            expect(lines[1]).toContain('[Am]');
            expect(lines[1]).toContain('chorus');
        });

        it('moveUp removes the line above the given index', () => {
            // 'verse\n\nchorus' → line 0: 'verse', line 1: '', line 2: 'chorus'
            // moveUp(2) removes line at index 1 (the separator '')
            const store = makeStore('verse\n\nchorus');
            store.dispatch(moveUp(2));
            expect(store.getState().canonical.value).toBe('verse\nchorus');
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
