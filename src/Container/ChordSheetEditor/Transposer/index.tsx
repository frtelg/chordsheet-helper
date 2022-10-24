import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { transposeAll } from '../../../Redux/Reducer/ChordSheetReducer';
import { mdiArrowUpBold, mdiArrowDownBold } from '@mdi/js';
import ClickableIcon from '../../../Components/ClickableIcon';

const Transposer: FunctionComponent = () => {
    const dispatch = useDispatch();
    const transposeUp = () => dispatch(transposeAll(1));
    const transposeDown = () => dispatch(transposeAll(-1));

    return (
        <div className="Transposer">
            <div>
                <ClickableIcon
                    path={mdiArrowDownBold}
                    size="1rem"
                    title="Transpose down"
                    onClick={transposeDown}
                />
                <ClickableIcon
                    path={mdiArrowUpBold}
                    size="1rem"
                    title="Transpose up"
                    onClick={transposeUp}
                />
            </div>
        </div>
    );
};

export default Transposer;
