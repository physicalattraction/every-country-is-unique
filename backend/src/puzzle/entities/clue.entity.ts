import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Puzzle } from './puzzle.entity';

export interface IClue {
    source: string;
    key: string;
    value: string;
}

@Entity()
export class Clue {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    source: string;

    @Column('text')
    key: string;

    @Column()
    value: string;

    @ManyToOne(() => Puzzle, puzzle => puzzle.clues)
    @JoinColumn({ name: 'puzzle_id' })
    puzzle: Puzzle;
}
