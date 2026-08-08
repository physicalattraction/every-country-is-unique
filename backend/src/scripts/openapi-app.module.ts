import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CountryModule } from '../country/country.module';
import { HealthModule } from '../health/health.module';
import { PuzzleModule } from '../puzzle/puzzle.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,
        }),
        AuthModule,
        CountryModule,
        HealthModule,
        PuzzleModule,
    ],
})
export class OpenApiAppModule {}
