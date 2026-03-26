import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { configureOpenApi } from "./openapi";

function isAllowedFrontendOrigin(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  const configuredFrontendUrl = process.env.ERP_FRONTEND_URL;

  if (configuredFrontendUrl && origin === configuredFrontendUrl) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);

    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "erp.test" ||
      hostname.endsWith(".erp.test")
    );
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      callback(null, isAllowedFrontendOrigin(origin));
    },
    credentials: true,
  });
  app.use(cookieParser());

  await configureOpenApi(app);

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
