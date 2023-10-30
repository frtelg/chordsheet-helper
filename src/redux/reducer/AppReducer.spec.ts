import appReducer, { toggleShowResult } from './AppReducer';

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
});
