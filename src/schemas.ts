import z from "zod";
import type { writeFile as writeFileType } from "node:fs/promises";

let writeFile: typeof writeFileType;

async function saveSchema(file: string, zod: z.ZodType) {
  const schema = z.toJSONSchema(zod);
  if (schema.type == "object") {
    schema.properties ??= {};
    schema.properties.$schema ??= { type: "string" };
  }
  writeFile ??= (await import("node:fs/promises")).writeFile;
  return writeFile(`./schemas/${file}.schema.json`, JSON.stringify(schema, null, 2));
}

const BindingKey = z.object({
  type:  z.literal("key"),
  alt:   z.boolean(),
  shift: z.boolean(),
  ctrl:  z.boolean(),
  meta:  z.boolean(),
  code: z.string(),
});
const BindingMouse = z.object({
  type:  z.literal("mouse"),
  alt:   z.boolean(),
  shift: z.boolean(),
  ctrl:  z.boolean(),
  meta:  z.boolean(),
  mouse_button: z.int().min(0),
});
const BindingMouseWheel = z.object({
  type:  z.literal("mouse_wheel"),
  alt:   z.boolean(),
  shift: z.boolean(),
  ctrl:  z.boolean(),
  meta:  z.boolean(),
  direction: z.enum(["up", "down", "left", "right"])
});
const BindingJoypadButton = z.object({
  type: z.literal("joypad_button"),
  joypad_button: z.int().min(0),
});
const BindingJoypadAxis = z.object({
  type: z.literal("joypad_axis"),
  joypad_axis: z.int().min(0),
  direction: z.union([z.literal(-1), z.literal(1)]),
});
const Binding = z.union([
  BindingKey,
  BindingMouse,
  BindingMouseWheel,
  BindingJoypadButton,
  BindingJoypadAxis
]);
const BindingSet = z.record(z.string(), z.array(Binding));
const InputConfig = z.object({
  sets: z.array(z.tuple([
    z.string(),
    BindingSet,
  ])),
  active_set: z.int().min(0)
});
const AppConfig = z.object({
  name: z.string(),
  actions: z.record(z.string(), z.object({
    name: z.string().optional(),
    default: z.array(Binding),
  })),
})

const schemas = {
  Binding,
  BindingKey,
  BindingMouse,
  BindingMouseWheel,
  BindingJoypadButton,
  BindingJoypadAxis,
  BindingSet,
  InputConfig,
  AppConfig,
};

export default schemas;
export type Schemas = {
  [K in keyof typeof schemas]: z.infer<typeof schemas[K]>
};

if (import.meta.main && import.meta.env.DEV) {
  await saveSchema("input_config", InputConfig);
  await saveSchema("app_config"  , AppConfig  );
}