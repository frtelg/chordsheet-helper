import isChordsOnly from '../chord/isChordsOnly';

const parseChordsAndSongText = (
    firstEntry: string,
    dispatchSongText: (v: string) => void,
    dispatchChords: (v: string[]) => void
) => {
    const inputLines = firstEntry.split('\n');
    const chords: string[] = [];
    const lyrics: string[] = [];

    let i = 0;
    while (i < inputLines.length) {
        const line = inputLines[i];

        if (isChordsOnly(line)) {
            const nextLine = inputLines[i + 1];
            chords.push(line);

            if (!nextLine || isChordsOnly(nextLine)) {
                // Instrumental: chord row not immediately followed by a lyric
                lyrics.push('');
                i++;
            } else {
                // Normal: chord row immediately above a lyric line
                lyrics.push(nextLine);
                i += 2;
            }
        } else {
            // Pure lyric line with no chord directly above it
            chords.push('');
            lyrics.push(line);
            i++;
        }
    }

    dispatchSongText(lyrics.join('\n'));
    dispatchChords(chords);
};

export default parseChordsAndSongText;
