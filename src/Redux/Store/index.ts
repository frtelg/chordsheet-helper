import { configureStore } from "@reduxjs/toolkit";
import AppReducer from "../Reducer/AppReducer";
import ChordSheetReducer from "../Reducer/ChordSheetReducer";
import SongTextReducer from "../Reducer/SongTextReducer";

export default configureStore({
  reducer: {
    app: AppReducer,
    songText: SongTextReducer,
    chordSheet: ChordSheetReducer,
  },
});
