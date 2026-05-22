import z from "zod";

const buttons = [
  "South",
  "East",
  "North",
  "West",
  "C",
  "Z",
  "LeftTrigger",
  "LeftTrigger2",
  "RightTrigger",
  "RightTrigger2",
  "Select",
  "Start",
  "Mode",
  "LeftThumb",
  "RightThumb",
  "DPadUp",
  "DPadDown",
  "DPadLeft",
  "DPadRight",
  "Unknown"
] as const;

const axes = [
  "LeftStickX",
  "LeftStickY",
  "LeftZ",
  "RightStickX",
  "RightStickY",
  "RightZ",
  "DPadX",
  "DPadY",
  "Unknown",
] as const;

export type JoypadButton = typeof buttons[number];
export type JoypadAxis   = typeof axes   [number];

const modifiers = {
  alt:   z.boolean().describe("If the binding uses the Alt key"),
  shift: z.boolean().describe("If the binding uses the Shift key"),
  ctrl:  z.boolean().describe("If the binding uses the Ctrl key"),
  meta:  z.boolean().describe("If the binding uses the Meta \
(Windows/Command/Super) key"),
}

const BindingKey = z.object({
  type:  z.literal("key"),
  ...modifiers,
  name: z.string().describe("The browser `KeyboardEvent.code` value that \
corresponds with the binding"),
});
const BindingMouse = z.object({
  type:  z.literal("mouse"),
  ...modifiers,
  index: z.int().min(0).describe("The browser `MouseEvent.button` value that \
corresponds with the binding"),
});
const BindingMouseWheel = z.object({
  type:  z.literal("mouse_wheel"),
  ...modifiers,
  direction: z.enum(["up", "down", "left", "right"])
});
const BindingJoypadButton = z.object({
  type: z.literal("joypad_button"),
  name: z.enum(buttons)
});
const BindingJoypadAxis = z.object({
  type: z.literal("joypad_axis"),
  name: z.enum(axes),
  direction: z.union([z.literal(-1), z.literal(1)]).describe("Negative is \
left for X and down for Y; positive is the opposite."),
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
  sets: z.array(z.object({
    name: z.string(),
    set: BindingSet,
  })),
  active_set: z.int().min(0).describe("The index of the set currently in use"),
});
const AppConfig = z.object({
  name: z.string().describe("The app name"),
  actions: z.record(z.string(), z.object({
    name: z.string().optional().describe("Override the humanized input name"),
    default: z.array(Binding).describe("The default set of bindings for the \
action"),
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