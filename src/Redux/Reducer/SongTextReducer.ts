import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const songTextSlice = createSlice({
  name: "songText",
  initialState: {
    value: "",
  },
  reducers: {
    setSongText: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
  },
});

export const { setSongText } = songTextSlice.actions;

export default songTextSlice.reducer;
