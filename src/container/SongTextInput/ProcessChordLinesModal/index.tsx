import Modal from '@/components/Modal';
import React, { FunctionComponent } from 'react';

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
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="ProcessChordLinesModal">
                You entered a song with lines containing chords. Do you want to treat these lines as
                chords?
                <div className="ProcessChordLinesModalButtons">
                    <button onClick={onClose}>No, thanks</button>
                    <button onClick={processChordLines}>Yes</button>
                </div>
            </div>
        </Modal>
    );
};

export default ProcessChordLinesModal;
