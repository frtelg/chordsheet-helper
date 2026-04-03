// A song with interleaved chord and lyric lines — triggers ProcessChordLinesModal.
// The chord lines use multiple spaces to position chords above specific syllables.
export const SONG_WITH_CHORDS = [
    'G           D        Em     C',
    'Amazing grace how sweet the sound',
    'G           D        G',
    'That saved a wretch like me',
].join('\n');

// Expected chord strings after accepting chord extraction (spacing must be preserved)
export const EXTRACTED_CHORD_ROW_0 = 'G           D        Em     C';
export const EXTRACTED_CHORD_ROW_1 = 'G           D        G';

// Expected lyric lines after chord extraction
export const EXTRACTED_LYRIC_0 = 'Amazing grace how sweet the sound';
export const EXTRACTED_LYRIC_1 = 'That saved a wretch like me';

// Expected key for G, D, Em, C → G major
export const EXPECTED_KEY_AFTER_EXTRACTION = 'G';

// Plain lyrics only — no chord-only lines, no modal triggered
export const SONG_WITHOUT_CHORDS = [
    'Amazing grace how sweet the sound',
    'That saved a wretch like me',
].join('\n');

// Single lyric line — used for transpose/undo tests to avoid an app bug where
// new Array(n).map() creates undefined holes in the chords array when n > 1.
export const SINGLE_LINE_LYRICS = 'Amazing grace how sweet the sound';

// Chords for transpose test: C  F  G → C major key.
// After transposing up 1 semitone the key becomes Db (which uses sharps),
// so the app converts Db/Gb/Ab → C#/F#/G#.
export const TRANSPOSE_CHORDS = 'C  F  G';
export const TRANSPOSE_CHORDS_UP_1 = 'C#  F#  G#';
export const TRANSPOSE_EXPECTED_KEY = 'C';

// Chords for undo test: Am  F  C  G → C major.
// After transposing up 1 the key becomes Db (uses sharps),
// so Bbm/Gb/Db/Ab → A#m/F#/C#/G#.
export const UNDO_CHORDS = 'Am  F  C  G';
export const UNDO_CHORDS_TRANSPOSED = 'A#m  F#  C#  G#';
export const UNDO_EXPECTED_KEY = 'C';
