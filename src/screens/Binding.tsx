import Screen, { ScreenProps } from "./Screen";
import deleteIcon from "@/assets/icons/delete.svg";
import create from "@/assets/icons/create.svg";
import type { Schemas } from "@/schemas";
import { capitalize, humanizeBinding } from "@/utils/humanize";
import { useEffect, useState } from "preact/hooks";
import { isModifierKey, ticker } from "@/utils/events";

type Binding = Schemas["Binding"] | { type: null };

export default function BindingScreen(props: ScreenProps & {
    bindings: Binding[] | null;
}) {
    const [listening, setListening] = useState(-1);
    const tick = ticker();
    const { bindings } = props;

    useEffect(() => {
        function onContextMenu(event: Event) {
            if (listening == -1) return;
            event.preventDefault();
        }
        function onKeyDown(event: KeyboardEvent) {
            if (listening == -1 || !bindings || isModifierKey(event)) return;
            console.log(event.key);
            event.preventDefault();
            bindings[listening] = {
                type: "key",
                code: event.code,
                alt:   event.altKey,
                shift: event.shiftKey,
                ctrl:  event.ctrlKey,
                meta:  event.metaKey,
            }
            setListening(-1);
        }
        function onMouseDown(event: MouseEvent) {
            if (listening == -1 || !bindings) return;
            event.preventDefault();
            bindings[listening] = {
                type: "mouse",
                mouse_button: event.button,
                alt:   event.altKey,
                shift: event.shiftKey,
                ctrl:  event.ctrlKey,
                meta:  event.metaKey,
            }
            setListening(-1);
        }
        function onWheel(event: WheelEvent) {
            if (listening == -1 || !bindings) return;
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
                meta:  event.metaKey,
            }
            setListening(-1);
        }

        window.addEventListener("keydown"    , onKeyDown    );
        window.addEventListener("mouseup"    , onMouseDown  );
        window.addEventListener("contextmenu", onContextMenu);
        window.addEventListener("wheel"      , onWheel     );
        return () => {
            window.removeEventListener("keydown",     onKeyDown    );
            window.removeEventListener("mouseup",     onMouseDown  );
            window.removeEventListener("contextmenu", onContextMenu);
            window.removeEventListener("wheel"      , onWheel     );
        };
    });

    return (
        <Screen {...props}>
                <ul className="list">
                    {bindings && bindings.map((binding, index) => (
                        <li className="list-item">
                            <div class="flex">
                                <div
                                    className="link"
                                    onMouseUp={listening == -1 ? e => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setListening(index);
                                    } : undefined}
                                >
                                    {binding.type ? humanizeBinding(binding) : "Click to select"}
                                </div>
                                {listening == index && <div>
                                    <span className="small">
                                        Listening for inputs...
                                    </span>
                                    {" "}
                                    <span
                                        className="small link"
                                        onMouseUp={e => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setListening(-1);
                                        }}
                                    >
                                        Cancel
                                    </span>
                                </div>}
                            </div>
                            {binding.type && (binding.type == "key" || binding.type == "mouse" || binding.type == "mouse_wheel") ?
                                (["alt", "shift", "ctrl", "meta"] as const).map(prop => (
                                    <div>
                                        <input
                                            type="checkbox"
                                            checked={binding[prop]}
                                            onChange={event => {
                                                binding[prop] = event.currentTarget.checked;
                                                tick();
                                            }}
                                        />
                                        {" "}
                                        {capitalize(prop)}
                                    </div>
                                )) : Array(4).fill(0).map(() => <div />)
                            }
                            <div>
                                <img
                                    className="icon button"
                                    onMouseUp={() => {
                                        bindings.splice(index, 1);
                                        setListening(-1);
                                        tick();
                                    }}
                                    src={deleteIcon}
                                />
                            </div>
                        </li>
                    ))}
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