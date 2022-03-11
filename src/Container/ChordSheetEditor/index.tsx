import React, { FunctionComponent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleShowResult } from "../../Redux/Reducer/AppReducer";
import { setChords } from "../../Redux/Reducer/ChordSheetReducer";
import { setSongText } from "../../Redux/Reducer/SongTextReducer";
import "./ChordSheetEditor.css";

const SongTextInput: FunctionComponent = () => {
  const songText = useSelector((state: ReduxState) => state.songText.value);
  const chords = useSelector((state: ReduxState) => state.chordSheet.value);
  const dispatch = useDispatch();
  const [instrumentalPartsIndexes, setInstrumentalPartIndexes] = useState<
    number[]
  >([]);

  const songTextArray = songText.split("\n");

  const [chordRowSelectionStartPoint, setChordRowSelectionStartPoint] =
    useState(null as number | null);
  const [selectedChordRows, setSelectedChordRows] = useState([] as number[]);

  useEffect(() => {
    if (songTextArray.length > chords.length) {
      const newChords = [
        ...chords,
        ...new Array<string>(songTextArray.length - chords.length).map(
          () => ""
        ),
      ];
      dispatch(setChords(newChords));
    }
  }, [songText]);

  useEffect(() => {
    if (selectedChordRows.length === 0 && chordRowSelectionStartPoint) {
      setChordRowSelectionStartPoint(null);
    }
  }, [selectedChordRows]);

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(toggleShowResult());
  };

  const onSongTextInputChangedHandler = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    const oldSongTextArray = [...songTextArray];
    const newSongTextArray = oldSongTextArray.map((r, i) =>
      i === index ? value : r
    );
    const newSongText = newSongTextArray.join("\n");

    dispatch(setSongText(newSongText));
  };

  const onChordInputChangedHandler = (newValue: string, lineIndex: number) => {
    const newChords = chords.map((v, i) => (i === lineIndex ? newValue : v));
    dispatch(setChords(newChords));
  };

  const hideChordsForEmptyLine = (lineIndex: number) =>
    instrumentalPartsIndexes.indexOf(lineIndex) === -1;

  const handleTab = (
    e: React.KeyboardEvent<HTMLInputElement>,
    lineIndex: number
  ) => {
    if (e.key === "Tab") {
      e.preventDefault();
      onChordInputChangedHandler(e.currentTarget.value + "    ", lineIndex);
    }
  };

  if (songText.trim() === "") return null;
  return (
    <div className="ChordSheetEditor">
      <form onSubmit={submitHandler}>
        {songText.split("\n").map((r, i) =>
          r.trim() === "" &&
          hideChordsForEmptyLine(i) &&
          (chords[i] === "" || !chords[i]) ? (
            <React.Fragment key={i}>
              <a
                onClick={() =>
                  setInstrumentalPartIndexes([...instrumentalPartsIndexes, i])
                }
              >
                Add row for instrumental part
              </a>
              <br />
            </React.Fragment>
          ) : (
            <div className="SongTextRowContainer" key={i}>
              <div className="ChordInputContainer">
                <input
                  key={i}
                  className="ChordInput"
                  value={chords[i] || ""}
                  onChange={(e) =>
                    onChordInputChangedHandler(e.target.value, i)
                  }
                  placeholder="Enter chords..."
                  onKeyDown={(e) => handleTab(e, i)}
                />
                {/* {(chordRowSelectionStartPoint == null ||
                  selectedChordRows[length - 1] === i - 1) && (
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChordRows([...selectedChordRows, i]);
                      } else if (selectedChordRows.indexOf(i) > -1) {
                        setSelectedChordRows(
                          selectedChordRows.filter((n) => n !== i)
                        );
                      }
                    }}
                  />
                )} */}
              </div>
              {r.trim() !== "" && (
                <input
                  value={r || ""}
                  key={r || `empty-row-${i}`}
                  onChange={(e) => onSongTextInputChangedHandler(e, i)}
                />
              )}
            </div>
          )
        )}
        <button type="submit">Submit changes</button>
      </form>
    </div>
  );
};

export default SongTextInput;
