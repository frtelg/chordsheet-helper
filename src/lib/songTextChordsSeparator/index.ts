import isChordsOnly from '../chord/isChordsOnly';

const parseChordsAndSongText = (
    firstEntry: string,
    dispatchSongText: (v: string) => void,
    dispatchChords: (v: string[]) => void
) => {
    const inputLines = firstEntry.split('\n');
    const songText = inputLines
        .reduce((acc: string[], curr: string, i: number) => {
            const previousLine = i === 0 ? undefined : inputLines[i - 1];

            if (isChordsOnly(curr)) {
                return isChordsOnly(previousLine ?? '') ? [...acc, ''] : acc;
            }

            return [...acc, curr];
        }, [])
        .join('\n');

    dispatchSongText(songText);

    const isNonChordsRow = (s: string) => !isChordsOnly(s);

    const chords = inputLines.reduce((acc: string[], curr: string, i: number) => {
        const previousLine = i === 0 ? undefined : inputLines[i - 1];

        if (isNonChordsRow(curr)) {
            return isNonChordsRow(previousLine ?? '') ? [...acc, ''] : acc;
        }

        return [...acc, curr];
    }, []);

    dispatchChords(chords);
};

export default parseChordsAndSongText;
