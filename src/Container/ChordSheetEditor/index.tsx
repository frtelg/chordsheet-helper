import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleShowResult } from '../../redux/reducer/AppReducer';
import { setChords } from '../../redux/reducer/ChordSheetReducer';
import { setSongText } from '../../redux/reducer/SongTextReducer';
import ChordSheetRow from '../../container/ChordSheetEditor/ChordSheetRow';
import Transposer from '../../container/ChordSheetEditor/Transposer';
import HelpersBar from './HelpersBar';

const toSongTextArray = (text: string) => text.split('\n');

const SongTextInput: FunctionComponent = () => {
    const songText = useSelector((state: ReduxState) => state.songText.value || '');
    const chords = useSelector((state: ReduxState) => state.chordSheet.value);
    const dispatch = useDispatch();
    const [instrumentalPartsIndexes, setInstrumentalPartIndexes] = useState<number[]>([]);
    const [songTextArray, setSongTextArray] = useState(toSongTextArray(songText));
    const [editLyricsToggled, setEditLyricsToggled] = React.useState(false);

    const toggeEditLyrics = () => {
        setEditLyricsToggled(!editLyricsToggled);
    };

    useEffect(() => {
        const songTextAsArray = toSongTextArray(songText);
        setSongTextArray(songTextAsArray);
        if (songTextAsArray.length > chords.length) {
            const newChords = [
                ...chords,
                ...new Array<string>(songTextAsArray.length - chords.length).map(() => ''),
            ];
            dispatch(setChords(newChords));
        }
    }, [songText]);

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
        const newChords = chords.map((v: string, i: number) => (i === lineIndex ? newValue : v));
        dispatch(setChords(newChords));
    };

    const hideChordsForEmptyLine = (lineIndex: number) =>
        instrumentalPartsIndexes.indexOf(lineIndex) === -1;

    const noSongTextSupplied = songTextArray.filter((t) => t.trim() !== '').length === 0;

    if (noSongTextSupplied) return null;

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
                    <button type="submit">Submit changes</button>
                </form>
            </div>
        </div>
    );
};

export default SongTextInput;
