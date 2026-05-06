import React, { FunctionComponent, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleShowResult } from '@/redux/reducer/AppReducer';
import {
    replaceLine,
    setSelected,
    setSelectedAll,
    clearSelected,
    moveUp,
    moveDown,
    copySelected,
    cutSelected,
    pasteChords,
} from '@/redux/reducer/CanonicalReducer';
import { pushToast } from '@/redux/reducer/ToastReducer';
import { selectRows } from '@/redux/selectors/canonicalRows';
import { formatBracketedLine } from '@/lib/onsong/bracketedFormatter';
import ChordSheetRow from '@/container/ChordSheetEditor/ChordSheetRow';
import SelectionActionBar from '@/container/ChordSheetEditor/SelectionActionBar';
import Transposer from '@/container/ChordSheetEditor/Transposer';
import HelpersBar from './HelpersBar';
import Icon from '@mdi/react';
import { mdiMusicNote } from '@mdi/js';

const ChordSheetEditor: FunctionComponent = () => {
    const rows = useSelector(selectRows);
    const selected = useSelector((state: RootState) => state.canonical.selected);
    const clipboard = useSelector((state: RootState) => state.canonical.clipboard);
    const enableNewRowUx = useSelector((state: RootState) => state.app.enableNewRowUx);
    const dispatch = useDispatch();
    const [editLyricsToggled, setEditLyricsToggled] = React.useState(false);
    const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);
    const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
    const listboxRef = useRef<HTMLDivElement>(null);

    const toggeEditLyrics = () => setEditLyricsToggled((v) => !v);

    const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(toggleShowResult());
    };

    const onChordInputBlurHandler = useCallback(
        (newChord: string, row: (typeof rows)[number]) => {
            dispatch(
                replaceLine({
                    lineIndex: row.sourceLineIndex,
                    newLine: formatBracketedLine(newChord, row.lyric),
                })
            );
        },
        [dispatch]
    );

    const onLyricInputBlurHandler = useCallback(
        (newLyric: string, row: (typeof rows)[number]) => {
            dispatch(
                replaceLine({
                    lineIndex: row.sourceLineIndex,
                    newLine: formatBracketedLine(row.chord, newLyric),
                })
            );
        },
        [dispatch]
    );

    // ── Keyboard handler (listbox-level) ─────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!enableNewRowUx) return;
        // Don't intercept when focus is inside an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        const isMod = e.metaKey || e.ctrlKey;
        const totalRows = rows.length;

        switch (true) {
            case e.key === 'ArrowDown' && !isMod && !e.shiftKey: {
                e.preventDefault();
                setFocusedRowIndex((prev) => Math.min(totalRows - 1, (prev ?? -1) + 1));
                break;
            }
            case e.key === 'ArrowUp' && !isMod && !e.shiftKey: {
                e.preventDefault();
                setFocusedRowIndex((prev) => Math.max(0, (prev ?? 1) - 1));
                break;
            }
            case e.key === 'ArrowDown' && e.shiftKey && !isMod: {
                e.preventDefault();
                setFocusedRowIndex((prev) => {
                    const next = Math.min(totalRows - 1, (prev ?? -1) + 1);
                    if (next >= 0) {
                        const row = rows[next];
                        dispatch(setSelected({ index: row.sourceLineIndex, mode: 'range' }));
                    }
                    return next;
                });
                break;
            }
            case e.key === 'ArrowUp' && e.shiftKey && !isMod: {
                e.preventDefault();
                setFocusedRowIndex((prev) => {
                    const next = Math.max(0, (prev ?? 1) - 1);
                    const row = rows[next];
                    dispatch(setSelected({ index: row.sourceLineIndex, mode: 'range' }));
                    return next;
                });
                break;
            }
            case e.key === ' ': {
                e.preventDefault();
                if (focusedRowIndex !== null && focusedRowIndex < rows.length) {
                    const row = rows[focusedRowIndex];
                    dispatch(setSelected({ index: row.sourceLineIndex, mode: 'toggle' }));
                }
                break;
            }
            case e.key === 'ArrowDown' && isMod: {
                // Chord-only move: swap chord value of focused row with row below
                e.preventDefault();
                if (focusedRowIndex !== null) {
                    const row = rows[focusedRowIndex];
                    dispatch(moveDown(row.sourceLineIndex));
                    // Focus stays on the same lyric row (the chord moved, the row didn't)
                }
                break;
            }
            case e.key === 'ArrowUp' && isMod: {
                // Chord-only move: swap chord value of focused row with row above
                e.preventDefault();
                if (focusedRowIndex !== null) {
                    const row = rows[focusedRowIndex];
                    dispatch(moveUp(row.sourceLineIndex));
                }
                break;
            }
            case e.key === 'a' && isMod: {
                e.preventDefault();
                dispatch(setSelectedAll(rows.length));
                break;
            }
            case e.key === 'Escape': {
                dispatch(clearSelected());
                break;
            }
            case e.key === 'c' && isMod: {
                e.preventDefault();
                if (selected.indexes.length > 0) dispatch(copySelected());
                break;
            }
            case e.key === 'x' && isMod: {
                e.preventDefault();
                if (selected.indexes.length > 0) {
                    const count = selected.indexes.length;
                    dispatch(cutSelected());
                    dispatch(
                        pushToast({
                            message: `Cut ${count} chord${count !== 1 ? 's' : ''}`,
                            showUndo: true,
                        })
                    );
                }
                break;
            }
            case e.key === 'v' && isMod: {
                e.preventDefault();
                if (clipboard.length > 0 && focusedRowIndex !== null) {
                    const row = rows[focusedRowIndex];
                    dispatch(pasteChords(row.sourceLineIndex));
                    dispatch(
                        pushToast({
                            message: `Pasted ${clipboard.length} chord${clipboard.length !== 1 ? 's' : ''}`,
                            showUndo: true,
                        })
                    );
                }
                break;
            }
        }
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
                    <div
                        ref={listboxRef}
                        role={enableNewRowUx ? 'listbox' : undefined}
                        aria-multiselectable={enableNewRowUx ? 'true' : undefined}
                        aria-label={enableNewRowUx ? 'Chord sheet rows' : undefined}
                        tabIndex={enableNewRowUx ? -1 : undefined}
                        onKeyDown={handleKeyDown}
                    >
                        {/* ARIA live region for selection announcements */}
                        {enableNewRowUx && (
                            <div aria-live="polite" aria-atomic="true" className="VisuallyHidden">
                                {selected.indexes.length > 0
                                    ? `${selected.indexes.length} row${selected.indexes.length !== 1 ? 's' : ''} selected`
                                    : ''}
                            </div>
                        )}
                        {rows.map((row, i) => (
                            <ChordSheetRow
                                key={row.id || `${row.sourceLineIndex}-${row.chord}-${row.lyric}`}
                                rowIndex={i}
                                row={row}
                                isFocused={focusedRowIndex === i}
                                isNewUx={enableNewRowUx}
                                onChordInputBlur={(newChord) =>
                                    onChordInputBlurHandler(newChord, row)
                                }
                                onLyricInputBlur={(newLyric) =>
                                    onLyricInputBlurHandler(newLyric, row)
                                }
                                enableEditLyrics={editLyricsToggled}
                                onRowFocus={setFocusedRowIndex}
                                onRowHover={setHoveredRowIndex}
                            />
                        ))}
                    </div>
                    {enableNewRowUx && (
                        <SelectionActionBar
                            hoveredRowIndex={hoveredRowIndex ?? undefined}
                            focusedRowIndex={focusedRowIndex ?? undefined}
                        />
                    )}
                    <button type="submit" className="btn-primary">
                        Submit changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChordSheetEditor;
