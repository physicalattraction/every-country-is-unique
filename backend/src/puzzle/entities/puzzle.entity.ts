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
  // Using any[] to avoid circular dependency with Clue entity
  // We use string literal 'Clue' in @OneToMany decorator for the same reason
  clues: any[];
}