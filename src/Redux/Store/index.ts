import { configureStore } from '@reduxjs/toolkit';
import AppReducer from '../reducer/AppReducer';
import ChordSheetReducer from '../reducer/ChordSheetReducer';
import SongTextReducer from '../reducer/SongTextReducer';

const store = configureStore({
    reducer: {
        app: AppReducer,
        songText: SongTextReducer,
        chordSheet: ChordSheetReducer,
    },
});

declare global {
    export type RootState = ReturnType<typeof store.getState>;
}

export default store;
