import { PluginMetadataGenerator } from "@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator";
import { ReadonlyVisitor } from "@nestjs/swagger/dist/plugin/visitors/readonly.visitor";

const generator = new PluginMetadataGenerator();
const SHOULD_WATCH = process.argv.includes("--watch");

generator.generate({
  visitors: [
    new ReadonlyVisitor({
      dtoFileNameSuffix: [".dto.ts"],
      controllerFileNameSuffix: [".controller.ts"],
      classValidatorShim: false,
      introspectComments: true,
      pathToSource: __dirname,
    }),
  ],
  outputDir: __dirname,
  tsconfigPath: "tsconfig.json",
  watch: SHOULD_WATCH,
  filename: "metadata.ts",
});
