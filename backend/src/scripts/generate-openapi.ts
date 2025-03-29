import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import * as fs from 'fs';
import * as path from 'path';
import { getDataPath } from '../utils/path.utils';

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Every Country Is Unique API')
    .setDescription('The API for the Every Country Is Unique application')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Ensure the data directory exists in data
  const dataDir = getDataPath();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Write the OpenAPI spec to the data directory
  const openApiPath = path.join(dataDir, 'openapi.json');
  fs.writeFileSync(openApiPath, JSON.stringify(document, null, 2));

  await app.close();
  console.log('OpenAPI specification has been generated in:');
  console.log(`- ${openApiPath}`);
}

generateOpenApiSpec(); 