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

    const canMoveUp = isContiguous && minIdx > 0;
    const canMoveDown = isContiguous && maxIdx < rows.length - 1;

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
                title="Move up"
                onClick={handleMoveUp}
                disabled={!canMoveUp}
            >
                Move ↑
            </button>
            <button
                type="button"
                className="SelectionBarButton"
                title="Move down"
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
