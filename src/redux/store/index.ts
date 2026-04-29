import { configureStore } from '@reduxjs/toolkit';
import AppReducer from '@/redux/reducer/AppReducer';
import CanonicalReducer from '@/redux/reducer/CanonicalReducer';

const store = configureStore({
    reducer: {
        app: AppReducer,
        canonical: CanonicalReducer,
    },
});

declare global {
    export type RootState = ReturnType<typeof store.getState>;
}

export default store;
