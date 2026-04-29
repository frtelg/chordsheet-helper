import { createSelector } from '@reduxjs/toolkit';
import { parseCanonical, Row } from '@/lib/onsong/bracketedParser';
import { parseChords } from '@/lib/chord/parseChord';
import findKey from '@/lib/key/findKey';

export type { Row };

const selectCanonicalValue = (state: RootState) => state.canonical.value;

export const selectRows = createSelector(selectCanonicalValue, parseCanonical);

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
