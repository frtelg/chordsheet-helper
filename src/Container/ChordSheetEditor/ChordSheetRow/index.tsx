import React, { FunctionComponent } from "react";
import Input from "../../../Components/Form/Input";
import copy from "copy-to-clipboard";
import { useSelector, useStore } from "react-redux";

type ChordSheetRowProps = {
  index: number;
  onChordInputBlur(e: React.FocusEvent<HTMLInputElement>): void;
  onLyricInputBlur(e: React.FocusEvent<HTMLInputElement>): void;
};
const ChordSheetRow: FunctionComponent<ChordSheetRowProps> = ({
  index,
  onChordInputBlur,
  onLyricInputBlur,
}) => {
  const chordSheet = useSelector((state: ReduxState) => state.chordSheet.value);
  const lyrics = useSelector((state: ReduxState) => state.songText.value);
  const { getState } = useStore<ReduxState>();

  const getChordValue = () => getState().chordSheet.value[index];
  const getLyricValue = () => getState().songText.value.split("/n")[index];

  const initialLyricValue = lyrics.split("\n")[index];

  return (
    <div className="SongTextRowContainer">
      <div className="ChordInputContainer">
        <Input
          className="ChordInput"
          initialValue={chordSheet[index]}
          onBlur={onChordInputBlur}
          placeholder="Enter chords..."
        />
        <div>
          <a onClick={() => copy(getChordValue())}>Copy</a>
        </div>
      </div>
      <div className="LyricInputContainer">
        {(initialLyricValue || "").trim() !== "" && (
          <Input initialValue={initialLyricValue} onBlur={onLyricInputBlur} />
        )}
        <a onClick={() => copy(getLyricValue())}>Copy</a>
      </div>
    </div>
  );
};

export default ChordSheetRow;
