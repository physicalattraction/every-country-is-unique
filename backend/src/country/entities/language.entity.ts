import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Language {
  @PrimaryColumn({ length: 3 })
  code: string;

  @Column()
  name: string;
} 