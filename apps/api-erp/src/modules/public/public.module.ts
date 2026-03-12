import { Module } from "@nestjs/common";
import { TenantContextModule } from "../tenant-context/tenant-context.module";
import { PublicController } from "./public.controller";
import { PublicService } from "./public.service";

@Module({
  imports: [TenantContextModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
