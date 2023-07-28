import React from 'react';
import { useSelector } from 'react-redux';
import ChordSheetEditor from './container/ChordSheetEditor/ChordSheetEditor';
import ChordSheetResult from './container/ChordSheetResult/ChordSheetResult';
import SongTextInput from './container/SongTextInput/SongTextInput';

function App() {
    const showResult = useSelector((state: ReduxState) => state.app.showResult);

    return (
        <div className="App">
            <SongTextInput />
            {!showResult && <ChordSheetEditor />}
            {showResult && <ChordSheetResult />}
        </div>
    );
}

export default App;
