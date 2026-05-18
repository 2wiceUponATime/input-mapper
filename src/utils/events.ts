import { useState } from "preact/hooks";

export function isModifierKey(e: KeyboardEvent): boolean {
    return ['Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'FnLock',
        'Hyper', 'Meta', 'NumLock', 'ScrollLock', 'Shift', 'Super',
        'Symbol', 'SymbolLock'].includes(e.key);
}

export function ticker() {
    const [tick, setTick] = useState(0);
    return () => setTick(tick + 1);
}