import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Country {
  @PrimaryColumn({ length: 3 })
  code: string;

  @Column()
  name: string;

  @Column()
  flag: string;
} 