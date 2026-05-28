import { configureStore } from '@reduxjs/toolkit';
import AppReducer from '@/redux/reducer/AppReducer';
import CanonicalReducer from '@/redux/reducer/CanonicalReducer';
import ToastReducer from '@/redux/reducer/ToastReducer';

const store = configureStore({
    reducer: {
        app: AppReducer,
        canonical: CanonicalReducer,
        toast: ToastReducer,
    },
});

// Expose store for E2E testing (dev/test only)
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__store__ = store;
}

declare global {
    export type RootState = ReturnType<typeof store.getState>;
}

export default store;
