import { configureStore } from '@reduxjs/toolkit';
import AppReducer from '@/redux/reducer/AppReducer';
import ChordSheetReducer from '@/redux/reducer/ChordSheetReducer';
import SongTextReducer from '@/redux/reducer/SongTextReducer';

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
