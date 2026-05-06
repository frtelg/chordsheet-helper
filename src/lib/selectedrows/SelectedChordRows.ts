export type SelectionMode = 'single' | 'range' | 'toggle';

export interface SelectedChordRows {
    anchor?: number;
    indexes: number[];
}

export interface SelectionPayload {
    index: number;
    mode: SelectionMode;
}

export function applySelection(
    state: SelectedChordRows,
    { index, mode }: SelectionPayload
): SelectedChordRows {
    switch (mode) {
        case 'single': {
            // Click same single row → clear
            if (state.indexes.length === 1 && state.indexes[0] === index) {
                return { anchor: undefined, indexes: [] };
            }
            return { anchor: index, indexes: [index] };
        }

        case 'range': {
            // Shift+click: extend from anchor to index
            const anchor = state.anchor ?? index;
            const min = Math.min(anchor, index);
            const max = Math.max(anchor, index);
            const indexes = Array.from({ length: max - min + 1 }, (_, i) => min + i);
            return { anchor, indexes };
        }

        case 'toggle': {
            // Cmd/Ctrl+click: add or remove individual index
            const exists = state.indexes.includes(index);
            const indexes = exists
                ? state.indexes.filter((i) => i !== index)
                : [...state.indexes, index].sort((a, b) => a - b);
            return { anchor: index, indexes };
        }
    }
}

export function selectAll(rowCount: number): SelectedChordRows {
    return {
        anchor: 0,
        indexes: Array.from({ length: rowCount }, (_, i) => i),
    };
}

export function clearSelection(): SelectedChordRows {
    return { anchor: undefined, indexes: [] };
}
