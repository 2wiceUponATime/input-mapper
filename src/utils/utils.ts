import { useState } from "preact/hooks";

export function clamp(input: number, min: number, max: number) {
    return Math.min(Math.max(input, min), max);
}

export function ticker() {
    const [tick, setTick] = useState(0);
    return () => setTick(tick + 1);
}
