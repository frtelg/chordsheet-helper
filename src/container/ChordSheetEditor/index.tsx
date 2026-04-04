import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleShowResult } from '@/redux/reducer/AppReducer';
import { setChords } from '@/redux/reducer/ChordSheetReducer';
import { setSongText } from '@/redux/reducer/SongTextReducer';
import ChordSheetRow from '@/container/ChordSheetEditor/ChordSheetRow';
import Transposer from '@/container/ChordSheetEditor/Transposer';
import HelpersBar from './HelpersBar';
import Icon from '@mdi/react';
import { mdiMusicNote } from '@mdi/js';

const toSongTextArray = (text: string) => text.split('\n');

const SongTextInput: FunctionComponent = () => {
    const songText = useSelector((state: ReduxState) => state.songText.value || '');
    const chords = useSelector((state: ReduxState) => state.chordSheet.value);
    const dispatch = useDispatch();
    const [instrumentalPartsIndexes, setInstrumentalPartIndexes] = useState<number[]>([]);
    const [editLyricsToggled, setEditLyricsToggled] = React.useState(false);
    const songTextArray = toSongTextArray(songText);

    const toggeEditLyrics = () => {
        setEditLyricsToggled(!editLyricsToggled);
    };

    useEffect(() => {
        if (songTextArray.length > chords.length) {
            const newChords = [
                ...chords,
                ...new Array<string>(songTextArray.length - chords.length).fill(''),
            ];
            dispatch(setChords(newChords));
        }
    }, [chords, dispatch, songTextArray]);

    const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(toggleShowResult());
    };

    const onSongTextInputBlurHandler = (e: React.FocusEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        const oldSongTextArray = [...toSongTextArray(songText)];
        const newSongTextArray = oldSongTextArray.map((r, i) => (i === index ? value : r));
        const newSongText = newSongTextArray.join('\n');

        dispatch(setSongText(newSongText));
    };

    const onChordInputBlurHandler = (newValue: string, lineIndex: number) => {
        const newChords = chords.map((v, i) => (i === lineIndex ? newValue : v));
        dispatch(setChords(newChords));
    };

    const hideChordsForEmptyLine = (lineIndex: number) =>
        instrumentalPartsIndexes.indexOf(lineIndex) === -1;

    const noSongTextSupplied = songTextArray.filter((t) => t.trim() !== '').length === 0;

    if (noSongTextSupplied) {
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
                    {songTextArray.map((r, i) =>
                        r.trim() === '' &&
                        hideChordsForEmptyLine(i) &&
                        (chords[i] === '' || !chords[i]) ? (
                            <React.Fragment key={i}>
                                <a
                                    onClick={() =>
                                        setInstrumentalPartIndexes([...instrumentalPartsIndexes, i])
                                    }
                                >
                                    Add row for instrumental part
                                </a>
                                <br />
                            </React.Fragment>
                        ) : (
                            <ChordSheetRow
                                key={i}
                                index={i}
                                onChordInputBlur={(e) => onChordInputBlurHandler(e.target.value, i)}
                                onLyricInputBlur={(e) => onSongTextInputBlurHandler(e, i)}
                                enableEditLyrics={editLyricsToggled}
                            />
                        )
                    )}
                    <button type="submit" className="btn-primary">
                        Submit changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SongTextInput;
