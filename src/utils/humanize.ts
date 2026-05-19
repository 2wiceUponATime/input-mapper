import type { Schemas } from "@/schemas";

const joypadButtons: Record<number, string> = {
    0: "South",
    1: "East",
    2: "West",
    3: "North",
    4: "Select",
    5: "Mode",
    6: "Start",
    7: "Left Stick",
    8: "Right Stick",
    9: "Left Shoulder",
    10: "Right Shoulder",
    11: "D-Pad Up",
    12: "D-Pad Down",
    13: "D-Pad Left",
    14: "D-Pad Right",
}

const axis: Record<number, string> = {
    [-1]: "Negative",
      1 : "Positive",
}

const axisX: Record<number, string> = {
    [-1]: "Left",
      1 : "Right",
}

const axisY: Record<number, string> = {
    [-1]: "Down",
      1 : "Up",
}

function getPrefix(binding: Schemas["BindingKey" | "BindingMouse" | "BindingMouseWheel"]) {
    let result = "";
    if (binding.alt  ) result += "Alt + ";
    if (binding.shift) result += "Shift + ";
    if (binding.ctrl ) result += "Ctrl + ";
    if (binding.meta ) result += "Meta + ";
    return result;
}

function humanizeKey(code: string) {
    code = code.replace(/^Key/, "");
    const directionSuffixRegex = /(Up|Down|Left|Right)$/;
    const matches = code.match(directionSuffixRegex)
    if (matches) {
        const match = matches[0];
        code = match + code.replace(directionSuffixRegex, "");
    }
    if (code.match(/^F\d+$/)) return code;
    return code.replace(/(?<!^)(?=[A-Z\d])/g, " ");
}

export function humanizeBinding(binding: Schemas["Binding"]) {
    switch (binding.type) {
        case "key":
            return `${getPrefix(binding)}${humanizeKey(binding.code)} (Physical QWERTY key)`
        case "mouse":
            const prefix = getPrefix(binding);
            switch (binding.mouse_button) {
                case 0:
                    return prefix + "Mouse Left"
                case 1:
                    return prefix + "Mouse Middle"
                case 2:
                    return prefix + "Mouse Right"
                default:
                    return `Mouse button: ${prefix}${binding.mouse_button}`
            }
        case "mouse_wheel":
            return `${getPrefix(binding)}Mouse Wheel ${capitalize(binding.direction)}`
        case "joypad_button":
            const index = binding.joypad_button;
            const name = joypadButtons[index];
            return name
                ? `${name} - Joypad`
                : `Button ${index} - Joypad`
        case "joypad_axis":
            switch (binding.joypad_axis) {
                case 0:
                    return  `Left Stick ${axisX[binding.direction]} (Joypad)`;
                case 1:
                    return  `Left Stick ${axisY[binding.direction]} (Joypad)`;
                case 2:
                    return `Right Stick ${axisX[binding.direction]} (Joypad)`;
                case 3:
                    return `Right Stick ${axisY[binding.direction]} (Joypad)`;
                case 4:
                    if (binding.direction > 0) return  "Left Trigger (Joypad)";
                    break;
                case 5:
                    if (binding.direction > 0) return "Right Trigger (Joypad)";
                    break;
            }
            return `Axis ${binding.joypad_axis} ${axis[binding.direction]} (Joypad)`
    }
}

export function capitalize(input: string) {
    const start = input[0];
    return input.replace(start, start.toUpperCase());
}

export function humanizeSnakeCase(input: string) {
    return input.split("_").map(capitalize).join(" ");
}