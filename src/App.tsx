import React from "react";
import { useSelector } from "react-redux";
import "./App.css";
import ChordSheetEditor from "./Container/ChordSheetEditor";
import ChordSheetResult from "./Container/ChordSheetResult";
import SongTextInput from "./Container/SongTextInput";

function App() {
  const songText = useSelector((state: ReduxState) => state.songText.value);
  const showResult = useSelector((state: ReduxState) => state.app.showResult);

  return (
    <div className="App">
      <SongTextInput onSubmit={(s) => window.alert(s)} />
      {!showResult && (
        <ChordSheetEditor onSubmit={() => console.log(songText)} />
      )}
      {showResult && <ChordSheetResult />}
    </div>
  );
}

export default App;
