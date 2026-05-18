import type { Schemas } from "@/schemas";

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
            return `Joypad button: ${binding.joypad_button}`
        case "joypad_axis":
            return `Joypad axis: ${binding.joypad_axis} ${binding.direction > 0 ? "+" : "-"}`
    }
}

export function capitalize(input: string) {
    const start = input[0];
    return input.replace(start, start.toUpperCase());
}

export function humanizeSnakeCase(input: string) {
    return input.split("_").map(capitalize).join(" ");
}