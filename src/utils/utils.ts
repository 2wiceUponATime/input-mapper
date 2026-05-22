import { Schemas } from "@/schemas";
import { useState } from "preact/hooks";

export function clamp(input: number, min: number, max: number) {
    return Math.min(Math.max(input, min), max);
}

/**
 * Create a function that triggers a re-render.
 */
export function ticker() {
    const [tick, setTick] = useState(0);
    return () => setTick(tick + 1);
}

/**
 * Move an item in an array. Assumes all items in `arr` are unique.
 * @param new_index The new index relative to the pre-move array.
 */
export function arrayMove<
    T extends any[]
>(arr: T, old_index: number, new_index: number) {
    if (old_index === new_index) return;
    if (new_index === 0) {
        const value: T[number] = arr.splice(old_index, 1)[0];
        arr.splice(0, 0, value);
        return arr;
    }
    const before = arr[new_index - 1];
    const value = arr.splice(old_index, 1)[0];
    arr.splice(arr.indexOf(before) + 1, 0, value);
    return arr;
}

export function defaultBindings(config: Schemas["AppConfig"], name: string = "Default") {
    return {
        name,
        set: Object.fromEntries(
            Object.entries(config.actions)
                .map(([k, v]) => [k, v.default])
        ),
    }
}