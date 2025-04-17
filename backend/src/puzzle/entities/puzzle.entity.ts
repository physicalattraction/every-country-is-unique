import { Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Country } from '../../country/entities/country.entity';
import { Clue } from './clue.entity';

@Entity()
export class Puzzle {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Country)
    @JoinColumn({ name: 'country_code', referencedColumnName: 'code' })
    country: Country;

    @OneToMany(() => Clue, clue => clue.puzzle)
    clues: Clue[];
}
