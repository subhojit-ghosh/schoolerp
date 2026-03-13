import { apiReference } from "@scalar/nestjs-api-reference";
import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { API_DOCS } from "./constants";
import metadata from "./metadata";

export async function loadOpenApiPluginMetadata() {
  await SwaggerModule.loadPluginMetadata(() => metadata());
}

export function createOpenApiDocument(app: INestApplication) {
  const openApiConfig = new DocumentBuilder()
    .setTitle(API_DOCS.TITLE)
    .setDescription(API_DOCS.DESCRIPTION)
    .setVersion(API_DOCS.VERSION)
    .addTag(API_DOCS.TAGS.HEALTH)
    .addTag(API_DOCS.TAGS.PUBLIC)
    .addTag(API_DOCS.TAGS.AUTH)
    .addTag(API_DOCS.TAGS.ONBOARDING)
    .addTag(API_DOCS.TAGS.CAMPUSES)
    .addTag(API_DOCS.TAGS.ACADEMIC_YEARS)
    .addTag(API_DOCS.TAGS.ATTENDANCE)
    .addTag(API_DOCS.TAGS.INSTITUTIONS)
    .build();

  return SwaggerModule.createDocument(app, openApiConfig);
}

export async function configureOpenApi(app: INestApplication) {
  await loadOpenApiPluginMetadata();

  const openApiDocument = createOpenApiDocument(app);

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

  return openApiDocument;
}
