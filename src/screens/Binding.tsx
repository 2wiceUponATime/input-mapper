import Screen, { ScreenProps } from "./Screen";
import create from "@/assets/icons/create.svg";
import deleteIcon from "@/assets/icons/delete.svg";
import move from "@/assets/icons/move.svg";
import type { Schemas } from "@/schemas";
import { capitalize, humanizeBinding } from "@/utils/humanize";
import { useEffect, useRef, useState } from "preact/hooks";
import { isModifierKey, stopEvent } from "@/utils/events";
import { arrayMove, ticker } from "@/utils/utils";
import { JoypadEvent, startPollingJoypad } from "@/commands";
import { Event as TauriEvent, listen } from "@tauri-apps/api/event";

type Binding = Schemas["Binding"] | { type: null };

export default function BindingScreen(props: ScreenProps & {
    bindings: Binding[] | null;
    onSave: () => unknown;
}) {
    const [listening, setListening] = useState(-1);
    const [drag, setDrag] = useState(-1);
    const [mouseY, setMouseY] = useState(0);

    const dragRef            = useRef<HTMLLIElement   >(null);
    const listRef            = useRef<HTMLUListElement>(null);
    const dragPlaceholderRef = useRef<HTMLLIElement   >(null);

    const tick = ticker();
    const { bindings, onSave } = props;

    function stopListening() {
        setListening(-1);
        onSave();
    }

    useEffect(() => {
        function onContextMenu(event: Event) {
            if (listening === -1) return;
            event.preventDefault();
        }
        let meta = false;
        function onKeyDown(event: KeyboardEvent) {
            if (["Meta", "Super", "OS"].includes(event.key)) {
                meta = true;
            }
            if (listening === -1 || !bindings || isModifierKey(event)) return;
            event.preventDefault();
            bindings[listening] = {
                type: "key",
                name: event.code,
                alt:   event.altKey,
                shift: event.shiftKey,
                ctrl:  event.ctrlKey,
                meta,
            };
            stopListening();
        }
        function onKeyUp(event: KeyboardEvent) {
            if (["OSLeft", "MetaLeft", "Super"].includes(event.key)) {
                meta = false;
            }
        }
        function onMouseDown(event: MouseEvent) {
            if (listening === -1 || !bindings) return;
            event.preventDefault();
            bindings[listening] = {
                type: "mouse",
                index: event.button,
                alt:   event.altKey,
                shift: event.shiftKey,
                ctrl:  event.ctrlKey,
                meta,
            };
            stopListening();
        }
        function onWheel(event: WheelEvent) {
            if (listening === -1 || !bindings) return;
            event.preventDefault();
            const isX = Math.abs(event.deltaX) >= Math.abs(event.deltaY);
            let direction: "up" | "down" | "left" | "right";
            if (isX) {
                direction = event.deltaX > 0 ? "right" : "left";
            } else {
                direction = event.deltaY > 0 ? "down"  : "up"  ;
            }
            bindings[listening] = {
                type: "mouse_wheel",
                direction,
                alt:   event.altKey,
                shift: event.shiftKey,
                ctrl:  event.ctrlKey,
                meta,
            };
            stopListening();
        }
        function onMouseMove(event: MouseEvent) {
            setMouseY(event.y);
        }
        function onMouseUp() {
            setDrag(-1);
            if (!dragRef.current
                || !dragPlaceholderRef.current
                || !listRef.current
                || drag === -1
                || !bindings) return;
            const dragRect = dragRef.current.getBoundingClientRect();
            const dragCenterY = dragRect.y + dragRect.height / 2;
            const placeholderRect = dragPlaceholderRef
                .current
                .getBoundingClientRect();
            const deltaY = Math.abs(dragRect.y - placeholderRect.y);
            if (deltaY <= dragRect.height) {
                return;
            }
            const items = Array.from(listRef.current.children)
                .filter(child => !child.hasAttribute("data-dragging"));
            let totalHeight = 0;
            let firstY: number | null = null;
            for (const [index, item] of items.entries()) {
                const rect = item.getBoundingClientRect();
                firstY ??= rect.y;
                totalHeight += rect.height;
                const deltaY = Math.abs(dragCenterY - rect.y);
                if (deltaY < dragRect.height / 3) {
                    arrayMove(bindings, drag, index);
                    return;
                }
                if (index === items.length - 1) {
                    const endY = rect.y + rect.height;
                    const deltaY = Math.abs(dragCenterY - endY);
                    if (deltaY < dragRect.height / 3 || dragCenterY > endY) {
                        arrayMove(bindings, drag, index + 1);
                        return;
                    }
                }
            }
            if (firstY && dragCenterY < firstY) {
                arrayMove(bindings, drag, 0);
            }
        }
        function onJoypadEvent({ payload: event }: TauriEvent<JoypadEvent>) {
            if (listening === -1 || !bindings) return;
            bindings[listening] = event.type === "button" ? {
                type: "joypad_button",
                name: event.value,
            } : {
                type: "joypad_axis",
                name: event.value,
                direction: Math.sign(event.direction) as -1 | 1,
            };
            stopListening();
        }

        window.addEventListener("keydown"    , onKeyDown    );
        window.addEventListener("keyup"      , onKeyUp      );
        window.addEventListener("mouseup"    , onMouseDown  );
        window.addEventListener("contextmenu", onContextMenu);
        window.addEventListener("wheel"      , onWheel      );
        window.addEventListener("mousemove"  , onMouseMove  );
        window.addEventListener("mouseup"    , onMouseUp    );
        const unlisten = listen<JoypadEvent>("joypad", onJoypadEvent);
        return () => {
            window.removeEventListener("keydown",     onKeyDown    );
            window.removeEventListener("keyup"      , onKeyUp      );
            window.removeEventListener("mouseup",     onMouseDown  );
            window.removeEventListener("contextmenu", onContextMenu);
            window.removeEventListener("wheel"      , onWheel      );
            window.removeEventListener("mousemove"  , onMouseMove  );
            window.removeEventListener("mouseup"    , onMouseUp    );
            unlisten.then(value => value());
        };
    });

    const isLast = bindings ? drag === bindings.length - 1 : null;

    return (
        <Screen {...props}>
            <ul className="list" ref={listRef}>
                {bindings && bindings.map((binding, index) => {
                    const isDragging = drag === index;
                    const dragElemHeight = dragRef
                        .current
                        ?.getBoundingClientRect()
                        .height ?? 0;
                    return <>
                        {isDragging && <li
                            className={"list-item drag-placeholder"
                                + (isLast ? " bottom" : "")}
                            ref={dragPlaceholderRef}
                            style={{ height: dragElemHeight }}
                        />}
                        <li
                            className={"list-item"
                                + (isDragging ? " bottom" : "")}
                            data-dragging = {isDragging ? "" : null}
                            ref={isDragging ? dragRef : undefined}
                            style={isDragging ? {
                                position: "fixed",
                                width: "100vw",
                                top: mouseY - dragElemHeight / 2,
                                left: 0,
                            } : {}}
                        >
                            <img
                                className="icon pointer"
                                onMouseDown={event => {
                                    event.preventDefault();
                                    dragRef.current = event
                                        .currentTarget
                                        .parentElement as HTMLLIElement;
                                    setDrag(index);
                                }}
                                src={move}
                            />
                            <div className="flex grow">
                                <div
                                    className="link"
                                    onMouseUp={listening === -1 ? event => {
                                        startPollingJoypad();
                                        stopEvent(event);
                                        setListening(index);
                                    } : undefined}
                                >
                                    {binding.type
                                        ? humanizeBinding(binding)
                                        : "Click to select"}
                                </div>
                                {listening === index && <div>
                                    <span className="small">
                                        Listening for inputs... {" "}
                                    </span>
                                    <span
                                        className="small link"
                                        onMouseUp={event => {
                                            stopEvent(event);
                                            stopListening();
                                        }}
                                    >
                                        Cancel
                                    </span>
                                </div>}
                            </div>
                            {binding.type && (binding.type === "key"
                                    || binding.type === "mouse"
                                    || binding.type === "mouse_wheel")
                                ? (["alt", "shift", "ctrl", "meta"] as const)
                                    .map(prop => <div
                                        className="flex gap-small"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={binding[prop]}
                                            onChange={event => {
                                                binding[prop] = event
                                                    .currentTarget
                                                    .checked;
                                                tick();
                                            }}
                                        />
                                    {capitalize(prop)}
                                </div>) : Array(4).fill(0).map(() => <div />)
                            }
                            <img
                                className="icon button"
                                onMouseUp={() => {
                                    bindings.splice(index, 1);
                                    stopListening();
                                    tick();
                                }}
                                src={deleteIcon}
                            />
                        </li>
                    </>;
                })}
            </ul>
            <div className="flex vertical">
                <div
                    className="flex button"
                    onClick={() => {
                        bindings?.push({ type: null });
                        tick();
                    }}
                >
                    <img className="icon" src={create} />
                    Add binding
                </div>
            </div>
        </Screen>
    )
}