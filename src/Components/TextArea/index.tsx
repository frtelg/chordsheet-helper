import React, { FunctionComponent } from "react";
import "./TextArea.css";

type TextAreaProps = {
  inputText: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
};
const TextArea: FunctionComponent<TextAreaProps> = ({
  inputText,
  onChange,
}) => (
  <div className="TextArea">
    <textarea
      value={inputText}
      onChange={onChange}
      disabled={onChange == null}
    />
  </div>
);

export default TextArea;
