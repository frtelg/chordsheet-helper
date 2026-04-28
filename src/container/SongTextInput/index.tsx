import React, { FunctionComponent, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetCanonical, setCanonical } from '@/redux/reducer/CanonicalReducer';
import { selectRows } from '@/redux/selectors/canonicalRows';
import { chordsOverLyricsToBracketed } from '@/lib/onsong/bracketedFormatter';
import isChordsOnly from '@/lib/chord/isChordsOnly';
import ProcessChordLinesModal from './ProcessChordLinesModal';

type Format = 'bracketed' | 'over-lyrics';

/** Render the canonical bracketed string as chords-over-lyrics for the textarea. */
function renderOverLyrics(rows: ReturnType<typeof selectRows>): string {
    const lines: string[] = [];
    for (let idx = 0; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.precededByBlank && idx > 0) {
            lines.push('');
        }
        if (row.isInstrumental && !row.chord) {
            lines.push('');
        } else if (row.isInstrumental) {
            lines.push(row.chord);
        } else if (row.chord) {
            lines.push(row.chord);
            lines.push(row.lyric);
        } else {
            lines.push(row.lyric);
        }
    }
    return lines.join('\n');
}

const doesInputHaveChordLines = (v: string) => !!v.split('\n').find((line) => isChordsOnly(line));

const doesInputHaveMultipleLines = (v: string) => v.split('\n').length > 1;

const SongTextInput: FunctionComponent = () => {
    const [touched, setTouched] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [firstEntry, setFirstEntry] = useState('');
    const [format, setFormat] = useState<Format>('bracketed');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastCursorRef = useRef<{ start: number; end: number } | null>(null);
    const pendingCursorRef = useRef<number | null>(null);

    const canonical = useSelector((state: RootState) => state.canonical.value);
    const rows = useSelector(selectRows);
    const dispatch = useDispatch();

    const displayValue = format === 'bracketed' ? canonical : renderOverLyrics(rows);

    // Cursor preservation: restore cursor when value changed externally (right-side edit),
    // or when a pending cursor was saved from an Enter keypress in over-lyrics mode.
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        const pendingCursor = pendingCursorRef.current;
        pendingCursorRef.current = null;
        if (pendingCursor !== null) {
            const pos = Math.min(pendingCursor, el.value.length);
            el.setSelectionRange(pos, pos);
            return;
        }
        if (document.activeElement === el || !lastCursorRef.current) return;
        const { start, end } = lastCursorRef.current;
        const max = el.value.length;
        el.setSelectionRange(Math.min(start, max), Math.min(end, max));
    }, [canonical]);

    const trackCursor = () => {
        const el = textareaRef.current;
        if (el) lastCursorRef.current = { start: el.selectionStart, end: el.selectionEnd };
    };

    const dispatchCanonical = useCallback(
        (value: string) => dispatch(setCanonical(value)),
        [dispatch]
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const raw = e.target.value;

        if (raw === '') {
            setTouched(false);
            setFirstEntry('');
            dispatchCanonical('');
            return;
        }

        if (!touched) {
            setTouched(true);
            if (doesInputHaveChordLines(raw) && doesInputHaveMultipleLines(raw)) {
                setFirstEntry(raw);
                setShowModal(true);
                return;
            }
        }

        if (format === 'over-lyrics') {
            dispatchCanonical(chordsOverLyricsToBracketed(raw));
            return;
        }

        dispatchCanonical(raw);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const el = e.currentTarget;
            const before = el.value.slice(0, el.selectionStart);
            const after = el.value.slice(el.selectionEnd);
            const padded = before + '    ' + after;
            if (format === 'over-lyrics') {
                dispatchCanonical(chordsOverLyricsToBracketed(padded));
            } else {
                dispatchCanonical(padded);
            }
        }

        if (e.key === 'Enter' && format === 'over-lyrics') {
            // Save cursor position so useLayoutEffect can restore it after the round-trip
            // re-renders the same displayValue (swallowing the inserted blank line).
            pendingCursorRef.current = e.currentTarget.selectionStart + 1;
        }
    };

    const handleReset = () => {
        dispatch(resetCanonical());
        setTouched(false);
    };

    return (
        <div className="SongTextInput">
            <ProcessChordLinesModal
                isOpen={showModal}
                onClose={() => {
                    // Decline: keep the raw text as-is in the canonical without extracting chords.
                    setShowModal(false);
                    dispatchCanonical(firstEntry);
                }}
                processChordLines={() => {
                    setShowModal(false);
                    dispatchCanonical(chordsOverLyricsToBracketed(firstEntry));
                }}
            />
            <label className="SongTextInputLabel" htmlFor="song-text-input">
                Lyrics
            </label>
            <div className="SongTextInputToolbar">
                <button
                    type="button"
                    className={format === 'bracketed' ? 'btn-toggle active' : 'btn-toggle'}
                    onClick={() => setFormat('bracketed')}
                >
                    Bracketed
                </button>
                <button
                    type="button"
                    className={format === 'over-lyrics' ? 'btn-toggle active' : 'btn-toggle'}
                    onClick={() => setFormat('over-lyrics')}
                >
                    Chords over lyrics
                </button>
            </div>
            <textarea
                id="song-text-input"
                ref={textareaRef}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onSelect={trackCursor}
                onKeyUp={trackCursor}
                placeholder="Paste or type your song lyrics here…"
            />
            <button
                type="button"
                onClick={() => navigator.clipboard.readText().then(dispatchCanonical)}
            >
                Paste from clipboard
            </button>
            <button type="button" className="btn-danger" onClick={handleReset}>
                Reset
            </button>
        </div>
    );
};

export default SongTextInput;
