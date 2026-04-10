import appReducer, { toggleShowResult, setOnsongFormat } from './AppReducer';

describe('AppReducer', () => {
    describe('toggleShowResult', () => {
        it('should toggle showResult from false to true', () => {
            const initialState = { showResult: false };
            const action = toggleShowResult();
            const state = appReducer(initialState, action);
            expect(state.showResult).toEqual(true);
        });

        it('should toggle showResult from true to false', () => {
            const initialState = { showResult: true };
            const action = toggleShowResult();
            const state = appReducer(initialState, action);
            expect(state.showResult).toEqual(false);
        });
    });

    describe('onsongFormat', () => {
        it('should default to chords-over-lyrics', () => {
            const state = appReducer(undefined, { type: '@@INIT' });
            expect(state.onsongFormat).toEqual('chords-over-lyrics');
        });

        it('should update onsongFormat to bracketed', () => {
            const state = appReducer(undefined, setOnsongFormat('bracketed'));
            expect(state.onsongFormat).toEqual('bracketed');
        });

        it('should update onsongFormat back to chords-over-lyrics', () => {
            const intermediate = appReducer(undefined, setOnsongFormat('bracketed'));
            const state = appReducer(intermediate, setOnsongFormat('chords-over-lyrics'));
            expect(state.onsongFormat).toEqual('chords-over-lyrics');
        });
    });
});
