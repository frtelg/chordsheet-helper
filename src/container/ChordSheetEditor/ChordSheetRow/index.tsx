import React, { FunctionComponent, useState } from 'react';
import Input from '@/components/Form/Input';
import copy from 'copy-to-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import {
    mdiDotsVertical,
    mdiContentCopy,
    mdiChevronTripleUp,
    mdiChevronTripleDown,
    mdiCheckboxMarked,
    mdiCheckboxBlankOutline,
    mdiContentPaste,
} from '@mdi/js';
import Icon from '@mdi/react';
import ClickableIcon from '@/components/ClickableIcon';
import { moveDown, moveUp, setSelected, clearChords } from '@/redux/reducer/CanonicalReducer';
import { pushToast } from '@/redux/reducer/ToastReducer';
import { selectRows, Row } from '@/redux/selectors/canonicalRows';

export type ChordSheetRowProps = {
    rowIndex: number;
    row: Row;
    isFocused: boolean;
    isNewUx: boolean;
    onChordInputBlur(newChord: string): void;
    onLyricInputBlur(newLyric: string): void;
    enableEditLyrics: boolean;
    onRowFocus(rowIndex: number): void;
    onRowHover(rowIndex: number | null): void;
};

const ChordSheetRow: FunctionComponent<ChordSheetRowProps> = ({
    rowIndex,
    row,
    isFocused,
    isNewUx,
    onChordInputBlur,
    onLyricInputBlur,
    enableEditLyrics,
    onRowFocus,
    onRowHover,
}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [kebabOpen, setKebabOpen] = useState(false);
    const dispatch = useDispatch();
    const selected = useSelector((state: RootState) => state.canonical.selected);
    const rows = useSelector(selectRows);

    const isSelected = selected.indexes.includes(row.sourceLineIndex);
    const showAffordances = isHovering || isFocused;

    const handleMoveUp = () => {
        dispatch(moveUp(row.sourceLineIndex));
        setKebabOpen(false);
    };

    const handleMoveDown = () => {
        dispatch(moveDown(row.sourceLineIndex));
        setKebabOpen(false);
    };

    const handleClearChord = () => {
        // Clear chord value from this row; select it first so clearChords knows the target
        dispatch(setSelected({ index: row.sourceLineIndex, mode: 'single' }));
        dispatch(clearChords());
        dispatch(pushToast({ message: 'Cleared 1 chord', showUndo: true }));
        setKebabOpen(false);
    };

    const handleCopyChordText = () => {
        copy(row.chord);
        setKebabOpen(false);
    };

    // ── New UX ──────────────────────────────────────────────────────────────
    if (isNewUx) {
        return (
            <div
                className={[
                    'SongTextRowContainer',
                    isSelected ? 'SongTextRowContainer--selected' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                role="option"
                aria-selected={isSelected}
                tabIndex={isFocused ? 0 : -1}
                onMouseEnter={() => {
                    setIsHovering(true);
                    onRowHover(rowIndex);
                }}
                onMouseLeave={() => {
                    setIsHovering(false);
                    onRowHover(null);
                }}
                onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === 'INPUT') return;
                    if ((e.target as HTMLElement).closest('.KebabMenu')) return;
                    const mode = e.shiftKey
                        ? 'range'
                        : e.metaKey || e.ctrlKey
                          ? 'toggle'
                          : 'single';
                    dispatch(setSelected({ index: row.sourceLineIndex, mode }));
                }}
                onFocus={() => onRowFocus(rowIndex)}
            >
                <div className="RowContent">
                    <div className="ChordInputContainer">
                        <Input
                            className="ChordInput"
                            initialValue={row.chord}
                            onBlur={(e) => onChordInputBlur(e.target.value)}
                            placeholder="Enter chords..."
                        />
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

                {/* Kebab menu */}
                <div
                    className={['KebabMenu', showAffordances ? 'KebabMenu--visible' : '']
                        .filter(Boolean)
                        .join(' ')}
                >
                    <button
                        type="button"
                        className="KebabTrigger"
                        aria-label="Row actions"
                        aria-expanded={kebabOpen}
                        onClick={(e) => {
                            e.stopPropagation();
                            setKebabOpen((v) => !v);
                        }}
                    >
                        <Icon path={mdiDotsVertical} size="1rem" color="var(--color-text)" />
                    </button>
                    {kebabOpen && (
                        <div
                            className="KebabDropdown"
                            role="menu"
                            onMouseLeave={() => setKebabOpen(false)}
                        >
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleMoveUp}
                                disabled={rowIndex === 0}
                            >
                                Move up
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleMoveDown}
                                disabled={rowIndex >= rows.length - 1}
                            >
                                Move down
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleClearChord}
                                disabled={!row.chord}
                            >
                                Clear chord
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleCopyChordText}
                                disabled={!row.chord}
                            >
                                Copy chord text
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Legacy UX ───────────────────────────────────────────────────────────
    const selectedRows = selected.indexes;
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
                            onClick={() =>
                                dispatch(
                                    setSelected({ index: row.sourceLineIndex, mode: 'single' })
                                )
                            }
                        />
                    )}
                    {selectedRows.length > 0 && isHovering && (
                        <ClickableIcon
                            path={mdiContentPaste}
                            onClick={() => {
                                // Legacy paste not available in chord-only model; no-op
                            }}
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
