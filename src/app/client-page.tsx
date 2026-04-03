'use client';

import App from '@/App';
import store from '@/redux/store';
import { Provider } from 'react-redux';

declare global {
    export type ReduxState = ReturnType<typeof store.getState>;
}

export default function ClientPage() {
    return (
        <Provider store={store}>
            <App />
        </Provider>
    );
}
