import React, { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { transposeAll } from '@/redux/reducer/ChordSheetReducer';
import { mdiArrowUpBold, mdiArrowDownBold } from '@mdi/js';
import ClickableIcon from '@/components/ClickableIcon';

const Transposer: FunctionComponent = () => {
    const dispatch = useDispatch();
    const transposeUp = () => dispatch(transposeAll(1));
    const transposeDown = () => dispatch(transposeAll(-1));
    const { key } = useSelector((s: ReduxState) => s.chordSheet);

    return (
        <div className="Transposer">
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
            <span className="TransposerKey">{key ? `Key: ${key}` : 'Key: ?'}</span>
        </div>
    );
};

export default Transposer;
