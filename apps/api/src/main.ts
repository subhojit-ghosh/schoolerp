import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AppModule } from "./app.module";
import { API_DOCS } from "./constants/api-docs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const openApiConfig = new DocumentBuilder()
    .setTitle(API_DOCS.TITLE)
    .setDescription(API_DOCS.DESCRIPTION)
    .setVersion(API_DOCS.VERSION)
    .addTag(API_DOCS.TAGS.HEALTH)
    .addTag(API_DOCS.TAGS.ACADEMIC_YEARS)
    .addTag(API_DOCS.TAGS.INSTITUTIONS)
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  SwaggerModule.setup(API_DOCS.OPENAPI_PATH, app, openApiDocument, {
    ui: false,
    raw: ["json"],
    jsonDocumentUrl: API_DOCS.OPENAPI_JSON_PATH,
  });

  app.use(
    API_DOCS.REFERENCE_PATH,
    apiReference({
      theme: API_DOCS.THEMES.NEST,
      url: API_DOCS.OPENAPI_JSON_PATH,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
