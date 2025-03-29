// src/data-source.ts
import { DataSource } from "typeorm";
import { Country } from "./country/entities/country.entity";
import { Currency } from "./country/entities/currency.entity";
import { Language } from "./country/entities/language.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "every_country_is_unique",
    synchronize: false,
    logging: true,
    entities: [Country, Currency, Language],
    migrations: [__dirname + "/migrations/*{.ts,.js}"],
    migrationsRun: true,
    subscribers: [],
});