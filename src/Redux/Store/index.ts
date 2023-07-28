import { configureStore } from "@reduxjs/toolkit";
import AppReducer from "../Reducer/AppReducer";
import ChordSheetReducer from "../Reducer/ChordSheetReducer";
import SongTextReducer from "../Reducer/SongTextReducer";

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
