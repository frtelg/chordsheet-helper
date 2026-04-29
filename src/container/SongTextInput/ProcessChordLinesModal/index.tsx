import Modal from '@/components/Modal';
import React, { FunctionComponent, KeyboardEvent } from 'react';

interface ProcessChordLinesModalProps {
    isOpen: boolean;
    onClose: () => void;
    processChordLines: () => void;
}

const ProcessChordLinesModal: FunctionComponent<ProcessChordLinesModalProps> = ({
    isOpen,
    onClose,
    processChordLines,
}) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            processChordLines();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="ProcessChordLinesModal" onKeyDown={handleKeyDown}>
                You entered a song with lines containing chords. Do you want to treat these lines as
                chords?
                <div className="ProcessChordLinesModalButtons">
                    <button onClick={onClose}>No, thanks</button>
                    <button className="btn-primary" onClick={processChordLines} autoFocus>
                        Yes
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ProcessChordLinesModal;
