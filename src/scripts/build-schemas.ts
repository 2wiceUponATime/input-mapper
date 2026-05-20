import schemas from "../schemas.ts";
import { mkdir, writeFile } from "node:fs/promises";
import z from "zod";

async function saveSchema(file: string, zod: z.ZodType) {
  const schema = z.toJSONSchema(zod);
  if (schema.type === "object") {
    schema.properties ??= {};
    schema.properties.$schema ??= { type: "string" };
  }
  return writeFile(
    `./schemas/${file}.schema.json`,
    JSON.stringify(schema, null, 2)
  );
}

await mkdir("schemas");
await saveSchema("input_config", schemas.InputConfig);
await saveSchema("app_config"  , schemas.AppConfig  );