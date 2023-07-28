import React, { FunctionComponent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetChords } from "../../Redux/Reducer/ChordSheetReducer";
import {
  resetSongText,
  setSongText,
} from "../../Redux/Reducer/SongTextReducer";

const SongTextInput: FunctionComponent = () => {
  const inputText = useSelector((state: ReduxState) => state.songText.value);
  const dispatch = useDispatch();

  const dispatchSongText = (text: string) => {
    dispatch(setSongText(text));
  };

  const changedHandlerHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    dispatchSongText(e.target.value);
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      dispatchSongText(e.currentTarget.value + "    ");
    }
  };

  const handleReset = () => {
    dispatch(resetSongText());
    dispatch(resetChords());
  };

  return (
    <div className="SongTextInput">
      <textarea
        value={inputText}
        onChange={changedHandlerHandler}
        onKeyDown={handleTab}
        placeholder="Enter or paste song lyrics here"
      />
      <button
        type="button"
        onClick={() => navigator.clipboard.readText().then(dispatchSongText)}
      >
        Paste from clipboard
      </button>
      <button type="button" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
};

export default SongTextInput;
