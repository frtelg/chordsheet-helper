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

    describe('instrumental lines (empty lyric)', () => {
        it('chords on an empty lyric line are bracket-wrapped', () => {
            expect(formatBracketed('G   D', '')).toBe('[G][D]');
        });

        it('optional chord on empty lyric becomes ([chord])', () => {
            expect(formatBracketed('(Am)', '')).toBe('([Am])');
        });

        it('bar separator on empty lyric is kept as-is', () => {
            expect(formatBracketed('Am  |  G', '')).toBe('[Am]|[G]');
        });
    });
});
