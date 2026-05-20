import type { Schemas } from "@/schemas";

const axis: Record<number, string> = {
    [-1]: "Negative",
      1 : "Positive",
}

const axisXY: Record<string, Record<number, string>> = {
    X: {
        [-1]: "Left",
        1 : "Right",
    },
    Y: {
        [-1]: "Down",
        1 : "Up",
    }
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
    return humanizeCamelCase(code);
}

export function humanizeBinding(binding: Schemas["Binding"]) {
    switch (binding.type) {
        case "key":
            return `${getPrefix(binding)}${humanizeKey(binding.name)} (QWERTY key position)`
        case "mouse":
            const prefix = getPrefix(binding);
            switch (binding.index) {
                case 0:
                    return prefix + "Mouse Left"
                case 1:
                    return prefix + "Mouse Middle"
                case 2:
                    return prefix + "Mouse Right"
                default:
                    return `Mouse button: ${prefix}${binding.index}`
            }
        case "mouse_wheel":
            return `${getPrefix(binding)}Mouse Wheel ${capitalize(binding.direction)}`
        case "joypad_button":
            return `${humanizeCamelCase(binding.name)} (Joypad)`
        case "joypad_axis":
            const split = binding.name.split(/(?=[XY]$)/);
            if (split.length > 1) {
                const axis = humanizeCamelCase(split[0]);
                const direction = axisXY[split[1]][binding.direction];
                return `${axis} ${direction} (Joypad)`
            }
            return `Axis ${binding.name} ${axis[binding.direction]} (Joypad)`
    }
}

export function capitalize(input: string) {
    const start = input[0];
    return input.replace(start, start.toUpperCase());
}

export function humanizeSnakeCase(input: string) {
    return input.split("_").map(capitalize).join(" ");
}

function humanizeCamelCase(input: string) {
    return input.replace(/(?<!^)([A-Z0-9])/g, " $1");
}