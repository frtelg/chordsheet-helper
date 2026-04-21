import React, { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleShowResult } from '@/redux/reducer/AppReducer';
import { replaceLine } from '@/redux/reducer/CanonicalReducer';
import { selectRows } from '@/redux/selectors/canonicalRows';
import { formatBracketedLine } from '@/lib/onsong/bracketedFormatter';
import ChordSheetRow from '@/container/ChordSheetEditor/ChordSheetRow';
import Transposer from '@/container/ChordSheetEditor/Transposer';
import HelpersBar from './HelpersBar';
import Icon from '@mdi/react';
import { mdiMusicNote } from '@mdi/js';

const ChordSheetEditor: FunctionComponent = () => {
    const rows = useSelector(selectRows);
    const dispatch = useDispatch();
    const [editLyricsToggled, setEditLyricsToggled] = React.useState(false);

    const toggeEditLyrics = () => setEditLyricsToggled((v) => !v);

    const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(toggleShowResult());
    };

    const onChordInputBlurHandler = (newChord: string, row: (typeof rows)[number]) => {
        dispatch(
            replaceLine({
                lineIndex: row.sourceLineIndex,
                newLine: formatBracketedLine(newChord, row.lyric),
            })
        );
    };

    const onLyricInputBlurHandler = (newLyric: string, row: (typeof rows)[number]) => {
        dispatch(
            replaceLine({
                lineIndex: row.sourceLineIndex,
                newLine: formatBracketedLine(row.chord, newLyric),
            })
        );
    };

    if (rows.length === 0) {
        return (
            <div className="ChordSheetEditor EmptyState">
                <Icon path={mdiMusicNote} size="3rem" color="var(--color-border)" />
                <h2 className="EmptyStateTitle">Your chord sheet will appear here</h2>
                <p className="EmptyStateDescription">
                    Paste or type your song lyrics on the left to get started. Each line becomes a
                    chord+lyric row you can edit and transpose.
                </p>
            </div>
        );
    }

    return (
        <div className="ChordSheetEditor">
            <div className="FixedHeader">
                <HelpersBar
                    editLyricsToggled={editLyricsToggled}
                    toggeEditLyrics={toggeEditLyrics}
                />
                <Transposer />
            </div>
            <div className="ChordSheetFormContainer">
                <form onSubmit={submitHandler}>
                    {rows.map((row, i) => (
                        <ChordSheetRow
                            key={`${row.sourceLineIndex}-${row.chord}-${row.lyric}`}
                            rowIndex={i}
                            row={row}
                            onChordInputBlur={(newChord) => onChordInputBlurHandler(newChord, row)}
                            onLyricInputBlur={(newLyric) => onLyricInputBlurHandler(newLyric, row)}
                            enableEditLyrics={editLyricsToggled}
                        />
                    ))}
                    <button type="submit" className="btn-primary">
                        Submit changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChordSheetEditor;
