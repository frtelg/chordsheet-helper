import React, { FunctionComponent } from "react";
import { useDispatch, useSelector } from "react-redux";
import TextArea from "../../Components/TextArea";
import { setSongText } from "../../Redux/Reducer/SongTextReducer";
import "./SongTextInput.css";

export type SongTextInputProps = {
  onSubmit(i: string): void;
};

const SongTextInput: FunctionComponent<SongTextInputProps> = ({ onSubmit }) => {
  const inputText = useSelector((state: ReduxState) => state.songText.value);
  const dispatch = useDispatch();

  const changedHandlerHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setSongText(e.target.value));
  };

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(inputText);
  };

  return (
    <div className="SongTextInput">
      <form onSubmit={submitHandler}>
        <TextArea inputText={inputText} onChange={changedHandlerHandler} />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default SongTextInput;
