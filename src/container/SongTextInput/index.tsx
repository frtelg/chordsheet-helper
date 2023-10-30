import React, { FunctionComponent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetChords, setChords } from '@/redux/reducer/ChordSheetReducer';
import { resetSongText, setSongText } from '@/redux/reducer/SongTextReducer';
import isChordsOnly from '@/lib/chord/isChordsOnly';
import ProcessChordLinesModal from './ProcessChordLinesModal';
import parseChordsAndSongText from '@/lib/songTextChordsSeparator';

const doesInputHaveChordLines = (v: string) => {
    return !!v.split('\n').find((line) => isChordsOnly(line));
};

const doesInputHaveMultipleLines = (v: string) => {
    return v.split('\n').length > 1;
};

const SongTextInput: FunctionComponent = () => {
    const [touched, setTouched] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [firstEntry, setFirstEntry] = useState('');

    const inputText = useSelector((state: ReduxState) => state.songText.value);
    const dispatch = useDispatch();

    const dispatchSongText = (text: string) => {
        dispatch(setSongText(text));
    };

    const dispatchChords = (chords: string[]) => {
        dispatch(setChords(chords));
    };

    const changedHandlerHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.preventDefault();

        if (e.target.value === '') {
            setTouched(false);
            setFirstEntry('');
            dispatchSongText(e.target.value);
        } else {
            handleInput(e.target.value);
        }
    };

    const handleInput = (v: string) => {
        if (!touched) {
            setTouched(true);

            if (doesInputHaveChordLines(v) && doesInputHaveMultipleLines(v)) {
                setFirstEntry(v);
                setShowModal(true);
                return;
            }
        }

        dispatchSongText(v);
    };

    const parseChordsAndSongTextHandler = () => () =>
        parseChordsAndSongText(firstEntry, dispatchSongText, dispatchChords);

    const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            dispatchSongText(e.currentTarget.value + '    ');
        }
    };

    const handleReset = () => {
        dispatch(resetSongText());
        dispatch(resetChords());
        setTouched(false);
    };

    return (
        <div className="SongTextInput">
            <ProcessChordLinesModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    dispatchSongText(firstEntry);
                }}
                processChordLines={() => {
                    setShowModal(false);
                    parseChordsAndSongTextHandler();
                }}
            />
            <textarea
                value={inputText}
                onChange={changedHandlerHandler}
                onKeyDown={handleTab}
                placeholder="Enter or paste song lyrics here"
            />
            <button
                type="button"
                onClick={() => navigator.clipboard.readText().then(dispatchSongText)}
            >
                Paste from clipboard
            </button>
            <button type="button" onClick={handleReset}>
                Reset
            </button>
        </div>
    );
};

export default SongTextInput;
