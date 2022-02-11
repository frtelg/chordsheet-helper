import React from "react";
import { useDispatch, useSelector } from "react-redux";
import DownloadTextAsFileLink from "../../Components/DownloadTextAsFileLink";
import { toggleShowResult } from "../../Redux/Reducer/AppReducer";
import "./ChordSheetResult.css";

const toChordRow = (indexOfChord: number, chords: string[]) => {
  return (
    <React.Fragment>
      {chords.length > indexOfChord ? chords[indexOfChord] : ""} <br />
    </React.Fragment>
  );
};

const getDownloadLink = (songText: string, chords: string[]) => {
  const chordSheet = songText
    .split("\n")
    .map((r, i) => {
      const chordRow = chords.length > i ? `${chords[i] || ""}\n` : "";
      return chordRow + r;
    })
    .join("\n");

  const fileName = `${songText.split("\n")[0]}.txt`;

  return <DownloadTextAsFileLink fileName={fileName} text={chordSheet} />;
};

const ChordSheetResult = () => {
  const songText = useSelector((state: ReduxState) => state.songText.value);
  const chords = useSelector((state: ReduxState) => state.chordSheet.value);
  const dispatch = useDispatch();

  const doToggleEditMode = () => {
    dispatch(toggleShowResult());
  };

  return (
    <div className="ChordSheetResult">
      <div className="ChordSheetText">
        {songText.split("\n").map((r, i) => (
          <React.Fragment key={i}>
            {r === "" ? null : toChordRow(i, chords)}
            {r}
            <br />
          </React.Fragment>
        ))}
      </div>
      <button onClick={doToggleEditMode}>Edit</button>
      {getDownloadLink(songText, chords)}
    </div>
  );
};

export default ChordSheetResult;
