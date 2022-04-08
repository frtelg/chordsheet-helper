import React, { FunctionComponent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleShowResult } from "../../Redux/Reducer/AppReducer";
import { setChords } from "../../Redux/Reducer/ChordSheetReducer";
import { setSongText } from "../../Redux/Reducer/SongTextReducer";
import "./ChordSheetEditor.css";
import ChordSheetRow from "./ChordSheetRow";

const toSongTextArray = (text: string) => text.split("\n");

const SongTextInput: FunctionComponent = () => {
  const songText = useSelector(
    (state: ReduxState) => state.songText.value || ""
  );
  const chords = useSelector((state: ReduxState) => state.chordSheet.value);
  const dispatch = useDispatch();
  const [instrumentalPartsIndexes, setInstrumentalPartIndexes] = useState<
    number[]
  >([]);
  const [songTextArray, setSongTextArray] = useState(toSongTextArray(songText));

  useEffect(() => {
    const songTextArray = toSongTextArray(songText);
    setSongTextArray(songTextArray);
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

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(toggleShowResult());
  };

  const onSongTextInputBlurHandler = (
    e: React.FocusEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    const oldSongTextArray = [...toSongTextArray(songText)];
    const newSongTextArray = oldSongTextArray.map((r, i) =>
      i === index ? value : r
    );
    const newSongText = newSongTextArray.join("\n");

    dispatch(setSongText(newSongText));
  };

  const onChordInputBlurHandler = (newValue: string, lineIndex: number) => {
    const newChords = chords.map((v, i) => (i === lineIndex ? newValue : v));
    dispatch(setChords(newChords));
  };

  const hideChordsForEmptyLine = (lineIndex: number) =>
    instrumentalPartsIndexes.indexOf(lineIndex) === -1;

  const noSongTextSupplied =
    songTextArray.filter((t) => t.trim() !== "").length === 0;

  if (noSongTextSupplied) return null;

  return (
    <div className="ChordSheetEditor">
      <form onSubmit={submitHandler}>
        {songTextArray.map((r, i) =>
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
            <ChordSheetRow
              key={i}
              index={i}
              onChordInputBlur={(e) =>
                onChordInputBlurHandler(e.target.value, i)
              }
              onLyricInputBlur={(e) => onSongTextInputBlurHandler(e, i)}
            />
          )
        )}
        <button type="submit">Submit changes</button>
      </form>
    </div>
  );
};

export default SongTextInput;
