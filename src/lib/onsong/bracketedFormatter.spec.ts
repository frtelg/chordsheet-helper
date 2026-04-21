import { formatBracketed } from './bracketedFormatter';

describe('formatBracketed', () => {
    describe('basic chord insertion', () => {
        it('single chord at position zero', () => {
            expect(formatBracketed('G', 'Amazing grace')).toBe('[G]Amazing grace');
        });

        it('multiple chords at various positions', () => {
            expect(formatBracketed('G       D', 'Amazing grace')).toBe('[G]Amazing [D]grace');
        });

        it('chord position exceeds lyric length — pads with spaces', () => {
            // G at 0, D at 13
            expect(formatBracketed('G            D', 'Amen')).toBe('[G]Amen         [D]');
        });

        it('empty chord line returns lyric unchanged', () => {
            expect(formatBracketed('', 'Amazing grace')).toBe('Amazing grace');
        });

        it('whitespace-only chord line returns lyric unchanged', () => {
            expect(formatBracketed('   ', 'Amazing grace')).toBe('Amazing grace');
        });
    });

    describe('optional chords', () => {
        it('optional chord becomes ([chord])', () => {
            // (Am) at 0, G at 8
            expect(formatBracketed('(Am)    G', 'Amazing grace')).toBe('([Am])Amazing [G]grace');
        });
    });

    describe('bar separators', () => {
        it('pipe | inserted at column offset without brackets', () => {
            // Am at 0, | at 4, G at 8 (over 'g' in "grace")
            expect(formatBracketed('Am  |   G', 'Amazing grace')).toBe('[Am]Amaz|ing [G]grace');
        });

        it('repeat sign :|| inserted without brackets', () => {
            // Am at 0, :|| at 5
            expect(formatBracketed('Am   :||', 'Amazing grace')).toBe('[Am]Amazi:||ng grace');
        });

        it('repeat sign ||: inserted without brackets', () => {
            expect(formatBracketed('Am   ||:', 'Amazing grace')).toBe('[Am]Amazi||:ng grace');
        });

        it('double bar || inserted without brackets', () => {
            expect(formatBracketed('Am   ||', 'Amazing grace')).toBe('[Am]Amazi||ng grace');
        });
    });

    describe('instrumental lines (empty lyric) — spacing preserved', () => {
        it('chords on empty lyric preserve inter-token spacing', () => {
            expect(formatBracketed('G   D', '')).toBe('[G]   [D]');
        });

        it('optional chord on empty lyric preserves spacing', () => {
            expect(formatBracketed('(Am) G', '')).toBe('([Am]) [G]');
        });

        it('bar separator on empty lyric preserves surrounding spacing', () => {
            expect(formatBracketed('Am  |  G', '')).toBe('[Am]  |  [G]');
        });

        it('bar-separated chord line preserves spacing', () => {
            expect(formatBracketed('| G | D | Em | C |', '')).toBe('| [G] | [D] | [Em] | [C] |');
        });

        it('repeat-bar notation preserves spacing', () => {
            expect(formatBracketed('|: G D :|', '')).toBe('|: [G] [D] :|');
        });

        it('rhythm slashes preserved without brackets', () => {
            expect(formatBracketed('| G / / / | D / / / |', '')).toBe(
                '| [G] / / / | [D] / / / |'
            );
        });
    });
});

import { formatBracketedLine, chordsOverLyricsToBracketed } from './bracketedFormatter';

describe('formatBracketedLine', () => {
    it('paired row with chord and lyric', () => {
        expect(formatBracketedLine('Am', 'love me')).toBe('[Am]love me');
    });

    it('instrumental row (empty lyric) preserves inter-token spacing', () => {
        expect(formatBracketedLine('G   D', '')).toBe('[G]   [D]');
    });

    it('bar-notation instrumental row', () => {
        expect(formatBracketedLine('| G | D |', '')).toBe('| [G] | [D] |');
    });

    it('pure lyric row (no chord)', () => {
        expect(formatBracketedLine('', 'love me')).toBe('love me');
    });

    it('round-trips with parseCanonical', () => {
        const { parseCanonical } = require('./bracketedParser');
        const line = '[Am]love [G]me';
        const rows = parseCanonical(line);
        const reformatted = formatBracketedLine(rows[0].chord, rows[0].lyric);
        expect(reformatted).toBe(line);
    });
});

