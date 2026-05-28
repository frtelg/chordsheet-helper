import { applySelection, selectAll, clearSelection, SelectedChordRows } from './SelectedChordRows';

const empty: SelectedChordRows = { anchor: undefined, indexes: [] };

describe('applySelection — single mode', () => {
    it('empty → selects single row', () => {
        expect(applySelection(empty, { index: 1, mode: 'single' })).toEqual({ anchor: 1, indexes: [1] });
    });

    it('existing selection → selects only the clicked row', () => {
        const s = { anchor: 2, indexes: [2, 3, 4] };
        expect(applySelection(s, { index: 1, mode: 'single' })).toEqual({ anchor: 1, indexes: [1] });
    });

    it('click same single row → clears', () => {
        const s = { anchor: 3, indexes: [3] };
        expect(applySelection(s, { index: 3, mode: 'single' })).toEqual({ anchor: undefined, indexes: [] });
    });

    it('click different row from single → replaces selection', () => {
        const s = { anchor: 1, indexes: [1] };
        expect(applySelection(s, { index: 5, mode: 'single' })).toEqual({ anchor: 5, indexes: [5] });
    });
});

describe('applySelection — range mode', () => {
    it('extend from anchor forward', () => {
        const s = { anchor: 1, indexes: [1] };
        expect(applySelection(s, { index: 4, mode: 'range' })).toEqual({ anchor: 1, indexes: [1, 2, 3, 4] });
    });

    it('extend from anchor backward', () => {
        const s = { anchor: 4, indexes: [4] };
        expect(applySelection(s, { index: 1, mode: 'range' })).toEqual({ anchor: 4, indexes: [1, 2, 3, 4] });
    });

    it('extend existing range further', () => {
        const s = { anchor: 1, indexes: [1, 2, 3] };
        expect(applySelection(s, { index: 5, mode: 'range' })).toEqual({ anchor: 1, indexes: [1, 2, 3, 4, 5] });
    });

    it('collapse range toward anchor', () => {
        const s = { anchor: 1, indexes: [1, 2, 3, 4, 5] };
        expect(applySelection(s, { index: 3, mode: 'range' })).toEqual({ anchor: 1, indexes: [1, 2, 3] });
    });

    it('no anchor → uses index as both anchor and end', () => {
        expect(applySelection(empty, { index: 3, mode: 'range' })).toEqual({ anchor: 3, indexes: [3] });
    });
});

describe('applySelection — toggle mode', () => {
    it('empty → adds single row', () => {
        expect(applySelection(empty, { index: 2, mode: 'toggle' })).toEqual({ anchor: 2, indexes: [2] });
    });

    it('adds non-contiguous row', () => {
        const s = { anchor: 1, indexes: [1, 2, 3] };
        expect(applySelection(s, { index: 5, mode: 'toggle' })).toEqual({ anchor: 5, indexes: [1, 2, 3, 5] });
    });

    it('removes existing row', () => {
        const s = { anchor: 3, indexes: [1, 2, 3, 5] };
        expect(applySelection(s, { index: 3, mode: 'toggle' })).toEqual({ anchor: 3, indexes: [1, 2, 5] });
    });

    it('removes last row → empty indexes', () => {
        const s = { anchor: 1, indexes: [1] };
        expect(applySelection(s, { index: 1, mode: 'toggle' })).toEqual({ anchor: 1, indexes: [] });
    });

    it('maintains sorted order after add', () => {
        const s = { anchor: 5, indexes: [5] };
        expect(applySelection(s, { index: 2, mode: 'toggle' })).toEqual({ anchor: 2, indexes: [2, 5] });
    });
});

describe('selectAll', () => {
    it('selects all rows from 0 to rowCount-1', () => {
        expect(selectAll(3)).toEqual({ anchor: 0, indexes: [0, 1, 2] });
    });

    it('rowCount 0 → empty indexes', () => {
        expect(selectAll(0)).toEqual({ anchor: 0, indexes: [] });
    });
});

describe('clearSelection', () => {
    it('returns empty state', () => {
        expect(clearSelection()).toEqual({ anchor: undefined, indexes: [] });
    });
});
