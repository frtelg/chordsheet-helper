import React, { FunctionComponent, useRef, useState } from 'react';
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
    mdiDragVertical,
} from '@mdi/js';
import Icon from '@mdi/react';
import ClickableIcon from '@/components/ClickableIcon';
import { moveDown, moveUp, setSelected, clearChords } from '@/redux/reducer/CanonicalReducer';
import { pushToast } from '@/redux/reducer/ToastReducer';
import { selectRows, Row } from '@/redux/selectors/canonicalRows';

export type DropPosition = 'before' | 'after';

export type ChordSheetRowProps = {
    rowIndex: number;
    row: Row;
    isFocused: boolean;
    isNewUx: boolean;
    isDragging: boolean;
    isLifted: boolean;
    dropIndicator: DropPosition | null;
    onChordInputBlur(newChord: string): void;
    onLyricInputBlur(newLyric: string): void;
    enableEditLyrics: boolean;
    onRowFocus(rowIndex: number): void;
    onRowHover(rowIndex: number | null): void;
    onRowDragStart(rowIndex: number): void;
    onRowDragOver(rowIndex: number, position: DropPosition): void;
    onRowDrop(rowIndex: number, position: DropPosition): void;
    onRowDragEnd(): void;
};

const ChordSheetRow: FunctionComponent<ChordSheetRowProps> = ({
    rowIndex,
    row,
    isFocused,
    isNewUx,
    isDragging,
    isLifted,
    dropIndicator,
    onChordInputBlur,
    onLyricInputBlur,
    enableEditLyrics,
    onRowFocus,
    onRowHover,
    onRowDragStart,
    onRowDragOver,
    onRowDrop,
    onRowDragEnd,
}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [kebabOpen, setKebabOpen] = useState(false);
    const rowRef = useRef<HTMLDivElement>(null);
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
        const containerClasses = [
            'SongTextRowContainer',
            isSelected ? 'SongTextRowContainer--selected' : '',
            isDragging ? 'SongTextRowContainer--dragging' : '',
            isLifted ? 'SongTextRowContainer--lifted' : '',
            dropIndicator === 'before' ? 'SongTextRowContainer--drop-before' : '',
            dropIndicator === 'after' ? 'SongTextRowContainer--drop-after' : '',
        ]
            .filter(Boolean)
            .join(' ');
        return (
            <div
                ref={rowRef}
                className={containerClasses}
                role="option"
                aria-selected={isSelected}
                aria-grabbed={isLifted || isDragging}
                tabIndex={isFocused ? 0 : -1}
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(rowIndex));
                    if (rowRef.current) {
                        e.dataTransfer.setDragImage(rowRef.current, 12, 12);
                    }
                    onRowDragStart(rowIndex);
                }}
                onDragEnd={() => {
                    onRowDragEnd();
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const rect = e.currentTarget.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    const position: DropPosition = e.clientY < midY ? 'before' : 'after';
                    onRowDragOver(rowIndex, position);
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    const position: DropPosition = e.clientY < midY ? 'before' : 'after';
                    onRowDrop(rowIndex, position);
                }}
                onMouseEnter={() => {
                    setIsHovering(true);
                    onRowHover(rowIndex);
                }}
                onMouseLeave={() => {
                    setIsHovering(false);
                    onRowHover(null);
                }}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.KebabMenu')) return;
                    const hasModifier = e.shiftKey || e.metaKey || e.ctrlKey;
                    const isInput = target.tagName === 'INPUT';
                    if (isInput && !hasModifier) return;
                    if (isInput && hasModifier) e.preventDefault();
                    const mode = e.shiftKey
                        ? 'range'
                        : e.metaKey || e.ctrlKey
                          ? 'toggle'
                          : 'single';
                    dispatch(setSelected({ index: row.sourceLineIndex, mode }));
                    // Update focus to the clicked row so subsequent keyboard
                    // actions (e.g. Cmd+V paste) anchor at the clicked row,
                    // not at a stale previously-focused row.
                    onRowFocus(rowIndex);
                }}
                onFocus={() => onRowFocus(rowIndex)}
            >
                <button
                    type="button"
                    className={[
                        'DragHandle',
                        showAffordances || isLifted ? 'DragHandle--visible' : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    aria-label={`Reorder row ${rowIndex + 1}`}
                    aria-pressed={isLifted}
                    tabIndex={-1}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Icon path={mdiDragVertical} size="1rem" color="var(--color-text-muted)" />
                </button>
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
