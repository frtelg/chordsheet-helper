import React from 'react';
import { useSelector } from 'react-redux';
import ChordSheetEditor from '@/container/ChordSheetEditor';
import ChordSheetResult from '@/container/ChordSheetResult';
import SongTextInput from '@/container/SongTextInput';
import Snackbar from '@/components/Snackbar';

function App() {
    const showResult = useSelector((state: ReduxState) => state.app.showResult);

    return (
        <div className="App">
            <SongTextInput />
            {!showResult && <ChordSheetEditor />}
            {showResult && <ChordSheetResult />}
            <Snackbar />
        </div>
    );
}

export default App;
