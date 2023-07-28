export default class InvalidNoteException extends Error {
    constructor(input: string) {
        super(`Error parsing ${input}: Note not found`);
        this.name = 'InvalidNoteException';
    }
}
