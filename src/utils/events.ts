
export function isModifierKey(e: KeyboardEvent): boolean {
    return ['Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'FnLock',
        'Hyper', 'Meta', 'NumLock', 'ScrollLock', 'Shift', 'Super',
        'Symbol', 'SymbolLock'].includes(e.key);
}

export function stopEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
}