describe('chordsOverLyricsToBracketed', () => {
    it('pairs chord line above lyric line', () => {
        // Am at col 0, G at col 3 → inserts before lyric col 3
        expect(chordsOverLyricsToBracketed('Am G\nlove me')).toBe('[Am]lov[G]e me');
    });

    it('pairs chord line: chord at column 5 aligns correctly', () => {
        expect(chordsOverLyricsToBracketed('Am   G\nlove me')).toBe('[Am]love [G]me');
    });

    it('pure lyric with no chord above passes through', () => {
        expect(chordsOverLyricsToBracketed('love me')).toBe('love me');
    });

    it('chord-only line with no following lyric becomes instrumental', () => {
        expect(chordsOverLyricsToBracketed('G D')).toBe('[G] [D]');
    });

    it('adjacent chord lines both become instrumentals', () => {
        expect(chordsOverLyricsToBracketed('G D\nAm Em')).toBe('[G] [D]\n[Am] [Em]');
    });

    it('blank lines preserved as-is', () => {
        expect(chordsOverLyricsToBracketed('G D\n\nlove me')).toBe('[G] [D]\n\nlove me');
    });

    it('handles bar notation instrumental', () => {
        expect(chordsOverLyricsToBracketed('| G | D |\nlove me')).toBe('| [G] | [D] |love me');
    });

    it('already-bracketed chord-only line round-trips unchanged', () => {
        expect(chordsOverLyricsToBracketed('[G] [D]')).toBe('[G] [D]');
    });

    it('already-bracketed instrumental with bar notation round-trips', () => {
        expect(chordsOverLyricsToBracketed('| [G] | [D] |')).toBe('| [G] | [D] |');
    });

    it('multi-section with chords over lyrics and plain lyrics', () => {
        const input = 'Am\nlove me\nG   D\nAmazing grace';
        const output = chordsOverLyricsToBracketed(input);
        expect(output).toBe('[Am]love me\n[G]Amaz[D]ing grace');
    });
});

describe('paste flow — legacy chords-over-lyrics conversion', () => {
    it('full song paste: chord lines merge with lyric lines into bracketed canonical', () => {
        // Simulates pasting a typical chords-over-lyrics song
        const pasted = [
            'Am           F',
            'Amazing grace how sweet the sound',
            'C          G',
            'That saved a wretch like me',
        ].join('\n');

        const canonical = chordsOverLyricsToBracketed(pasted);

        expect(canonical).toContain('[Am]');
        expect(canonical).toContain('[F]');
        expect(canonical).toContain('[C]');
        expect(canonical).toContain('[G]');
        expect(canonical).toContain('Amazing grace');
        // Output should be 2 bracketed lines, not 4
        expect(canonical.split('\n').length).toBe(2);
    });

    it('instrumental chord-only row is preserved when no following lyric', () => {
        const pasted = 'Am G\n';
        const canonical = chordsOverLyricsToBracketed(pasted);
        // Chord-only becomes an instrumental bracketed line
        expect(canonical).toContain('[Am]');
        expect(canonical).toContain('[G]');
    });

    it('blank separator lines are preserved between sections', () => {
        const pasted = 'Am\nverse one\n\nG\nverse two';
        const canonical = chordsOverLyricsToBracketed(pasted);
        // Blank separator preserved
        expect(canonical).toContain('\n\n');
        expect(canonical).toContain('[Am]verse one');
        expect(canonical).toContain('[G]verse two');
    });

    it('bar-notation intro chord preserved as instrumental', () => {
        const pasted = '| Am | F | C | G |';
        const canonical = chordsOverLyricsToBracketed(pasted);
        expect(canonical).toContain('[Am]');
        expect(canonical).toContain('[F]');
        expect(canonical).toContain('[C]');
        expect(canonical).toContain('[G]');
    });

    it('already-bracketed canonical pasted again round-trips unchanged', () => {
        const bracketed = '[Am]Amazing grace\n[C]How sweet the sound';
        expect(chordsOverLyricsToBracketed(bracketed)).toBe(bracketed);
    });

    it('plain lyrics with no chords pass through unchanged', () => {
        const lyrics = 'Amazing grace\nHow sweet the sound';
        expect(chordsOverLyricsToBracketed(lyrics)).toBe(lyrics);
    });
});
