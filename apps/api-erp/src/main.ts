import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { configureOpenApi } from "./openapi";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendUrl = process.env.ERP_FRONTEND_URL ?? "http://localhost:5173";

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  app.use(cookieParser());

  await configureOpenApi(app);

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
