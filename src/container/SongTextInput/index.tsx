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

/** Check if input introduces a bare '[' that is not part of a valid [chord] token. */
function hasBareOpenBracket(value: string): boolean {
    const lines = value.split('\n');
    for (const line of lines) {
        if (isChordsOnly(line)) continue;
        let i = 0;
        while (i < line.length) {
            if (line[i] === '[') {
                const end = line.indexOf(']', i);
                if (end === -1) return true;
                i = end + 1;
            } else {
                i++;
            }
        }
    }
    return false;
}

const doesInputHaveChordLines = (v: string) => !!v.split('\n').find((line) => isChordsOnly(line));

const doesInputHaveMultipleLines = (v: string) => v.split('\n').length > 1;

const SongTextInput: FunctionComponent = () => {
    const [touched, setTouched] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [firstEntry, setFirstEntry] = useState('');
    const [format, setFormat] = useState<Format>('bracketed');
    const [bracketWarning, setBracketWarning] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastCursorRef = useRef<{ start: number; end: number } | null>(null);

    const canonical = useSelector((state: RootState) => state.canonical.value);
    const rows = useSelector(selectRows);
    const dispatch = useDispatch();

    const displayValue = format === 'bracketed' ? canonical : renderOverLyrics(rows);

    // Cursor preservation: restore cursor when value changed externally (right-side edit)
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el || document.activeElement === el || !lastCursorRef.current) return;
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
        setBracketWarning(false);

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

        if (hasBareOpenBracket(raw)) {
            setBracketWarning(true);
            return;
        }

        dispatchCanonical(raw);
    };

    const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    };

    const handleReset = () => {
        dispatch(resetCanonical());
        setTouched(false);
        setBracketWarning(false);
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
            {bracketWarning && (
                <p className="SongTextInputWarning">
                    Literal <code>[</code> is not allowed in lyrics. Use <code>[Am]</code> format
                    for chords.
                </p>
            )}
            <textarea
                id="song-text-input"
                ref={textareaRef}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleTab}
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
