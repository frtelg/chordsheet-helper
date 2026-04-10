import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DownloadTextAsFileLink from '@/components/DownloadTextAsFileLink';
import { toggleShowResult, setOnsongFormat } from '@/redux/reducer/AppReducer';
import { formatChordSheet } from '@/lib/onsong/formatChordSheet';

type ChordSheetLine = {
    text: string;
    lineType: 'chord' | 'text';
};

const ChordSheetResult = () => {
    const songText = useSelector((state: RootState) => state.songText.value);
    const { value: chords, key } = useSelector((state: RootState) => state.chordSheet);
    const onsongFormat = useSelector((state: RootState) => state.app.onsongFormat);

    const dispatch = useDispatch();

    const doToggleEditMode = () => {
        dispatch(toggleShowResult());
    };

    const onFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setOnsongFormat(e.target.checked ? 'bracketed' : 'chords-over-lyrics'));
    };

    const songLines = songText.split('\n');
    const chordLines = songLines.map((_: string, i: number) => `${chords[i] || ''}`);

    // Download text — always built from the full row set so blank-line logic is correct
    const downloadText = formatChordSheet(onsongFormat, chordLines, songLines);

    // Preview list — bracketed reuses downloadText (already multi-row aware).
    // chords-over-lyrics rebuilds with typed entries using the same blank-line logic
    // as formatChordSheet so the preview matches the download exactly.
    let chordSheetList: ChordSheetLine[];

    if (onsongFormat === 'bracketed') {
        chordSheetList = downloadText
            .split('\n')
            .map((line) => ({ text: line, lineType: 'text' as const }));
    } else {
        const list: ChordSheetLine[] = [];
        let prevInstrumental = false;

        for (let i = 0; i < songLines.length; i++) {
            const chordLine = chordLines[i];
            const lyricLine = songLines[i];
            const hasChords = chordLine.trim() !== '';
            const instrumental = hasChords && lyricLine.trim() === '';
            const enteringInstrumental =
                instrumental && !prevInstrumental && i > 0 && list.length > 0;

            if (hasChords) {
                if (instrumental && prevInstrumental) {
                    while (list.length > 0 && list[list.length - 1].text === '') {
                        list.pop();
                    }
                } else if (enteringInstrumental) {
                    list.push({ text: '', lineType: 'text' });
                }
                list.push({ text: chordLine, lineType: 'chord' });
                list.push({ text: lyricLine, lineType: 'text' });
            } else {
                list.push({ text: lyricLine, lineType: 'text' });
            }

            prevInstrumental = instrumental;
        }

        while (list.length > 0 && list[list.length - 1].text === '') {
            list.pop();
        }

        chordSheetList = list;
    }

    const getTextFileName = () =>
        `${songText.split('\n').filter((l: string) => l.trim() !== '')[0]}.txt`;

    return (
        <div className="ChordSheetResult">
            <div className="ChordSheetText" style={{ whiteSpace: 'pre' }}>
                <span className="ResultKey">{`Key: ${key ?? 'Unknown'}`}</span>
                {'\n\n'}
                {chordSheetList.map((r, i) => (
                    <React.Fragment key={i}>
                        {r.lineType === 'chord' ? <b>{r.text}</b> : r.text}
                        {'\n'}
                    </React.Fragment>
                ))}
            </div>
            <div className="ResultButtons">
                <button onClick={doToggleEditMode}>Edit</button>
                <label className="FormatToggle">
                    <input
                        type="checkbox"
                        checked={onsongFormat === 'bracketed'}
                        onChange={onFormatChange}
                    />
                    {' Bracketed chords'}
                </label>
                <DownloadTextAsFileLink fileName={getTextFileName()} text={downloadText} />
            </div>
        </div>
    );
};

export default ChordSheetResult;
