import { parseCanonical, stripBrackets } from './bracketedParser';

describe('stripBrackets', () => {
    it('removes brackets from chord token', () => {
        expect(stripBrackets('[Am]')).toBe('Am');
    });

    it('removes multiple bracket tokens', () => {
        expect(stripBrackets('[G] [D]')).toBe('G D');
    });

    it('preserves bar notation', () => {
        expect(stripBrackets('| [G] | [D] |')).toBe('| G | D |');
    });

    it('converts optional chord bracket ([Am]) to (Am)', () => {
        expect(stripBrackets('([Am])')).toBe('(Am)');
    });

    it('returns plain text unchanged', () => {
        expect(stripBrackets('Am G')).toBe('Am G');
    });
});

describe('parseCanonical', () => {
    describe('empty input', () => {
        it('returns empty array for empty string', () => {
            expect(parseCanonical('')).toEqual([]);
        });
    });

    describe('pure lyric lines', () => {
        it('single lyric line', () => {
            const rows = parseCanonical('love me');
            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({ chord: '', lyric: 'love me', isInstrumental: false, sourceLineIndex: 0 });
        });

        it('two lyric lines', () => {
            const rows = parseCanonical('love me\ntender');
            expect(rows).toHaveLength(2);
            expect(rows[0].lyric).toBe('love me');
            expect(rows[1].lyric).toBe('tender');
            expect(rows[1].sourceLineIndex).toBe(1);
        });
    });

    describe('bracketed lyric lines (inline chords)', () => {
        it('single chord at position 0', () => {
            const rows = parseCanonical('[Am]love me');
            expect(rows).toHaveLength(1);
            expect(rows[0].chord).toBe('Am');
            expect(rows[0].lyric).toBe('love me');
            expect(rows[0].isInstrumental).toBe(false);
        });

        it('chord at non-zero position', () => {
            const rows = parseCanonical('[G]Amazing [D]grace');
            expect(rows).toHaveLength(1);
            expect(rows[0].chord).toMatch(/G/);
            expect(rows[0].chord).toMatch(/D/);
            expect(rows[0].lyric).toBe('Amazing grace');
        });

        it('round-trips: parse then reformat gives original', () => {
            const { formatBracketed } = require('./bracketedFormatter');
            const original = '[G]Amazing [D]grace';
            const rows = parseCanonical(original);
            const reformatted = formatBracketed(rows[0].chord, rows[0].lyric);
            expect(reformatted).toBe(original);
        });

        it('optional chord ([Am]) parsed correctly', () => {
            const rows = parseCanonical('([Am])love me');
            expect(rows[0].chord).toContain('(Am)');
            expect(rows[0].lyric).toBe('love me');
        });
    });

    describe('Rule A — chord-only lines (instrumental)', () => {
        it('plain chord-only line', () => {
            const rows = parseCanonical('Am G');
            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({ chord: 'Am G', lyric: '', isInstrumental: true, sourceLineIndex: 0 });
        });

        it('bracketed chord-only line strips brackets', () => {
            const rows = parseCanonical('[Am] [G]');
            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({ chord: 'Am G', lyric: '', isInstrumental: true });
        });

        it('bar-notation instrumental line', () => {
            const rows = parseCanonical('| [G] | [D] |');
            expect(rows).toHaveLength(1);
            expect(rows[0].chord).toBe('| G | D |');
            expect(rows[0].isInstrumental).toBe(true);
        });

        it('bar-notation line with complex chord names (parenthetical qualifiers)', () => {
            const line = '| [C]     | [Bm7(b5)] [E7(b9)/G#] | [Am2]      | [Am2/G] |';
            const rows = parseCanonical(line);
            expect(rows).toHaveLength(1);
            expect(rows[0].isInstrumental).toBe(true);
            expect(rows[0].chord).toBe('| C     | Bm7(b5) E7(b9)/G# | Am2      | Am2/G |');
        });
    });

    describe('Rule B — empty-line silent rests', () => {
        it('one empty line between lyrics = 0 rests (both separators)', () => {
            const rows = parseCanonical('lyric\n\nlyric2');
            expect(rows).toHaveLength(2);
            expect(rows.every((r) => r.chord === '' && r.lyric !== '' || r.lyric === 'lyric' || r.lyric === 'lyric2')).toBe(true);
            expect(rows.filter((r) => r.isInstrumental)).toHaveLength(0);
        });

        it('two empty lines between lyrics = 0 rests', () => {
            const rows = parseCanonical('lyric\n\n\nlyric2');
            expect(rows).toHaveLength(2);
            expect(rows.filter((r) => r.isInstrumental)).toHaveLength(0);
        });

        it('three empty lines between lyrics = 1 rest', () => {
            const rows = parseCanonical('lyric\n\n\n\nlyric2');
            expect(rows).toHaveLength(3);
            const rest = rows[1];
            expect(rest).toMatchObject({ chord: '', lyric: '', isInstrumental: true });
        });

        it('four empty lines between lyrics = 2 rests', () => {
            const rows = parseCanonical('lyric\n\n\n\n\nlyric2');
            expect(rows).toHaveLength(4);
            expect(rows.filter((r) => r.isInstrumental)).toHaveLength(2);
        });

        it('silent-rest row has correct sourceLineIndex', () => {
            const rows = parseCanonical('lyric\n\n\n\nlyric2');
            const rest = rows[1];
            expect(rest.sourceLineIndex).toBe(2);
        });
    });

    describe('Rule A + Rule B composition', () => {
        it('chord-only line with flanking separators = no rests', () => {
            const rows = parseCanonical('lyric\n\n[G] [D]\n\nlyric2');
            expect(rows).toHaveLength(3);
            expect(rows[1]).toMatchObject({ isInstrumental: true, chord: 'G D', lyric: '' });
            expect(rows.filter((r) => r.isInstrumental)).toHaveLength(1);
        });

        it('chord-only line plus one silent rest', () => {
            const rows = parseCanonical('lyric\n\n\n[G] [D]\n\nlyric2');
            expect(rows).toHaveLength(4);
            expect(rows[1]).toMatchObject({ chord: '', lyric: '', isInstrumental: true });
            expect(rows[2]).toMatchObject({ chord: 'G D', lyric: '', isInstrumental: true });
        });

        it('adjacent chord-only lines (no blanks)', () => {
            const rows = parseCanonical('[G] [D]\n[Am] [F]');
            expect(rows).toHaveLength(2);
            expect(rows[0].chord).toBe('G D');
            expect(rows[1].chord).toBe('Am F');
        });
    });

    describe('sheet boundary — start of sheet', () => {
        it('chord-only at start, one blank, lyric = no rest', () => {
            const rows = parseCanonical('[G] [D]\n\nlyric');
            expect(rows).toHaveLength(2);
            expect(rows.filter((r) => r.isInstrumental)).toHaveLength(1);
        });

        it('chord-only at start, two blanks, lyric = one rest', () => {
            const rows = parseCanonical('[G] [D]\n\n\nlyric');
            expect(rows).toHaveLength(3);
            expect(rows[1]).toMatchObject({ chord: '', lyric: '', isInstrumental: true });
        });
    });

    describe('sheet boundary — end of sheet', () => {
        it('lyric then one blank = no rest', () => {
            const rows = parseCanonical('lyric\n');
            expect(rows).toHaveLength(1);
        });

        it('lyric then two blanks = no rest', () => {
            const rows = parseCanonical('lyric\n\n');
            expect(rows).toHaveLength(1);
        });

        it('lyric then three blanks = one rest', () => {
            const rows = parseCanonical('lyric\n\n\n');
            expect(rows).toHaveLength(2);
            expect(rows[1]).toMatchObject({ chord: '', lyric: '', isInstrumental: true });
        });
    });

    describe('precededByBlank', () => {
        it('first row is never preceded by a blank', () => {
            const rows = parseCanonical('| G | D |');
            expect(rows[0].precededByBlank).toBe(false);
        });

        it('instrumental row after a single blank gets precededByBlank=true', () => {
            const rows = parseCanonical('Key: Em\n\n| G | D |');
            expect(rows).toHaveLength(2);
            expect(rows[1].precededByBlank).toBe(true);
        });

        it('consecutive instrumentals have precededByBlank=false', () => {
            const rows = parseCanonical('| G | D |\n| C | F |');
            expect(rows).toHaveLength(2);
            expect(rows[0].precededByBlank).toBe(false);
            expect(rows[1].precededByBlank).toBe(false);
        });

        it('lyric row after a single blank between lyrics gets precededByBlank=true', () => {
            const rows = parseCanonical('[Am]verse\n\n[G]verse two');
            expect(rows).toHaveLength(2);
            expect(rows[1].precededByBlank).toBe(true);
        });

        it('lyric row after instrumental + single blank gets precededByBlank=true', () => {
            const rows = parseCanonical('| G | D |\n\nVerse 1:');
            expect(rows).toHaveLength(2);
            expect(rows[1].precededByBlank).toBe(true);
        });

        it('rest rows (empty instrumental) have precededByBlank=false', () => {
            const rows = parseCanonical('lyric\n\n\n\nlyric2');
            const rest = rows[1];
            expect(rest.isInstrumental).toBe(true);
            expect(rest.chord).toBe('');
            expect(rest.precededByBlank).toBe(false);
        });
    });

    describe('sourceLineIndex correctness', () => {
        it('lyric rows track their line index', () => {
            const rows = parseCanonical('[Am]love\n\n\n\n[G]me');
            expect(rows[0].sourceLineIndex).toBe(0);
            expect(rows[rows.length - 1].sourceLineIndex).toBe(4);
        });

        it('rest row sourceLineIndex falls within the empty-line run', () => {
            const rows = parseCanonical('a\n\n\n\nb');
            const rest = rows[1];
            expect(rest.sourceLineIndex).toBeGreaterThan(0);
            expect(rest.sourceLineIndex).toBeLessThan(4);
        });
    });
});
