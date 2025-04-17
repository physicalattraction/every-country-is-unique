import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { CountrySeedService } from '../country/services/country.seed';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const seedService = app.get(CountrySeedService);
    await seedService.seed();
    await app.close();
}

bootstrap();
