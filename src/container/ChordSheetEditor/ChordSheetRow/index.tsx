import React, { FunctionComponent, useMemo, useState } from 'react';
import Input from '@/components/Form/Input';
import copy from 'copy-to-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import {
    mdiContentCopy,
    mdiChevronTripleUp,
    mdiChevronTripleDown,
    mdiCheckboxMarked,
    mdiCheckboxBlankOutline,
    mdiContentPaste,
} from '@mdi/js';
import { moveDown, moveUp, pasteSelected, setSelected } from '@/redux/reducer/CanonicalReducer';
import { selectRows, Row } from '@/redux/selectors/canonicalRows';
import ClickableIcon from '@/components/ClickableIcon';

type ChordSheetRowProps = {
    rowIndex: number;
    row: Row;
    onChordInputBlur(newChord: string): void;
    onLyricInputBlur(newLyric: string): void;
    enableEditLyrics: boolean;
};

const ChordSheetRow: FunctionComponent<ChordSheetRowProps> = ({
    rowIndex,
    row,
    onChordInputBlur,
    onLyricInputBlur,
    enableEditLyrics,
}) => {
    const [isHovering, setIsHovering] = useState(false);
    const selected = useSelector((state: RootState) => state.canonical.selected);
    const rows = useSelector(selectRows);
    const dispatch = useDispatch();

    const selectedRows = useMemo(() => {
        const { from, to } = selected;
        if (typeof from === 'undefined') return [];
        if (typeof to === 'undefined') return [from];
        return Array.from({ length: to - from + 1 }, (_, i) => from + i);
    }, [selected]);

    const showPaste = selectedRows.length > 0 && isHovering;
    const isSelected = selectedRows.includes(row.sourceLineIndex);
    const showSelect = isSelected || isHovering;

    const getPrevRowSourceLineIndex = (): number => {
        if (rowIndex <= 0) return -1;
        return rows[rowIndex - 1]?.sourceLineIndex ?? -1;
    };

    return (
        <div
            className="SongTextRowContainer"
            onMouseOver={() => setIsHovering(true)}
            onMouseOut={() => setIsHovering(false)}
        >
            <div className="ChordInputContainer">
                <Input
                    className="ChordInput"
                    initialValue={row.chord}
                    onBlur={(e) => onChordInputBlur(e.target.value)}
                    placeholder="Enter chords..."
                />
                <div style={{ marginLeft: '1rem' }}>
                    <ClickableIcon
                        path={mdiContentCopy}
                        onClick={() => copy(row.chord)}
                        title="Copy chords"
                    />
                    <ClickableIcon
                        path={mdiChevronTripleDown}
                        onClick={() => dispatch(moveDown(row.sourceLineIndex))}
                        title="Move down from here"
                    />
                    <ClickableIcon
                        path={mdiChevronTripleUp}
                        onClick={() => {
                            const prevIdx = getPrevRowSourceLineIndex();
                            if (prevIdx >= 0) dispatch(moveUp(row.sourceLineIndex));
                        }}
                        title="Move up from here"
                    />
                    {showSelect && (
                        <ClickableIcon
                            path={isSelected ? mdiCheckboxMarked : mdiCheckboxBlankOutline}
                            onClick={() => dispatch(setSelected(row.sourceLineIndex))}
                        />
                    )}
                    {showPaste && (
                        <ClickableIcon
                            path={mdiContentPaste}
                            onClick={() => dispatch(pasteSelected(row.sourceLineIndex))}
                        />
                    )}
                </div>
            </div>
            <div className="LyricInputContainer">
                {!row.isInstrumental && (
                    <Input
                        initialValue={row.lyric}
                        onBlur={(e) => onLyricInputBlur(e.target.value)}
                        disabled={!enableEditLyrics}
                    />
                )}
            </div>
        </div>
    );
};

export default ChordSheetRow;
