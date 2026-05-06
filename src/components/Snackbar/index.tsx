import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissToast } from '@/redux/reducer/ToastReducer';
import { undo } from '@/redux/reducer/CanonicalReducer';

const Snackbar: FunctionComponent = () => {
    const dispatch = useDispatch();
    const toast = useSelector((state: RootState) => state.toast.toast);

    useEffect(() => {
        if (!toast) return;
        const remaining = toast.dismissAt - Date.now();
        if (remaining <= 0) {
            dispatch(dismissToast());
            return;
        }
        const timer = setTimeout(() => dispatch(dismissToast()), remaining);
        return () => clearTimeout(timer);
    }, [toast, dispatch]);

    if (!toast) return null;

    const handleUndo = () => {
        dispatch(undo());
        dispatch(dismissToast());
    };

    return (
        <div className="Snackbar" role="status" aria-live="polite">
            <span className="SnackbarMessage">{toast.message}</span>
            {toast.showUndo && (
                <button type="button" className="SnackbarUndo" onClick={handleUndo}>
                    Undo
                </button>
            )}
            <button
                type="button"
                className="SnackbarDismiss"
                aria-label="Dismiss"
                onClick={() => dispatch(dismissToast())}
            >
                ✕
            </button>
        </div>
    );
};

export default Snackbar;
