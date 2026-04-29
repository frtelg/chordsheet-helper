import canonicalReducer, {
    setCanonical,
    replaceLine,
    transposeAll,
    moveDown,
    moveUp,
    pasteSelected,
    resetCanonical,
    undo,
    setSelected,
    clearSelected,
} from './CanonicalReducer';

const initial = { value: '', history: [], selected: {}, key: undefined };

describe('CanonicalReducer', () => {
    describe('setCanonical', () => {
        it('sets value and pushes history', () => {
            const s = canonicalReducer(initial, setCanonical('[Am]love'));
            expect(s.value).toBe('[Am]love');
            expect(s.history).toEqual(['']);
        });

        it('detects key from bracket tokens', () => {
            const s = canonicalReducer(initial, setCanonical('[C]love [G]me [Am]always [F]'));
            expect(s.key).toBeDefined();
        });

        it('key is undefined when no bracket tokens', () => {
            const s = canonicalReducer(initial, setCanonical('love me'));
            expect(s.key).toBeUndefined();
        });

        it('multi-line canonical string', () => {
            const s = canonicalReducer(initial, setCanonical('[Am]love\n[G]me'));
            expect(s.value).toBe('[Am]love\n[G]me');
        });
    });

    describe('replaceLine', () => {
        it('replaces a single line by index', () => {
            const start = canonicalReducer(initial, setCanonical('line0\nline1\nline2'));
            const s = canonicalReducer(start, replaceLine({ lineIndex: 1, newLine: '[G]replaced' }));
            expect(s.value).toBe('line0\n[G]replaced\nline2');
        });

        it('replaces first line', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, replaceLine({ lineIndex: 0, newLine: 'x' }));
            expect(s.value).toBe('x\nb');
        });

        it('replaces last line', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, replaceLine({ lineIndex: 1, newLine: 'x' }));
            expect(s.value).toBe('a\nx');
        });

        it('pushes history', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, replaceLine({ lineIndex: 0, newLine: 'x' }));
            expect(s.history).toEqual(['', 'a\nb']);
        });
    });

    describe('transposeAll', () => {
        it('transposes bracket tokens up 2 semitones', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love'));
            const s = canonicalReducer(start, transposeAll(2));
            expect(s.value).toBe('[Bm]love');
        });

        it('transposes multi-chord line', () => {
            const start = canonicalReducer(initial, setCanonical('[C]a [G]b'));
            const s = canonicalReducer(start, transposeAll(2));
            expect(s.value).toBe('[D]a [A]b');
        });

        it('transposes instrumental chord-only lines (no brackets)', () => {
            const start = canonicalReducer(initial, setCanonical('Am G'));
            const s = canonicalReducer(start, transposeAll(2));
            expect(s.value).toBe('Bm A');
        });

        it('transposes bracketed instrumental lines', () => {
            const start = canonicalReducer(initial, setCanonical('[Am] [G]'));
            const s = canonicalReducer(start, transposeAll(2));
            expect(s.value).toBe('[Bm] [A]');
        });

        it('does not transpose lyric words', () => {
            const start = canonicalReducer(initial, setCanonical('[G]Amazing grace'));
            const s = canonicalReducer(start, transposeAll(2));
            expect(s.value).toBe('[A]Amazing grace');
        });

        it('pushes history', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love'));
            const s = canonicalReducer(start, transposeAll(1));
            expect(s.history).toEqual(['', '[Am]love']);
        });
    });

    describe('moveDown', () => {
        it('inserts blank line before given index', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb\nc'));
            const s = canonicalReducer(start, moveDown(1));
            expect(s.value).toBe('a\n\nb\nc');
        });

        it('inserts at index 0', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, moveDown(0));
            expect(s.value).toBe('\na\nb');
        });

        it('inserts at last index', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, moveDown(2));
            expect(s.value).toBe('a\nb\n');
        });

        it('pushes history', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, moveDown(1));
            expect(s.history).toEqual(['', 'a\nb']);
        });
    });

    describe('moveUp', () => {
        it('removes line above given index', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb\nc'));
            const s = canonicalReducer(start, moveUp(1));
            expect(s.value).toBe('b\nc');
        });

        it('removes line above index 1 (removes first line)', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, moveUp(1));
            expect(s.value).toBe('b');
        });

        it('does nothing when index is 0', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, moveUp(0));
            expect(s.value).toBe('a\nb');
        });

        it('pushes history', () => {
            const start = canonicalReducer(initial, setCanonical('a\nb'));
            const s = canonicalReducer(start, moveUp(1));
            expect(s.history).toEqual(['', 'a\nb']);
        });
    });

    describe('pasteSelected', () => {
        it('pastes selected line at target, replacing N+1 lines', () => {
            const withValue = canonicalReducer(initial, setCanonical('a\nb\nc'));
            const withSelected = canonicalReducer(withValue, setSelected(1));
            const s = canonicalReducer(withSelected, pasteSelected(2));
            expect(s.value).toBe('a\nb\nb');
        });

        it('pastes at index 0', () => {
            const withValue = canonicalReducer(initial, setCanonical('a\nb\nc'));
            const withSelected = canonicalReducer(withValue, setSelected(0));
            const s = canonicalReducer(withSelected, pasteSelected(1));
            expect(s.value).toBe('a\na');
        });

        it('does nothing if nothing selected', () => {
            const withValue = canonicalReducer(initial, setCanonical('a\nb\nc'));
            const s = canonicalReducer(withValue, pasteSelected(0));
            expect(s.value).toBe('a\nb\nc');
        });
    });

    describe('resetCanonical', () => {
        it('clears value and key', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love'));
            const s = canonicalReducer(start, resetCanonical());
            expect(s.value).toBe('');
            expect(s.key).toBeUndefined();
        });

        it('pushes history', () => {
            const start = canonicalReducer(initial, setCanonical('[Am]love'));
            const s = canonicalReducer(start, resetCanonical());
            expect(s.history).toEqual(['', '[Am]love']);
        });
    });

    describe('undo', () => {
        it('restores previous value', () => {
            const s1 = canonicalReducer(initial, setCanonical('a'));
            const s2 = canonicalReducer(s1, moveDown(0));
            const s3 = canonicalReducer(s2, undo());
            expect(s3.value).toBe('a');
        });

        it('does nothing when history is empty', () => {
            const s = canonicalReducer(initial, undo());
            expect(s.value).toBe('');
        });

        it('can undo multiple times', () => {
            const s1 = canonicalReducer(initial, setCanonical('a'));
            const s2 = canonicalReducer(s1, setCanonical('b'));
            const s3 = canonicalReducer(s2, undo());
            const s4 = canonicalReducer(s3, undo());
            const s5 = canonicalReducer(s4, undo());
            expect(s5.value).toBe('');
        });

        it('undo through transposeAll restores key', () => {
            const s1 = canonicalReducer(initial, setCanonical('[Am]love'));
            const keyBefore = s1.key;
            const s2 = canonicalReducer(s1, transposeAll(1));
            const s3 = canonicalReducer(s2, undo());
            expect(s3.key).toBe(keyBefore);
        });
    });

    describe('setSelected / clearSelected', () => {
        it('sets from on first selection', () => {
            const s = canonicalReducer(initial, setSelected(3));
            expect(s.selected).toEqual({ from: 3 });
        });

        it('sets range when second selection differs', () => {
            const s1 = canonicalReducer(initial, setSelected(1));
            const s2 = canonicalReducer(s1, setSelected(3));
            expect(s2.selected).toEqual({ from: 1, to: 3 });
        });

        it('clears selection', () => {
            const s1 = canonicalReducer(initial, setSelected(1));
            const s2 = canonicalReducer(s1, clearSelected());
            expect(s2.selected).toEqual({});
        });
    });
});
