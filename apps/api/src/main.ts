import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureOpenApi } from "./openapi";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await configureOpenApi(app);

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
