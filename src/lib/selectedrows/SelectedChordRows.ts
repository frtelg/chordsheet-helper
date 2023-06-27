export interface SelectedChordRows {
    from?: number;
    to?: number;
}

interface MutableSelectedChordRows extends SelectedChordRows {
    applyNewSelectedNumber(selectedRowNumber: number): SelectedChordRows;
}

class NothingSelected implements MutableSelectedChordRows {
    applyNewSelectedNumber(selectedRowNumber: number): SelectedChordRows {
        return {
            from: selectedRowNumber,
        };
    }
}

class OneRowSelected implements MutableSelectedChordRows {
    constructor(public from: number) {}

    applyNewSelectedNumber(selectedRowNumber: number): SelectedChordRows {
        if (this.from > selectedRowNumber) {
            return {
                from: selectedRowNumber,
                to: this.from,
            };
        }

        if (this.from < selectedRowNumber) {
            return {
                from: this.from,
                to: selectedRowNumber,
            };
        }

        return {
            from: undefined,
            to: undefined,
        };
    }
}

class RangeSelected implements MutableSelectedChordRows {
    constructor(public from: number, public to: number) {}

    applyNewSelectedNumber(selectedRowNumber: number): SelectedChordRows {
        if (this.from === this.to && selectedRowNumber === this.from) {
            return {};
        }

        if (selectedRowNumber === this.from) {
            return {
                from: selectedRowNumber + 1,
                to: this.to > selectedRowNumber + 1 ? this.to : undefined,
            };
        }

        if (selectedRowNumber < this.from) {
            return {
                to: this.to,
                from: selectedRowNumber,
            };
        }

        if (selectedRowNumber < this.to) {
            return {
                from: this.from,
                to: selectedRowNumber - 1,
            };
        }

        if (selectedRowNumber > this.to) {
            return {
                from: this.from,
                to: selectedRowNumber,
            };
        }

        return {
            from: this.from,
            to: selectedRowNumber > this.from ? selectedRowNumber - 1 : undefined,
        };
    }
}

function getCurrentSelectedRows(currentSelected: SelectedChordRows): MutableSelectedChordRows {
    const { from, to } = currentSelected;

    if (typeof from === 'undefined') return new NothingSelected(); // typeof from === 'undefined', otherwise 0 will be treated as undefined
    if (!to || from === to) return new OneRowSelected(from);
    return new RangeSelected(from, to);
}

export function determineSelectedRows(
    currentSelected: SelectedChordRows,
    selectedRowNumber: number
): SelectedChordRows {
    return getCurrentSelectedRows(currentSelected).applyNewSelectedNumber(selectedRowNumber);
}
