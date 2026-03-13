import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { API_DOCS } from "./constants";
import { createOpenApiDocument, loadOpenApiPluginMetadata } from "./openapi";

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  await loadOpenApiPluginMetadata();

  const openApiDocument = createOpenApiDocument(app);
  const outputPath = join(process.cwd(), API_DOCS.OPENAPI_OUTPUT_FILE_NAME);

  await writeFile(outputPath, JSON.stringify(openApiDocument, null, 2));
  await app.close();
}

void exportOpenApi().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
