import React, { FunctionComponent } from "react";
import { useDispatch } from "react-redux";
import { transposeAll } from "../../../Redux/Reducer/ChordSheetReducer";

const Transposer: FunctionComponent = () => {
  const dispatch = useDispatch();
  const transposeUp = () => dispatch(transposeAll(1));
  const transposeDown = () => dispatch(transposeAll(-1));

  return (
    <div className="Transposer">
      <span>Transpose:</span>
      <div>
        <button type="button" onClick={transposeDown}>
          {"Down"}
        </button>
        <button type="button" onClick={transposeUp}>
          {"Up"}
        </button>
      </div>
    </div>
  );
};

export default Transposer;
