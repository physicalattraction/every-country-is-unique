import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CountryModule } from './country/country.module';
import { InitialSchema1743268591695 } from './migrations/1743268591695-InitialSchema';
import { Migration1745008305308 } from './migrations/1745008305308-migration';
import { PuzzleModule } from './puzzle/puzzle.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'every_country_is_unique',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            migrations: [InitialSchema1743268591695, Migration1745008305308],
            migrationsRun: true,
            synchronize: false,
        }),
        CountryModule,
        PuzzleModule,
    ],
})
export class AppModule { }
