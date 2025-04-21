import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { Country } from '../../country/entities/country.entity';
import { Clue } from './clue.entity';

@Entity()
@Unique(['deduplicationKey'])
export class Puzzle {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Country)
    @JoinColumn({ name: 'country_code', referencedColumnName: 'code' })
    country: Country;

    @OneToMany(() => Clue, clue => clue.puzzle, { cascade: true })
    clues: Clue[];

    @Column('simple-json', { nullable: true })
    alternativeCountries: string[][];

    @Column({ length: 32 })
    deduplicationKey: string;
}
