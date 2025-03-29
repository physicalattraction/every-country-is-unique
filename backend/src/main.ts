import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { CountrySeedService } from './country/services/country.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  
  // Seed the database
  const countrySeedService = app.get(CountrySeedService);
  await countrySeedService.seed();
  
  await app.listen(3001, '0.0.0.0');
}
bootstrap(); 