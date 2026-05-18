import type { z } from "zod";
import type { invoke as invokeType } from "@tauri-apps/api/core"
let invoke: typeof invokeType;
if ("__TAURI_INTERNALS__" in window) {
    invoke = (await import("@tauri-apps/api/core")).invoke;
}

type ListEntry = {
    name: string;
    is_dir: boolean;
}

export function read(file: string) {
    if (!invoke) {
        if (file.startsWith("apps/")) return JSON.stringify({
            "name": "Dummy",
            "actions": {
                "dummy_action": {
                    "default": [{
                        "type": "key",
                        "code": "KeyE",
                        "alt":   false,
                        "shift": false,
                        "ctrl":  false,
                        "meta":  false,
                    }]
                }
            }
        });
        throw "No such file or directory";
    }
    return invoke("read", { file }) as Promise<string>;
}

export async function readJSON<T extends z.ZodType>(file: string, schema: T): Promise<z.infer<T>> {
    return schema.parse(JSON.parse(await read(file)));
}

export function list(dir: string) {
    if (!invoke) return [{
        name: "dummy.json",
        is_dir: false,
    }]
    return invoke("list", { dir }) as Promise<ListEntry[]>;
}

export function write(file: string, content: string) {
    if (!invoke) return;
    return invoke("write", { file, content }) as Promise<void>;
}

export function writeJSON(file: string, content: any) {
    return write(file, JSON.stringify(content));
}