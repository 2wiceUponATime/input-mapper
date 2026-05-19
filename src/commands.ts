import type { z } from "zod";
import { invoke } from "@tauri-apps/api/core"

export type JoypadEvent = {
    type: "button";
    index: number;
} | {
    type: "axis";
    index: number;
    direction: number;
}

export type ListEntry = {
    name: string;
    is_dir: boolean;
}

export async function read(file: string) {
    return invoke("read", { file }) as Promise<string>;
}

export async function readJSON<T extends z.ZodType>(file: string, schema: T): Promise<z.infer<T>> {
    return schema.parse(JSON.parse(await read(file)));
}

export async function list(dir: string) {
    return invoke("list", { dir }) as Promise<ListEntry[]>;
}

export async function write(file: string, content: string) {
    return invoke("write", { file, content }) as Promise<void>;
}

export function writeJSON(file: string, content: any) {
    return write(file, JSON.stringify(content));
}

export function startPollingJoypad() {
    return invoke("start_polling_joypad");
}