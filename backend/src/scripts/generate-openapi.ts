import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import * as fs from 'fs';
import * as path from 'path';
import { getDataPath } from './utils';

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Every Country Is Unique API')
    .setDescription('The API for the Every Country Is Unique application')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Ensure the docs directory exists in data
  const docsDir = path.join(getDataPath(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Write the OpenAPI spec to the docs directory
  const openApiPath = path.join(docsDir, 'openapi.json');
  fs.writeFileSync(openApiPath, JSON.stringify(document, null, 2));

  await app.close();
  console.log('OpenAPI specification has been generated in:');
  console.log(`- ${openApiPath}`);
}

generateOpenApiSpec(); 