import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CountrySeedService } from '../country/services/country.seed';
import { getDataPath } from './utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const seedService = app.get(CountrySeedService);
  await seedService.seed();
  await app.close();
}

bootstrap(); 