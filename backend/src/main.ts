import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as child_process from 'child_process';

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({
        origin: ['https://everycountryisunique.com', 'https://www.everycountryisunique.com', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    });

    // Log the current git commit hash
    try {
        const gitHash = child_process.execSync('git rev-parse HEAD').toString().trim();
        console.info(`Starting application with git commit: ${gitHash}`);
    } catch (error) {
        console.warn('Could not determine git commit hash:', error);
    }

    await app.listen(3001, '0.0.0.0');
}
bootstrap();
