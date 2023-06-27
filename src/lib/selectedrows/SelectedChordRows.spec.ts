import { determineSelectedRows } from './SelectedChordRows';

it.each([
    [{}, 1, { from: 1 }],
    [{}, 5, { from: 5 }],
    [{ from: 1 }, 1, {}],
    [{ from: 1 }, 5, { from: 1, to: 5 }],
    [{ from: 0 }, 5, { from: 0, to: 5 }],
    [{ from: 1, to: 5 }, 1, { from: 2, to: 5 }],
    [{ from: 1, to: 5 }, 5, { from: 1, to: 4 }],
    [{ from: 1, to: 5 }, 3, { from: 1, to: 2 }],
    [{ from: 1, to: 2 }, 2, { from: 1, to: 1 }],
    [{ from: 1, to: 1 }, 1, {}],
])('should process %p, add selected Number %d and return %p', (input, selectedNumber, output) => {
    expect(determineSelectedRows(input, selectedNumber)).toEqual(output);
});