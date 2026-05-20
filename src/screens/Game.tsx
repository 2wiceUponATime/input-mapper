import Screen, { ScreenProps } from "./Screen";
import create from "@/assets/icons/create.svg";
import deleteIcon from "@/assets/icons/delete.svg";
import edit from "@/assets/icons/edit.svg";
import forward from "@/assets/icons/forward.svg";
import { useState } from "preact/hooks";
import type { Schemas } from "@/schemas";
import BindingSetScreen from "./BindingSet";
import { stopEvent } from "@/utils/events";
import { ticker } from "@/utils/utils";
import { clamp } from "@/utils/utils";

export default function GameScreen(props: ScreenProps & {
    appConfig  : Schemas["AppConfig"  ] | null;
    inputConfig: Schemas["InputConfig"] | null;
    onSave: () => unknown;
}) {
    const [bindingSetScreen, setBindingSetScreen] = useState<
        [string, Schemas["BindingSet"]] | null
    >(null);
    const tick = ticker();

    const { appConfig, inputConfig, onSave } = props;

    if (appConfig && inputConfig) {
        const clamped = clamp(
            inputConfig.active_set,
            0, inputConfig.sets.length - 1
        );
        if (inputConfig.active_set != clamped) {
            inputConfig.active_set = clamped;
            return;
        }
    }

    return (
        <Screen {...props}>
            <ul className="list">
                {inputConfig && inputConfig.sets.map((entry, index) => (
                    <li
                        className="list-item"
                        onClick={() => setBindingSetScreen(entry)}
                    >
                        <div className="link">{entry[0]}</div>
                        <div className="flex gap-small">
                            <input
                                type="checkbox"
                                checked={index === inputConfig.active_set}
                                onClick={event => event.stopPropagation()}
                                onChange={event => {
                                    if (event.currentTarget.checked) {
                                        inputConfig.active_set = index;
                                        onSave();
                                        tick();
                                    } else {
                                        event.currentTarget.checked = true;
                                    }
                                }}
                            />
                            Active
                        </div>
                        <img
                            className="icon button"
                            src={edit}
                            onClick={event => {
                                stopEvent(event);
                                entry[0] = prompt(
                                    "Enter new name",
                                    entry[0],
                                ) ?? entry[0];
                                onSave();
                                tick();
                            }}
                        />
                        <img
                            className="icon button"
                            src={deleteIcon}
                            onClick={event => {
                                stopEvent(event);
                                if (!appConfig) return;
                                inputConfig.sets.splice(index, 1);
                                if (inputConfig.active_set === index) {
                                    inputConfig.active_set = 0;
                                    if (inputConfig.sets.length === 0) {
                                        const set = Object.fromEntries(
                                            Object.entries(appConfig.actions)
                                            .map(([k, v]) => [k, v.default])
                                        )
                                        inputConfig.sets
                                            .push(["Default", set]);
                                        tick();
                                    }
                                } else if (inputConfig.active_set > index) {
                                    inputConfig.active_set -= 1;
                                }
                                onSave();
                                tick();
                            }}
                        />
                        <img className="icon button" src={forward} />
                    </li>
                ))}
            </ul>
            {bindingSetScreen && <BindingSetScreen
                title={`Bindings: ${bindingSetScreen[0]}`}
                bindings={bindingSetScreen[1]}
                onClose={() => setBindingSetScreen(null)}
                onSave={onSave}
            />}
            {
            <div className="flex vertical">
                <div
                    className="flex button"
                    onClick={() => {
                        if (!appConfig || !inputConfig) return;
                        const set = Object.fromEntries(
                            Object.entries(appConfig.actions)
                            .map(([k, v]) => [k, v.default])
                        )
                        inputConfig.sets.push(["New Binding Set", set]);
                        tick();
                    }}
                >
                    <img className="icon" src={create} />
                    Add binding set
                </div>
            </div>
            }
        </Screen>
    )
}