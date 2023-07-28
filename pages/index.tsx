import React from 'react';

import App from '../src/App';
import { Provider } from 'react-redux';
import store from '../src/Redux/Store';
import Head from 'next/head';

declare global {
    export type ReduxState = ReturnType<typeof store.getState>;
}

export default function IndexPage() {
    return (
        <React.StrictMode>
            <Head>
                <title>ChordSheet helper</title>
            </Head>
            <Provider store={store}>
                <App />
            </Provider>
        </React.StrictMode>
    );
}
