import chordSheetReducer, {
    setChords,
    transposeAll,
    resetChords,
    moveUp,
    moveDown,
    undo,
    setSelected,
    clearSelected,
    pasteSelected,
} from './ChordSheetReducer';

describe('ChordSheetReducer', () => {
    const initialState = {
        value: [],
        history: [],
        selected: {},
        key: undefined,
    };

    it('should handle setChords', () => {
        const chords = ['C', 'G', 'Am'];
        const nextState = chordSheetReducer(initialState, setChords(chords));
        expect(nextState.value).toEqual(chords);
    });

    it('should handle transposeAll', () => {
        const chords = ['C', 'G', 'Am'];
        const transposeAmount = 2;
        const nextState = chordSheetReducer(initialState, setChords(chords));
        const transposedState = chordSheetReducer(nextState, transposeAll(transposeAmount));
        expect(transposedState.value).toEqual(['D', 'A', 'Bm']);
    });

    it('should handle resetChords', () => {
        const chords = ['C', 'G', 'Am'];
        const nextState = chordSheetReducer(initialState, setChords(chords));
        const resetState = chordSheetReducer(nextState, resetChords());
        expect(resetState.value).toEqual([]);
    });

    it('should handle moveUp', () => {
        const chords = ['C', 'G', 'Am'];
        const nextState = chordSheetReducer(initialState, setChords(chords));
        const movedState = chordSheetReducer(nextState, moveUp(1));
        expect(movedState.value).toEqual(['G', 'Am']);
    });

    it('should handle moveDown', () => {
        const chords = ['C', 'G', 'Am'];
        const nextState = chordSheetReducer(initialState, setChords(chords));
        const movedState = chordSheetReducer(nextState, moveDown(1));
        expect(movedState.value).toEqual(['C', '', 'G', 'Am']);
    });

    it('should handle undo', () => {
        const chords = ['C', 'G', 'Am'];
        const nextState = chordSheetReducer(initialState, setChords(chords));
        const movedState = chordSheetReducer(nextState, moveDown(1));
        const undoState = chordSheetReducer(movedState, undo());
        expect(undoState.value).toEqual(chords);
    });

    it('should handle setSelected', () => {
        const chords = ['C', 'G', 'Am'];
        const nextState = chordSheetReducer(initialState, setChords(chords));
        const selectedState = chordSheetReducer(nextState, setSelected(1));
        expect(selectedState.selected).toEqual({ from: 1 });
    });

    it('should handle clearSelected', () => {
        const chords = ['C', 'G', 'Am'];
        const nextState = chordSheetReducer(initialState, setChords(chords));
        const selectedState = chordSheetReducer(nextState, setSelected(1));
        const clearedState = chordSheetReducer(selectedState, clearSelected());
        expect(clearedState.selected).toEqual({});
    });

    it('should handle pasteSelected', () => {
        const chords = ['C', 'G', 'Am'];
        const nextState = chordSheetReducer(initialState, setChords(chords));
        const selectedState = chordSheetReducer(nextState, setSelected(1));
        const pastedState = chordSheetReducer(selectedState, pasteSelected(2));
        expect(pastedState.value).toEqual(['C', 'G', 'G']);
    });
});
