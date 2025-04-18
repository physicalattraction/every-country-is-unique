export interface ClueInput {
    source: string;
    key: string;
    value: string;
}

export class ClueResponseDto {
    source: string;
    key: string;
    value: string;

    constructor(clue: ClueInput) {
        this.source = clue.source;
        this.key = clue.key;
        this.value = clue.value;
    }
}
