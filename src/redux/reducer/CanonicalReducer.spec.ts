import canonicalReducer, {
    setCanonical,
    replaceLine,
    transposeAll,
    moveDown,
    moveUp,
    moveSelectionUp,
    moveSelectionDown,
    copySelected,
    cutSelected,
    pasteChords,
    clearChords,
    resetCanonical,
    undo,
    setSelected,
    setSelectedAll,
    clearSelected,
} from './CanonicalReducer';

const initial = {
    value: '',
    history: [] as { value: string; lineIds: string[] }[],
    lineIds: [] as string[],
    selected: { anchor: undefined, indexes: [] },
    clipboard: [] as string[],
    key: undefined,
};

describe('CanonicalReducer', () => {
    describe('setCanonical', () => {
        it('sets value and pushes history', () => {
            const s = canonicalReducer(initial, setCanonical('[Am]love'));
            expect(s.value).toBe('[Am]love');
            expect(s.history).toHaveLength(1);
            expect(s.history[0].value).toBe('');
        });

        it('creates lineIds for new lines', () => {
            const s = canonicalReducer(initial, setCanonical('a\nb\nc'));
            expect(s.lineIds).toHaveLength(3);
            s.lineIds.forEach((id) => expect(typeof id).toBe('string'));
        });

        it('preserves lineIds for unchanged lines', () => {
            const s1 = canonicalReducer(initial, setCanonical('a\nb\nc'));
            const ids1 = [...s1.lineIds];
            const s2 = canonicalReducer(s1, setCanonical('a\nb\nc'));
            expect(s2.lineIds).toEqual(ids1);
        });

        it('mints new id for inserted line, preserves others', () => {
            const s1 = canonicalReducer(initial, setCanonical('a\nb'));
            const [idA, idB] = s1.lineIds;
            const s2 = canonicalReducer(s1, setCanonical('a\nx\nb'));
            expect(s2.lineIds[0]).toBe(idA);
            expect(s2.lineIds[2]).toBe(idB);
            expect(s2.lineIds[1]).not.toBe(idA);
            expect(s2.lineIds[1]).not.toBe(idB);
        });

        it('detects key from bracket tokens', () => {
            const s = canonicalReducer(initial, setCanonical('[C]love [G]me [Am]always [F]'));
            expect(s.key).toBeDefined();
        });

        it('key is undefined when no bracket tokens', () => {
            const s = canonicalReducer(initial, setCanonical('love me'));
            expect(s.key).toBeUndefined();
        });
    });

    describe('replaceLine', () => {
        it('replaces a single line by index', () => {
            const start = canonicalReducer(initial, setCanonical('line0\nline1\nline2'));
            const s = canonicalReducer(start, replaceLine({ lineIndex: 1, newLine: '[G]replaced' }));
            expect(s.value).toBe('line0\n[G]replaced\nline2');
        });

        it('mints new id for the replaced line, preserves others', () => {
            const s1 = canonicalReducer(initial, setCanonical('a\nb\nc'));
            const [id0, id1, id2] = s1.lineIds;
            const s2 = canonicalReducer(s1, replaceLine({ lineIndex: 1, newLine: 'x' }));
            expect(s2.lineIds[0]).toBe(id0);
            expect(s2.lineIds[1]).not.toBe(id1);
            expect(s2.lineIds[2]).toBe(id2);
        });

        it('pushes history', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, replaceLine({ lineIndex: 0, newLine: 'x' }));
            expect(s.history).toHaveLength(2);
            expect(s.history[1].value).toBe('a\nb');
        });
    });

    describe('transposeAll', () => {
        it('transposes bracket tokens up 2 semitones', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love'));
            const s = canonicalReducer(start, transposeAll(2));
            expect(s.value).toBe('[Bm]love');
        });

        it('does not change lineIds (same structure)', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const idsBefore = [...start.lineIds];
            const s = canonicalReducer(start, transposeAll(2));
            expect(s.lineIds).toEqual(idsBefore);
        });

        it('pushes history', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love'));
            const s = canonicalReducer(start, transposeAll(1));
            expect(s.history).toHaveLength(2);
            expect(s.history[1].value).toBe('[Am]love');
        });
    });

    describe('moveDown (chord-only swap)', () => {
        it('swaps chord values between N and N+1; lyrics stay', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const s = canonicalReducer(start, moveDown(0));
            // Am moves to sit above 'me', G moves to sit above 'love'
            expect(s.value).toBe('[G]love\n[Am]me');
        });

        it('chord-only line swaps into bracketed line', () => {
            // Chord-only: 'Am G' line + bracketed lyric line
            const start = canonicalReducer(initial, setCanonical('[Am]Amazing grace\nHow sweet'));
            const s = canonicalReducer(start, moveDown(0));
            // chord 'Am' moves to line 1 which has lyric 'How sweet'; line 0 becomes lyric-only
            expect(s.value).toBe('Amazing grace\n[Am]How sweet');
        });

        it('lyric-only line gets chord from below', () => {
            const start = canonicalReducer(initial, setCanonical('Amazing grace\n[G]me'));
            const s = canonicalReducer(start, moveDown(0));
            expect(s.value).toBe('[G]Amazing grace\nme');
        });

        it('swapping two empty-chord lines is a no-change (but history pushed)', () => {
            const start = canonicalReducer(initial, setCanonical('Amazing grace\nHow sweet'));
            const s = canonicalReducer(start, moveDown(0));
            expect(s.value).toBe('Amazing grace\nHow sweet');
            // History still pushed because boundary check passed
            expect(s.history.length).toBeGreaterThan(start.history.length);
        });

        it('no-op at last index (no history push)', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const histLen = start.history.length;
            const s = canonicalReducer(start, moveDown(1));
            expect(s.value).toBe('[Am]love\n[G]me');
            expect(s.history).toHaveLength(histLen);
        });

        it('lineIds are NOT swapped — lyrics stay in position', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const [id0, id1] = start.lineIds;
            const s = canonicalReducer(start, moveDown(0));
            // lineIds stay in place because canonical lines don't reorder
            expect(s.lineIds[0]).toBe(id0);
            expect(s.lineIds[1]).toBe(id1);
        });

        it('pushes history', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const s = canonicalReducer(start, moveDown(0));
            expect(s.history).toHaveLength(2);
            expect(s.history[1].value).toBe('[Am]love\n[G]me');
        });

        it('moveDown then moveUp restores original chord positions', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s1 = canonicalReducer(start, moveDown(0));
            const s2 = canonicalReducer(s1, moveUp(1));
            expect(s2.value).toBe(start.value);
        });
    });

    describe('moveUp (chord-only swap)', () => {
        it('swaps chord values between N and N-1; lyrics stay', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const s = canonicalReducer(start, moveUp(1));
            expect(s.value).toBe('[G]love\n[Am]me');
        });

        it('no-op at index 0 (no history push)', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const histLen = start.history.length;
            const s = canonicalReducer(start, moveUp(0));
            expect(s.value).toBe('[Am]love\n[G]me');
            expect(s.history).toHaveLength(histLen);
        });

        it('lineIds are NOT swapped', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const [id0, id1] = start.lineIds;
            const s = canonicalReducer(start, moveUp(1));
            expect(s.lineIds[0]).toBe(id0);
            expect(s.lineIds[1]).toBe(id1);
        });
    });

    describe('moveSelectionUp (block chord rotation)', () => {
        it('moves selection of 1 up — same as single moveUp', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 1, mode: 'single' }));
            const s3 = canonicalReducer(s2, moveSelectionUp());
            // Chord at row 1 (G) swaps with row 0 (Am)
            expect(s3.value).toBe('[G]love\n[Am]me\n[C]always');
        });

        it('moves contiguous block of 2 up via left-rotation', () => {
            const s1 = canonicalReducer(
                initial,
                setCanonical('[Am]love\n[G]me\n[C]always\n[F]grace')
            );
            // Select rows 1 and 2 (indexes 1,2)
            const s2 = canonicalReducer(s1, setSelected({ index: 1, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 2, mode: 'range' }));
            const s4 = canonicalReducer(s3, moveSelectionUp());
            // Rotation range: [0..2]. Before: [Am, G, C]. Left-rotate → [G, C, Am]
            // Row 0: chord=G, lyric=love → [G]love
            // Row 1: chord=C, lyric=me → [C]me
            // Row 2: chord=Am, lyric=always → [Am]always
            // Row 3 unchanged: [F]grace
            expect(s4.value).toBe('[G]love\n[C]me\n[Am]always\n[F]grace');
        });

        it('selection shifts up by 1 after move', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]a\n[G]b\n[C]c'));
            const s2 = canonicalReducer(s1, setSelected({ index: 1, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 2, mode: 'range' }));
            const s4 = canonicalReducer(s3, moveSelectionUp());
            expect(s4.selected.indexes).toEqual([0, 1]);
        });

        it('no-op when selection is at top boundary', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]a\n[G]b\n[C]c'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const histLen = s2.history.length;
            const s3 = canonicalReducer(s2, moveSelectionUp());
            expect(s3.value).toBe(s2.value);
            expect(s3.history).toHaveLength(histLen);
        });

        it('no-op when no selection', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]a\n[G]b'));
            const histLen = s1.history.length;
            const s2 = canonicalReducer(s1, moveSelectionUp());
            expect(s2.value).toBe(s1.value);
            expect(s2.history).toHaveLength(histLen);
        });
    });

    describe('moveSelectionDown (block chord rotation)', () => {
        it('moves selection of 1 down — same as single moveDown', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 1, mode: 'single' }));
            const s3 = canonicalReducer(s2, moveSelectionDown());
            // Chord at row 1 (G) swaps with row 2 (C)
            expect(s3.value).toBe('[Am]love\n[C]me\n[G]always');
        });

        it('moves contiguous block of 2 down via right-rotation', () => {
            const s1 = canonicalReducer(
                initial,
                setCanonical('[Am]love\n[G]me\n[C]always\n[F]grace')
            );
            // Select rows 1 and 2 (indexes 1,2)
            const s2 = canonicalReducer(s1, setSelected({ index: 1, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 2, mode: 'range' }));
            const s4 = canonicalReducer(s3, moveSelectionDown());
            // Rotation range: [1..3]. Before: [G, C, F]. Right-rotate → [F, G, C]
            // Row 0 unchanged: [Am]love
            // Row 1: chord=F, lyric=me → [F]me
            // Row 2: chord=G, lyric=always → [G]always
            // Row 3: chord=C, lyric=grace → [C]grace
            expect(s4.value).toBe('[Am]love\n[F]me\n[G]always\n[C]grace');
        });

        it('selection shifts down by 1 after move', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]a\n[G]b\n[C]c'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 1, mode: 'range' }));
            const s4 = canonicalReducer(s3, moveSelectionDown());
            expect(s4.selected.indexes).toEqual([1, 2]);
        });

        it('no-op when selection is at bottom boundary', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]a\n[G]b\n[C]c'));
            const s2 = canonicalReducer(s1, setSelected({ index: 2, mode: 'single' }));
            const histLen = s2.history.length;
            const s3 = canonicalReducer(s2, moveSelectionDown());
            expect(s3.value).toBe(s2.value);
            expect(s3.history).toHaveLength(histLen);
        });
    });

    describe('copySelected (copies chord VALUE strings)', () => {
        it('copies chord string from selected row', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 1, mode: 'single' }));
            const s3 = canonicalReducer(s2, copySelected());
            expect(s3.clipboard).toEqual(['G']);
        });

        it('copies chord strings from range in index order', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 2, mode: 'range' }));
            const s4 = canonicalReducer(s3, copySelected());
            expect(s4.clipboard).toEqual(['Am', 'G', 'C']);
        });

        it('copies empty string for lyric-only row', () => {
            const s1 = canonicalReducer(initial, setCanonical('Amazing grace\n[G]me'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, copySelected());
            expect(s3.clipboard).toEqual(['']);
        });

        it('copies whole line for chord-only row', () => {
            // isChordsOnly line — entire line is the chord value
            const s1 = canonicalReducer(initial, setCanonical('[Am]'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, copySelected());
            expect(s3.clipboard).toEqual(['Am']);
        });

        it('does not change canonical value or push history', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const historyLen = s2.history.length;
            const s3 = canonicalReducer(s2, copySelected());
            expect(s3.value).toBe(s2.value);
            expect(s3.history).toHaveLength(historyLen);
        });
    });

    describe('cutSelected (clears chord values, does NOT delete lines)', () => {
        it('copies chord to clipboard and clears chord from source row; lyric stays', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 1, mode: 'single' }));
            const s3 = canonicalReducer(s2, cutSelected());
            expect(s3.clipboard).toEqual(['G']);
            // Line 1 becomes lyric-only; no lines deleted
            expect(s3.value).toBe('[Am]love\nme\n[C]always');
            expect(s3.value.split('\n')).toHaveLength(3);
        });

        it('cuts multiple rows; all lyrics remain', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 1, mode: 'range' }));
            const s4 = canonicalReducer(s3, cutSelected());
            expect(s4.clipboard).toEqual(['Am', 'G']);
            expect(s4.value).toBe('love\nme\n[C]always');
            expect(s4.value.split('\n')).toHaveLength(3);
        });

        it('lineIds are NOT changed (no lines deleted)', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const [id0, id1, id2] = s1.lineIds;
            const s2 = canonicalReducer(s1, setSelected({ index: 1, mode: 'single' }));
            const s3 = canonicalReducer(s2, cutSelected());
            expect(s3.lineIds).toEqual([id0, id1, id2]);
        });

        it('pushes history', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const histLen = s2.history.length;
            const s3 = canonicalReducer(s2, cutSelected());
            expect(s3.history).toHaveLength(histLen + 1);
        });

        it('does nothing when selection is empty', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love'));
            const histLen = s1.history.length;
            const s2 = canonicalReducer(s1, cutSelected());
            expect(s2.value).toBe('[Am]love');
            expect(s2.history).toHaveLength(histLen);
        });
    });

    describe('pasteChords (overwrites chord values downward)', () => {
        it('replaces chord values at targetIdx going downward; lyrics stay', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, copySelected());
            // Clipboard: ['Am']. Paste at row 1: replaces chord at row 1.
            const s4 = canonicalReducer(s3, pasteChords(1));
            expect(s4.value).toBe('[Am]love\n[Am]me\n[C]always');
        });

        it('pastes multiple chord values downward', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Em]love\n[D]me\nHallelujah\n[C]always'));
            // Copy first two chords
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 1, mode: 'range' }));
            const s4 = canonicalReducer(s3, copySelected());
            // Clipboard: ['Em', 'D']. Paste at row 2: rows 2 and 3 get these chords.
            const s5 = canonicalReducer(s4, pasteChords(2));
            expect(s5.value).toBe('[Em]love\n[D]me\n[Em]Hallelujah\n[D]always');
        });

        it('does NOT insert new lines; line count stays the same', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 1, mode: 'range' }));
            const s4 = canonicalReducer(s3, copySelected());
            const s5 = canonicalReducer(s4, pasteChords(1));
            expect(s5.value.split('\n')).toHaveLength(3);
        });

        it('stops at last line if clipboard is longer', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 2, mode: 'range' }));
            const s4 = canonicalReducer(s3, copySelected());
            // Clipboard: ['Am', 'G', 'C']. Paste at row 1: only rows 1 and 2 exist.
            const s5 = canonicalReducer(s4, pasteChords(1));
            expect(s5.value).toBe('[Am]love\n[Am]me\n[G]always');
            expect(s5.value.split('\n')).toHaveLength(3);
        });

        it('lineIds are NOT changed', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const [id0, id1, id2] = s1.lineIds;
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, copySelected());
            const s4 = canonicalReducer(s3, pasteChords(1));
            expect(s4.lineIds).toEqual([id0, id1, id2]);
        });

        it('pushes history', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, copySelected());
            const histLen = s3.history.length;
            const s4 = canonicalReducer(s3, pasteChords(1));
            expect(s4.history).toHaveLength(histLen + 1);
        });

        it('does nothing when clipboard is empty', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const histLen = s1.history.length;
            const s2 = canonicalReducer(s1, pasteChords(0));
            expect(s2.value).toBe('[Am]love\n[G]me');
            expect(s2.history).toHaveLength(histLen);
        });

        it('cut + pasteChords round-trip: source has no chord, target has source chord', () => {
            const canonical = '[Am]love\n[G]me\n[C]always';
            const s1 = canonicalReducer(initial, setCanonical(canonical));
            // Cut row 0
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, cutSelected());
            expect(s3.value.split('\n')[0]).toBe('love'); // chord cleared
            // Paste at row 2
            const s4 = canonicalReducer(s3, pasteChords(2));
            expect(s4.value).toBe('love\n[G]me\n[Am]always');
            // Full undo restores original
            const s5 = canonicalReducer(s4, undo());
            expect(s5.value).toBe('love\n[G]me\n[C]always');
            const s6 = canonicalReducer(s5, undo());
            expect(s6.value).toBe(canonical);
        });
    });

    describe('clearChords (clears chord values from selected rows, no line deletion)', () => {
        it('clears chord from selected row; lyric stays; no lines deleted', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 1, mode: 'single' }));
            const s3 = canonicalReducer(s2, clearChords());
            expect(s3.value).toBe('[Am]love\nme\n[C]always');
            expect(s3.value.split('\n')).toHaveLength(3);
        });

        it('clears multiple selected rows', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me\n[C]always'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, setSelected({ index: 2, mode: 'toggle' }));
            const s4 = canonicalReducer(s3, clearChords());
            expect(s4.value).toBe('love\n[G]me\nalways');
        });

        it('lineIds unchanged', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const [id0, id1] = s1.lineIds;
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, clearChords());
            expect(s3.lineIds).toEqual([id0, id1]);
        });

        it('pushes history', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const histLen = s2.history.length;
            const s3 = canonicalReducer(s2, clearChords());
            expect(s3.history).toHaveLength(histLen + 1);
        });

        it('does nothing when selection is empty', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love'));
            const histLen = s1.history.length;
            const s2 = canonicalReducer(s1, clearChords());
            expect(s2.value).toBe('[Am]love');
            expect(s2.history).toHaveLength(histLen);
        });
    });

    describe('resetCanonical', () => {
        it('clears value, lineIds, and key', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love'));
            const s = canonicalReducer(start, resetCanonical());
            expect(s.value).toBe('');
            expect(s.lineIds).toEqual([]);
            expect(s.key).toBeUndefined();
        });

        it('pushes history', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love'));
            const s = canonicalReducer(start, resetCanonical());
            expect(s.history).toHaveLength(2);
            expect(s.history[1].value).toBe('[Am]love');
        });
    });

    describe('undo', () => {
        it('restores previous value after moveDown (chord swap)', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const s2 = canonicalReducer(s1, moveDown(0));
            const s3 = canonicalReducer(s2, undo());
            expect(s3.value).toBe('[Am]love\n[G]me');
        });

        it('does nothing when history is empty', () => {
            const s = canonicalReducer(initial, undo());
            expect(s.value).toBe('');
        });

        it('can undo multiple times', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]a'));
            const s2 = canonicalReducer(s1, setCanonical('[G]b'));
            const s3 = canonicalReducer(s2, undo());
            const s4 = canonicalReducer(s3, undo());
            const s5 = canonicalReducer(s4, undo());
            expect(s5.value).toBe('');
        });

        it('restores lineIds after moveDown (lineIds did not change, but value did)', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const idsAfterSet = [...s1.lineIds];
            const s2 = canonicalReducer(s1, moveDown(0));
            const s3 = canonicalReducer(s2, undo());
            expect(s3.lineIds).toEqual(idsAfterSet);
        });

        it('undo through cutSelected restores chord values', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            const s2 = canonicalReducer(s1, setSelected({ index: 0, mode: 'single' }));
            const s3 = canonicalReducer(s2, cutSelected());
            expect(s3.value).toBe('love\n[G]me');
            const s4 = canonicalReducer(s3, undo());
            expect(s4.value).toBe('[Am]love\n[G]me');
        });

        it('undo through transposeAll restores key', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love'));
            const keyBefore = s1.key;
            const s2 = canonicalReducer(s1, transposeAll(1));
            const s3 = canonicalReducer(s2, undo());
            expect(s3.key).toBe(keyBefore);
        });
    });

    describe('setSelected / setSelectedAll / clearSelected', () => {
        it('single mode selects one row', () => {
            const s = canonicalReducer(initial, setSelected({ index: 3, mode: 'single' }));
            expect(s.selected).toEqual({ anchor: 3, indexes: [3] });
        });

        it('range mode extends from anchor', () => {
            const s1 = canonicalReducer(initial, setSelected({ index: 1, mode: 'single' }));
            const s2 = canonicalReducer(s1, setSelected({ index: 3, mode: 'range' }));
            expect(s2.selected.indexes).toEqual([1, 2, 3]);
        });

        it('toggle mode adds non-contiguous row', () => {
            const s1 = canonicalReducer(initial, setSelected({ index: 1, mode: 'single' }));
            const s2 = canonicalReducer(s1, setSelected({ index: 3, mode: 'toggle' }));
            expect(s2.selected.indexes).toEqual([1, 3]);
        });

        it('setSelectedAll selects all rows', () => {
            const s = canonicalReducer(initial, setSelectedAll(4));
            expect(s.selected.indexes).toEqual([0, 1, 2, 3]);
        });

        it('clearSelected empties selection', () => {
            const s1 = canonicalReducer(initial, setSelected({ index: 1, mode: 'single' }));
            const s2 = canonicalReducer(s1, clearSelected());
            expect(s2.selected).toEqual({ anchor: undefined, indexes: [] });
        });
    });
});
