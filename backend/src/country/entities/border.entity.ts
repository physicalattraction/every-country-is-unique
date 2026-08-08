import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'borders' })
export class Border {
    @PrimaryColumn({ name: 'country1Code' })
    country1_code: string;

    @PrimaryColumn({ name: 'country2Code' })
    country2_code: string;

    constructor(country1Code: string, country2Code: string) {
        // Ensure country1Code is always less than country2Code
        if (country1Code < country2Code) {
            this.country1_code = country1Code;
            this.country2_code = country2Code;
        } else {
            this.country1_code = country2Code;
            this.country2_code = country1Code;
        }
    }
}
