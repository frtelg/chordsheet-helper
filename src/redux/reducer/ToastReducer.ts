import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ToastState {
    toast?: {
        message: string;
        /** When true, the snackbar Undo button calls the global `undo` action. */
        showUndo: boolean;
        dismissAt: number;
    };
}

const TOAST_DURATION_MS = 5000;

const initialState: ToastState = {
    toast: undefined,
};

export const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {
        pushToast: (state, action: PayloadAction<{ message: string; showUndo: boolean }>) => {
            state.toast = {
                message: action.payload.message,
                showUndo: action.payload.showUndo,
                dismissAt: Date.now() + TOAST_DURATION_MS,
            };
        },
        dismissToast: (state) => {
            state.toast = undefined;
        },
    },
});

export const { pushToast, dismissToast } = toastSlice.actions;

export default toastSlice.reducer;
