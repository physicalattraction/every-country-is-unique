import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Country } from '../../country/entities/country.entity';

@Entity()
export class Puzzle {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_code', referencedColumnName: 'code' })
  country: Country;

  @OneToMany('Clue', 'puzzle')
  clues: any[];
}