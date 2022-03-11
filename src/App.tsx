import React from "react";
import { useSelector } from "react-redux";
import "./App.css";
import ChordSheetEditor from "./Container/ChordSheetEditor";
import ChordSheetResult from "./Container/ChordSheetResult";
import SongTextInput from "./Container/SongTextInput";

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
