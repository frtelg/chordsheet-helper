import React, { FunctionComponent } from 'react';
import Input from '../../../Components/Form/Input';
import copy from 'copy-to-clipboard';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { mdiContentCopy, mdiChevronTripleUp, mdiChevronTripleDown } from '@mdi/js';
import { moveDown, moveUp } from '../../../Redux/Reducer/ChordSheetReducer';
import ClickableIcon from '../../../Components/ClickableIcon';

type ChordSheetRowProps = {
    index: number;
    onChordInputBlur(e: React.FocusEvent<HTMLInputElement>): void;
    onLyricInputBlur(e: React.FocusEvent<HTMLInputElement>): void;
    enableEditLyrics: boolean;
};
const ChordSheetRow: FunctionComponent<ChordSheetRowProps> = ({
    index,
    onChordInputBlur,
    onLyricInputBlur,
    enableEditLyrics,
}) => {
    const chordSheet = useSelector((state: ReduxState) => state.chordSheet.value);
    const lyrics = useSelector((state: ReduxState) => state.songText.value);
    const { getState } = useStore<ReduxState>();
    const dispatch = useDispatch();

    const getChordValue = () => getState().chordSheet.value[index];

    const initialLyricValue = lyrics.split('\n')[index];

    return (
        <div className="SongTextRowContainer">
            <div className="ChordInputContainer">
                <Input
                    className="ChordInput"
                    initialValue={chordSheet[index]}
                    onBlur={onChordInputBlur}
                    placeholder="Enter chords..."
                />
                <div style={{ marginLeft: '1rem' }}>
                    <ClickableIcon
                        path={mdiContentCopy}
                        size="1rem"
                        onClick={() => copy(getChordValue())}
                        title="Copy chords"
                    />
                    <ClickableIcon
                        path={mdiChevronTripleDown}
                        size="1rem"
                        onClick={() => dispatch(moveDown(index))}
                        title="Move down from here"
                    />
                    <ClickableIcon
                        path={mdiChevronTripleUp}
                        size="1rem"
                        onClick={() => dispatch(moveUp(index))}
                        title="Move up from here"
                    />
                </div>
            </div>
            <div className="LyricInputContainer">
                {(initialLyricValue || '').trim() !== '' && (
                    <Input
                        initialValue={initialLyricValue}
                        onBlur={onLyricInputBlur}
                        disabled={!enableEditLyrics}
                    />
                )}
            </div>
        </div>
    );
};

export default ChordSheetRow;
