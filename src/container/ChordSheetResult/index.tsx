import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DownloadTextAsFileLink from '@/components/DownloadTextAsFileLink';
import { toggleShowResult, setOnsongFormat } from '@/redux/reducer/AppReducer';
import { formatChordSheet } from '@/lib/onsong/formatChordSheet';
import { selectRows } from '@/redux/selectors/canonicalRows';

type ChordSheetLine = {
    text: string;
    lineType: 'chord' | 'text';
};

const ChordSheetResult = () => {
    const canonical = useSelector((state: RootState) => state.canonical.value);
    const key = useSelector((state: RootState) => state.canonical.key);
    const rows = useSelector(selectRows);
    const onsongFormat = useSelector((state: RootState) => state.app.onsongFormat);
    const dispatch = useDispatch();

    const doToggleEditMode = () => dispatch(toggleShowResult());

    const onFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setOnsongFormat(e.target.checked ? 'bracketed' : 'chords-over-lyrics'));
    };

    const chords = rows.map((r) => r.chord);
    const songLines = rows.map((r) => r.lyric);

    const downloadText =
        onsongFormat === 'bracketed'
            ? canonical
            : formatChordSheet('chords-over-lyrics', chords, songLines);

    let chordSheetList: ChordSheetLine[];

    if (onsongFormat === 'bracketed') {
        chordSheetList = canonical
            .split('\n')
            .map((line) => ({ text: line, lineType: 'text' as const }));
    } else {
        const list: ChordSheetLine[] = [];
        let prevInstrumental = false;

        for (let i = 0; i < rows.length; i++) {
            const chordLine = chords[i];
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

    const getTextFileName = () => {
        const firstLyric = rows.find((r) => r.lyric.trim() !== '')?.lyric ?? 'chordsheet';
        return `${firstLyric}.txt`;
    };

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
