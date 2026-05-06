import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CanonicalReducer, { setCanonical } from '@/redux/reducer/CanonicalReducer';
import AppReducer from '@/redux/reducer/AppReducer';
import ToastReducer from '@/redux/reducer/ToastReducer';
import SongTextInput from './index';

function makeStore(preloadedCanonical?: string) {
    return configureStore({
        reducer: { canonical: CanonicalReducer, app: AppReducer, toast: ToastReducer },
        preloadedState: preloadedCanonical
            ? {
                  canonical: {
                      value: preloadedCanonical,
                      history: [],
                      lineIds: [],
                      selected: { anchor: undefined, indexes: [] },
                      clipboard: [],
                      key: undefined,
                  },
              }
            : undefined,
    });
}

function renderInput(store = makeStore()) {
    render(
        <Provider store={store}>
            <SongTextInput />
        </Provider>
    );
    return store;
}

const getTextarea = () =>
    screen.getByPlaceholderText('Paste or type your song lyrics here…') as HTMLTextAreaElement;

describe('SongTextInput', () => {
    describe('basic text dispatch', () => {
        it('typing plain text dispatches setCanonical with that value', () => {
            const store = renderInput();
            fireEvent.change(getTextarea(), { target: { value: 'Amazing grace' } });
            expect(store.getState().canonical.value).toBe('Amazing grace');
        });

        it('clearing the textarea resets canonical to empty', () => {
            const store = makeStore('Amazing grace');
            renderInput(store);
            fireEvent.change(getTextarea(), { target: { value: '' } });
            expect(store.getState().canonical.value).toBe('');
        });

        it('bracketed chord notation is dispatched as-is', () => {
            const store = renderInput();
            fireEvent.change(getTextarea(), { target: { value: '[Am]Amazing grace' } });
            expect(store.getState().canonical.value).toBe('[Am]Amazing grace');
        });
    });

    describe('bare bracket passthrough', () => {
        it('backspace deleting "]" of [Am] leaves "[Am" in canonical', () => {
            const store = makeStore('[Am]Amazing grace');
            renderInput(store);
            fireEvent.change(getTextarea(), { target: { value: '[AmAmazing grace' } });
            expect(store.getState().canonical.value).toBe('[AmAmazing grace');
        });

        it('forward-delete of "[" of [Am] leaves "Am]" in canonical', () => {
            const store = makeStore('[Am]Amazing grace');
            renderInput(store);
            fireEvent.change(getTextarea(), { target: { value: 'Am]Amazing grace' } });
            expect(store.getState().canonical.value).toBe('Am]Amazing grace');
        });

        it('typing literal "[" is accepted as lyric', () => {
            const store = makeStore('love me');
            renderInput(store);
            fireEvent.change(getTextarea(), { target: { value: 'love [me' } });
            expect(store.getState().canonical.value).toBe('love [me');
        });
    });

    describe('renderOverLyrics', () => {
        it('consecutive instrumental rows render without blank between them', () => {
            const store = makeStore('| [G] | [D] |\n| [C] | [F] |');
            renderInput(store);
            fireEvent.click(screen.getByRole('button', { name: 'Chords over lyrics' }));
            expect(getTextarea().value).toBe('| G | D |\n| C | F |');
        });

        it('blank line before instrumental is preserved', () => {
            const store = makeStore('Key: Em\n\n| [G] | [D] |');
            renderInput(store);
            fireEvent.click(screen.getByRole('button', { name: 'Chords over lyrics' }));
            expect(getTextarea().value).toBe('Key: Em\n\n| G | D |');
        });

        it('blank between lyric rows is preserved', () => {
            const store = makeStore('[Am]Amazing grace\n\n[G]How sweet the sound');
            renderInput(store);
            fireEvent.click(screen.getByRole('button', { name: 'Chords over lyrics' }));
            expect(getTextarea().value).toBe('Am\nAmazing grace\n\nG\nHow sweet the sound');
        });

        it('blank between instrumental and following lyric is preserved', () => {
            const store = makeStore('| [G] | [D] |\n\nVerse 1:\n[Am]Amazing grace');
            renderInput(store);
            fireEvent.click(screen.getByRole('button', { name: 'Chords over lyrics' }));
            expect(getTextarea().value).toBe('| G | D |\n\nVerse 1:\nAm\nAmazing grace');
        });
    });

    describe('format toggle', () => {
        it('renders Bracketed and Chords over lyrics buttons', () => {
            renderInput();
            expect(screen.getByRole('button', { name: 'Bracketed' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Chords over lyrics' })).toBeInTheDocument();
        });

        it('Bracketed button is active by default', () => {
            renderInput();
            expect(screen.getByRole('button', { name: 'Bracketed' })).toHaveClass('active');
            expect(screen.getByRole('button', { name: 'Chords over lyrics' })).not.toHaveClass(
                'active'
            );
        });

        it('clicking Chords over lyrics activates that button', () => {
            renderInput();
            fireEvent.click(screen.getByRole('button', { name: 'Chords over lyrics' }));
            expect(screen.getByRole('button', { name: 'Chords over lyrics' })).toHaveClass(
                'active'
            );
            expect(screen.getByRole('button', { name: 'Bracketed' })).not.toHaveClass('active');
        });

        it('over-lyrics mode: textarea shows chord line above lyric line', () => {
            const store = makeStore('[Am]Amazing grace');
            renderInput(store);
            fireEvent.click(screen.getByRole('button', { name: 'Chords over lyrics' }));
            const ta = getTextarea();
            // In over-lyrics mode the chord appears on its own line
            expect(ta.value).toContain('Am');
            expect(ta.value).toContain('Amazing grace');
        });

        it('over-lyrics mode: change converts back to bracketed canonical', () => {
            const store = makeStore();
            renderInput(store);
            // First touch with plain lyrics so the modal doesn't fire
            fireEvent.change(getTextarea(), { target: { value: 'love me' } });
            fireEvent.click(screen.getByRole('button', { name: 'Chords over lyrics' }));
            fireEvent.change(getTextarea(), { target: { value: 'Am\nlove me' } });
            expect(store.getState().canonical.value).toBe('[Am]love me');
        });

        it('switching back to bracketed shows bracketed value', () => {
            const store = makeStore('[Am]Amazing grace');
            renderInput(store);
            fireEvent.click(screen.getByRole('button', { name: 'Chords over lyrics' }));
            fireEvent.click(screen.getByRole('button', { name: 'Bracketed' }));
            expect(getTextarea().value).toBe('[Am]Amazing grace');
        });
    });
});
