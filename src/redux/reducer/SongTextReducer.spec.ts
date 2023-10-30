import songTextReducer, { setSongText, resetSongText } from './SongTextReducer';

describe('songText reducer', () => {
    const initialState = {
        value: '',
    };

    it('should handle initial state', () => {
        expect(songTextReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setSongText', () => {
        const text = 'Verse 1\nThis is the first verse';
        const actual = songTextReducer(initialState, setSongText(text));
        expect(actual.value).toEqual(text);
    });

    it('should handle resetSongText', () => {
        const state = {
            value: 'Verse 1\nThis is the first verse',
        };
        const actual = songTextReducer(state, resetSongText());
        expect(actual.value).toEqual(initialState.value);
    });
});
