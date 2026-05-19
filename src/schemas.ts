import z from "zod";

const modifiers = {
  alt:   z.boolean(),
  shift: z.boolean(),
  ctrl:  z.boolean(),
  meta:  z.boolean(),
}

const BindingKey = z.object({
  type:  z.literal("key"),
  ...modifiers,
  name: z.string(),
});
const BindingMouse = z.object({
  type:  z.literal("mouse"),
  ...modifiers,
  index: z.int().min(0),
});
const BindingMouseWheel = z.object({
  type:  z.literal("mouse_wheel"),
  ...modifiers,
  direction: z.enum(["up", "down", "left", "right"])
});
const BindingJoypadButton = z.object({
  type: z.literal("joypad_button"),
  name: z.string(),
});
const BindingJoypadAxis = z.object({
  type: z.literal("joypad_axis"),
  name: z.string(),
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