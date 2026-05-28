import React from 'react';
import { useDispatch } from 'react-redux';
import ClickableIcon from '@/components/ClickableIcon';
import { undo } from '@/redux/reducer/CanonicalReducer';
import { mdiUndoVariant } from '@mdi/js';

interface HelpersBarProps {
    editLyricsToggled: boolean;
    toggeEditLyrics(): void;
}
const HelpersBar: React.FC<HelpersBarProps> = ({ toggeEditLyrics, editLyricsToggled }) => {
    const dispatch = useDispatch();

    return (
        <div className="HelpersBar">
            <label>
                <input
                    type="checkbox"
                    onChange={toggeEditLyrics}
                    value={editLyricsToggled.toString()}
                />
                Enable edit lyrics
            </label>
            <ClickableIcon
                path={mdiUndoVariant}
                onClick={() => dispatch(undo())}
                title="Undo last action"
            />
        </div>
    );
};

export default HelpersBar;
