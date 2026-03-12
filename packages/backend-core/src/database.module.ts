import { createCachedDatabase } from "@repo/database";
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import databaseConfig from "./database.config";

export const DATABASE = Symbol("DATABASE");

@Global()
@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
  providers: [
    {
      provide: DATABASE,
      inject: [databaseConfig.KEY],
      useFactory: (config: ConfigType<typeof databaseConfig>) => {
        return createCachedDatabase(config.url as string);
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
