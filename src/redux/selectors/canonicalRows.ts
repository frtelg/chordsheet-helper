import { createSelector } from '@reduxjs/toolkit';
import { parseCanonical, Row } from '@/lib/onsong/bracketedParser';
import { parseChords } from '@/lib/chord/parseChord';
import findKey from '@/lib/key/findKey';

export type { Row };

const selectCanonicalValue = (state: RootState) => state.canonical.value;
const selectLineIds = (state: RootState) => state.canonical.lineIds;

/** Rows derived from the canonical string, with stable ids merged in from state. */
export const selectRows = createSelector(
    selectCanonicalValue,
    selectLineIds,
    (value, lineIds): Row[] => {
        const rows = parseCanonical(value);
        return rows.map((row) => ({
            ...row,
            id: lineIds[row.sourceLineIndex] ?? row.id,
        }));
    }
);

export const selectChordTokens = createSelector(selectRows, (rows) =>
    rows.flatMap((r) => {
        if (!r.chord) return [];
        return r.chord
            .split(/\s+/)
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
    })
);

export const selectKey = createSelector(selectCanonicalValue, (value) => {
    const bracketMatches = value.match(/\[([^\]]+)\]/g) ?? [];
    if (bracketMatches.length === 0) return undefined;
    const chordStrings = bracketMatches.map((b) => b.slice(1, -1)).join(' ');
    const chords = parseChords(chordStrings);
    return findKey(chords);
});
