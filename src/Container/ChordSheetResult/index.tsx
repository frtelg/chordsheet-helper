import React from "react";
import { useDispatch, useSelector } from "react-redux";
import DownloadTextAsFileLink from "../../Components/DownloadTextAsFileLink";
import { toggleShowResult } from "../../Redux/Reducer/AppReducer";
import "./ChordSheetResult.css";

type ChordSheetLine = {
  text: string;
  lineType: "chord" | "text";
};

const ChordSheetResult = () => {
  const songText = useSelector((state: ReduxState) => state.songText.value);
  const chords = useSelector((state: ReduxState) => state.chordSheet.value);
  const dispatch = useDispatch();

  const doToggleEditMode = () => {
    dispatch(toggleShowResult());
  };

  const chordSheetList: ChordSheetLine[] = songText
    .split("\n")
    .flatMap((r, i) => {
      const textLineEntry: ChordSheetLine = { text: r, lineType: "text" };
      const chordLine = `${chords[i] || ""}`;

      return chordLine.trim() === ""
        ? [textLineEntry]
        : [{ text: chordLine, lineType: "chord" }, textLineEntry];
    });

  const getTextFileName = () =>
    `${songText.split("\n").filter((l) => l.trim() !== "")[0]}.txt`;

  return (
    <div className="ChordSheetResult">
      <div className="ChordSheetText" style={{ whiteSpace: "pre" }}>
        {chordSheetList.map((r, i) => (
          <React.Fragment key={i}>
            {r.lineType === "chord" ? <b>{r.text}</b> : r.text}
            <br />
          </React.Fragment>
        ))}
      </div>
      <div className="ResultButtons">
        <button onClick={doToggleEditMode}>Edit</button>
        <DownloadTextAsFileLink
          fileName={getTextFileName()}
          text={chordSheetList.map((l) => l.text).join("\n")}
        />
      </div>
    </div>
  );
};

export default ChordSheetResult;
