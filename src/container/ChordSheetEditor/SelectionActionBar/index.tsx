import React, { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    moveSelectionUp,
    moveSelectionDown,
    copySelected,
    cutSelected,
    pasteChords,
    clearChords,
    clearSelected,
} from '@/redux/reducer/CanonicalReducer';
import { pushToast } from '@/redux/reducer/ToastReducer';
import { selectRows } from '@/redux/selectors/canonicalRows';

type SelectionActionBarProps = {
    /** Index of the row currently hovered or focused (for paste target). */
    hoveredRowIndex?: number;
    focusedRowIndex?: number;
};

const SelectionActionBar: FunctionComponent<SelectionActionBarProps> = ({
    hoveredRowIndex,
    focusedRowIndex,
}) => {
    const dispatch = useDispatch();
    const selected = useSelector((state: RootState) => state.canonical.selected);
    const clipboard = useSelector((state: RootState) => state.canonical.clipboard);
    const rows = useSelector(selectRows);

    const indexes = selected.indexes;
    if (indexes.length === 0) return null;

    const sortedIndexes = [...indexes].sort((a, b) => a - b);
    const minIdx = sortedIndexes[0];
    const maxIdx = sortedIndexes[sortedIndexes.length - 1];

    // Contiguous means all indexes between min and max are present
    const isContiguous =
        indexes.length === maxIdx - minIdx + 1 &&
        sortedIndexes.every((idx, i) => idx === minIdx + i);

    // Indexes of source lines that are actually rendered (not blank separators)
    const renderedSourceIndexSet = new Set(rows.map((r) => r.sourceLineIndex));

    // Non-contiguous because EVERY gap in the sourceLineIndex range contains only blank
    // separator lines (not unselected rendered rows). Distinguishes "user skipped a row"
    // (non-contiguous by cmd+click over rendered rows) from "blank line between sections".
    const spansBoundary =
        !isContiguous &&
        (() => {
            for (let i = 0; i < sortedIndexes.length - 1; i++) {
                const a = sortedIndexes[i];
                const b = sortedIndexes[i + 1];
                for (let g = a + 1; g < b; g++) {
                    if (renderedSourceIndexSet.has(g)) return false;
                }
            }
            return true;
        })();

    const canMoveUp = isContiguous && minIdx > 0;
    const canMoveDown = isContiguous && maxIdx < rows.length - 1;

    const moveUpTitle = canMoveUp
        ? 'Move selection up'
        : minIdx === 0
          ? 'Already at the top'
          : spansBoundary
            ? 'Selection crosses a blank-line boundary'
            : 'Selection is not contiguous';

    const moveDownTitle = canMoveDown
        ? 'Move selection down'
        : maxIdx === rows.length - 1
          ? 'Already at the bottom'
          : spansBoundary
            ? 'Selection crosses a blank-line boundary'
            : 'Selection is not contiguous';

    // Paste target: prefer focused row, fall back to hovered row
    const pasteTargetRowIndex = focusedRowIndex ?? hoveredRowIndex;
    const pasteTargetSourceIndex =
        pasteTargetRowIndex !== undefined ? rows[pasteTargetRowIndex]?.sourceLineIndex : undefined;
    const canPaste = clipboard.length > 0 && pasteTargetSourceIndex !== undefined;

    const count = indexes.length;

    const handleMoveUp = () => dispatch(moveSelectionUp());
    const handleMoveDown = () => dispatch(moveSelectionDown());

    const handleCopy = () => dispatch(copySelected());

    const handleCut = () => {
        dispatch(cutSelected());
        dispatch(
            pushToast({ message: `Cut ${count} chord${count !== 1 ? 's' : ''}`, showUndo: true })
        );
    };

    const handlePaste = () => {
        if (pasteTargetSourceIndex === undefined) return;
        dispatch(pasteChords(pasteTargetSourceIndex));
        dispatch(
            pushToast({
                message: `Pasted ${clipboard.length} chord${clipboard.length !== 1 ? 's' : ''}`,
                showUndo: true,
            })
        );
    };

    const handleClearChords = () => {
        dispatch(clearChords());
        dispatch(
            pushToast({
                message: `Cleared ${count} chord${count !== 1 ? 's' : ''}`,
                showUndo: true,
            })
        );
    };

    const handleClearSelection = () => dispatch(clearSelected());

    return (
        <div className="SelectionActionBar" role="toolbar" aria-label="Selection actions">
            <span className="SelectionPill">
                {count} row{count !== 1 ? 's' : ''} selected
            </span>
            <button
                type="button"
                className="SelectionBarButton"
                title={moveUpTitle}
                onClick={handleMoveUp}
                disabled={!canMoveUp}
            >
                Move ↑
            </button>
            <button
                type="button"
                className="SelectionBarButton"
                title={moveDownTitle}
                onClick={handleMoveDown}
                disabled={!canMoveDown}
            >
                Move ↓
            </button>
            <button
                type="button"
                className="SelectionBarButton"
                title="Copy chord values"
                onClick={handleCopy}
            >
                Copy
            </button>
            <button
                type="button"
                className="SelectionBarButton"
                title="Cut chord values"
                onClick={handleCut}
            >
                Cut
            </button>
            <button
                type="button"
                className="SelectionBarButton"
                title="Paste chord values"
                onClick={handlePaste}
                disabled={!canPaste}
            >
                Paste
            </button>
            <button
                type="button"
                className="SelectionBarButton"
                title="Clear chord values"
                onClick={handleClearChords}
            >
                Clear chords
            </button>
            <button
                type="button"
                className="SelectionBarButton SelectionBarButton--secondary"
                title="Clear selection"
                onClick={handleClearSelection}
            >
                ✕ Clear selection
            </button>
        </div>
    );
};

export default SelectionActionBar;
