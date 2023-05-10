import React from 'react';

import App from '../src/App';
import { Provider } from 'react-redux';
import store from '../src/Redux/Store';

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
