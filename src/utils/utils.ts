import { useState } from "preact/hooks";

export function clamp(input: number, min: number, max: number) {
    return Math.min(Math.max(input, min), max);
}

export function ticker() {
    const [tick, setTick] = useState(0);
    return () => setTick(tick + 1);
}

/**
 * Assumes all items in `arr` are unique.
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