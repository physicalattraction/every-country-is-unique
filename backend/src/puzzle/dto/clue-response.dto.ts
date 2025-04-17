export class ClueResponseDto {
    source: string;
    key: string;
    value: string;

    constructor(clue: any) {
        this.source = clue.source;
        this.key = clue.key;
        this.value = clue.value;
    }
} 