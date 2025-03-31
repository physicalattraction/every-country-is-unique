import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

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

  @ManyToOne('Puzzle')
  @JoinColumn({ name: 'puzzle_id' })
  // Using 'any' type to avoid circular dependency with Puzzle entity
  puzzle: any;
} 