'use client';

import React from 'react';

import App from '@/App';
import { Provider } from 'react-redux';
import store from '@/redux/store';

declare global {
    export type ReduxState = ReturnType<typeof store.getState>;
}

export default function IndexPage() {
    return (
        <React.StrictMode>
            <Provider store={store}>
                <App />
            </Provider>
        </React.StrictMode>
    );
}
