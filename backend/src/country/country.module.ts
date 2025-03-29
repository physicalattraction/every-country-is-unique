import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/country.entity';
import { CountryService } from './services/country.service';
import { CountryController } from './controllers/country.controller';
import { CountrySeedService } from './services/country.seed';

@Module({
  imports: [TypeOrmModule.forFeature([Country])],
  controllers: [CountryController],
  providers: [CountryService, CountrySeedService],
  exports: [CountryService],
})
export class CountryModule {} 