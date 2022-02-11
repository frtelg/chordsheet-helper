import React, { FunctionComponent, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleShowResult } from "../../Redux/Reducer/AppReducer";
import { setChords } from "../../Redux/Reducer/ChordSheetReducer";
import { setSongText } from "../../Redux/Reducer/SongTextReducer";
import "./ChordSheetEditor.css";

export type SongTextInputProps = {
  onSubmit(): void;
};

const SongTextInput: FunctionComponent<SongTextInputProps> = ({ onSubmit }) => {
  const songText = useSelector((state: ReduxState) => state.songText.value);
  const chords = useSelector((state: ReduxState) => state.chordSheet.value);
  const dispatch = useDispatch();

  const songTextArray = songText.split("\n");

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

  const onChordInputChangedHandler = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newChords = chords.map((v, i) => (i === index ? e.target.value : v));
    dispatch(setChords(newChords));
  };

  if (songText === "") return null;
  return (
    <div className="ChordSheetEditor">
      <form onSubmit={submitHandler}>
        {songText.split("\n").map((r, i) =>
          r.trim() === "" ? (
            <React.Fragment>
              {/* TODO implement */}
              <a>Add row for instrumental part</a>
              <br />
            </React.Fragment>
          ) : (
            <div className="SongTextRowContainer" key={i}>
              {chords.length > i && (
                <input
                  value={chords[i]}
                  onChange={(e) => onChordInputChangedHandler(e, i)}
                />
              )}
              <input
                value={r}
                key={i}
                onChange={(e) => onSongTextInputChangedHandler(e, i)}
              />
            </div>
          )
        )}
        <button type="submit">Submit changes</button>
      </form>
    </div>
  );
};

export default SongTextInput;
