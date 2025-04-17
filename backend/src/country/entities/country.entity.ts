import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

import { Currency } from './currency.entity';
import { Language } from './language.entity';

@Entity()
export class Country {
    @PrimaryColumn({ length: 3 })
    code: string;

    @Column()
    name: string;

    @Column()
    flag: string;

    @ManyToMany(() => Currency)
    @JoinTable({
        name: 'country_currencies',
        joinColumn: {
            name: 'country_code',
            referencedColumnName: 'code',
        },
        inverseJoinColumn: {
            name: 'currency_code',
            referencedColumnName: 'code',
        },
    })
    currencies: Currency[];

    @ManyToMany(() => Language)
    @JoinTable({
        name: 'country_languages',
        joinColumn: {
            name: 'country_code',
            referencedColumnName: 'code',
        },
        inverseJoinColumn: {
            name: 'language_code',
            referencedColumnName: 'code',
        },
    })
    languages: Language[];
}
