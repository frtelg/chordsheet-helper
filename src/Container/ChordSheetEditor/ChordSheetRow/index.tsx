import React, { FunctionComponent, useMemo, useState } from 'react';
import Input from '../../../Components/Form/Input';
import copy from 'copy-to-clipboard';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
    mdiContentCopy,
    mdiChevronTripleUp,
    mdiChevronTripleDown,
    mdiCheckboxMarked,
    mdiCheckboxBlankOutline,
    mdiContentPaste,
} from '@mdi/js';
import {
    moveDown,
    moveUp,
    pasteSelected,
    setSelected,
} from '../../../Redux/Reducer/ChordSheetReducer';
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
    const [isHovering, setIsHovering] = useState(false);
    const chordSheet = useSelector((state: ReduxState) => state.chordSheet.value);
    const lyrics = useSelector((state: ReduxState) => state.songText.value);
    const selected = useSelector((state: ReduxState) => state.chordSheet.selected);
    const { getState } = useStore<ReduxState>();
    const dispatch = useDispatch();
    const handleMouseOver = () => {
        setIsHovering(true);
    };

    const handleMouseOut = () => {
        setIsHovering(false);
    };

    const getChordValue = () => getState().chordSheet.value[index];
    const selectedRows = useMemo(() => {
        const { from, to } = selected;
        if (typeof from === 'undefined') return [];
        if (!to) return [from];

        return Array.from({ length: to - from + 1 }, (_v, i) => from + i);
    }, [selected]);
    const showPaste = selectedRows.length > 0 && isHovering;
    const isSelected = selectedRows.includes(index);
    const showSelect = isSelected || isHovering;

    const initialLyricValue = lyrics.split('\n')[index];

    return (
        <div
            className="SongTextRowContainer"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
        >
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
                        onClick={() => copy(getChordValue())}
                        title="Copy chords"
                    />
                    <ClickableIcon
                        path={mdiChevronTripleDown}
                        onClick={() => dispatch(moveDown(index))}
                        title="Move down from here"
                    />
                    <ClickableIcon
                        path={mdiChevronTripleUp}
                        onClick={() => dispatch(moveUp(index))}
                        title="Move up from here"
                    />
                    {showSelect && (
                        <ClickableIcon
                            path={isSelected ? mdiCheckboxMarked : mdiCheckboxBlankOutline}
                            onClick={() => dispatch(setSelected(index))}
                        />
                    )}
                    {showPaste && (
                        <ClickableIcon
                            path={mdiContentPaste}
                            onClick={() => dispatch(pasteSelected(index))}
                        />
                    )}
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
