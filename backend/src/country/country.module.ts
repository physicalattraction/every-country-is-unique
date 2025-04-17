import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CountryController } from './controllers/country.controller';
import { Country } from './entities/country.entity';
import { Currency } from './entities/currency.entity';
import { Language } from './entities/language.entity';
import { CountrySeedService } from './services/country.seed';
import { CountryService } from './services/country.service';

@Module({
    imports: [TypeOrmModule.forFeature([Country, Language, Currency])],
    controllers: [CountryController],
    providers: [CountryService, CountrySeedService],
    exports: [CountryService],
})
export class CountryModule {}
