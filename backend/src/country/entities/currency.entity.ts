import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Currency {
  @PrimaryColumn({ length: 3 })
  code: string;

  @Column()
  name: string;

  @Column()
  symbol: string;
} 