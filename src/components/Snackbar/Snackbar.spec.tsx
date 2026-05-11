import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CanonicalReducer, { setCanonical } from '@/redux/reducer/CanonicalReducer';
import ToastReducer, { pushToast } from '@/redux/reducer/ToastReducer';
import AppReducer from '@/redux/reducer/AppReducer';
import Snackbar from './index';

function makeStore() {
    return configureStore({
        reducer: { canonical: CanonicalReducer, toast: ToastReducer, app: AppReducer },
        preloadedState: {
            canonical: {
                value: '[Am]Amazing\ngrace',
                history: [],
                lineIds: ['a', 'b'],
                selected: { anchor: undefined, indexes: [] },
                clipboard: [],
                key: undefined,
            },
        },
    });
}

function renderSnackbar(store: ReturnType<typeof makeStore>) {
    render(
        <Provider store={store}>
            <Snackbar />
        </Provider>,
    );
}

// ── Visibility ────────────────────────────────────────────────────────────────

describe('Snackbar visibility', () => {
    it('renders nothing when no toast', () => {
        const store = makeStore();
        renderSnackbar(store);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('renders when toast is pushed', () => {
        const store = makeStore();
        renderSnackbar(store);
        act(() => {
            store.dispatch(pushToast({ message: 'Cut 2 chords', showUndo: true }));
        });
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('Cut 2 chords')).toBeInTheDocument();
    });
});

// ── Undo button ───────────────────────────────────────────────────────────────

describe('Snackbar Undo button', () => {
    it('shown when showUndo is true', () => {
        const store = makeStore();
        renderSnackbar(store);
        act(() => {
            store.dispatch(pushToast({ message: 'Cleared 1 chord', showUndo: true }));
        });
        expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('not shown when showUndo is false', () => {
        const store = makeStore();
        renderSnackbar(store);
        act(() => {
            store.dispatch(pushToast({ message: 'Info message', showUndo: false }));
        });
        expect(screen.queryByText('Undo')).not.toBeInTheDocument();
    });

    it('clicking Undo dispatches undo and dismisses toast', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        // Push initial canonical state to history via a change
        act(() => {
            store.dispatch(setCanonical('[G]Hello\nworld'));
        });
        const historyBefore = store.getState().canonical.history.length;

        renderSnackbar(store);
        act(() => {
            store.dispatch(pushToast({ message: 'Cut 1 chord', showUndo: true }));
        });

        await user.click(screen.getByText('Undo'));

        // Toast dismissed
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        // Undo popped history
        expect(store.getState().canonical.history.length).toBe(historyBefore - 1);
    });
});

// ── Dismiss button ────────────────────────────────────────────────────────────

describe('Snackbar dismiss', () => {
    it('clicking ✕ dismisses the toast', async () => {
        const user = userEvent.setup();
        const store = makeStore();
        renderSnackbar(store);
        act(() => {
            store.dispatch(pushToast({ message: 'Copied', showUndo: false }));
        });
        expect(screen.getByRole('status')).toBeInTheDocument();
        await user.click(screen.getByLabelText('Dismiss'));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
});

// ── Auto-dismiss ──────────────────────────────────────────────────────────────

describe('Snackbar auto-dismiss', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('auto-dismisses after 5 seconds', () => {
        const store = makeStore();
        renderSnackbar(store);
        act(() => {
            store.dispatch(pushToast({ message: 'Pasted 1 chord', showUndo: true }));
        });
        expect(screen.getByRole('status')).toBeInTheDocument();
        act(() => {
            jest.advanceTimersByTime(5001);
        });
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('does not dismiss before 5 seconds', () => {
        const store = makeStore();
        renderSnackbar(store);
        act(() => {
            store.dispatch(pushToast({ message: 'Pasted 1 chord', showUndo: true }));
        });
        act(() => {
            jest.advanceTimersByTime(4000);
        });
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});
