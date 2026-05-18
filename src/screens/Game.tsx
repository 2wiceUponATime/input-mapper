import Screen, { ScreenProps } from "./Screen";
import forward from "@/assets/icons/forward.svg";
import { useState } from "preact/hooks";
import type { Schemas } from "@/schemas";
import BindingSetScreen from "./BindingSet";

export default function GameScreen(props: ScreenProps & {
    inputConfig: Schemas["InputConfig"] | null;
    onSave?: () => unknown;
}) {
    const [bindingSetScreen, setBindingSetScreen] = useState<[string, Schemas["BindingSet"]] | null>(null);

    const { inputConfig, onSave } = props;
    return (
        <Screen {...props}>
            <ul className="list">
                {inputConfig && inputConfig.sets.map(([name], index) => (
                    <li
                        className="list-item link"
                        onClick={() => setBindingSetScreen([name, inputConfig.sets[index][1]])}
                    >
                        <div>{name}</div>
                        <div>
                            <img className="icon button" src={forward} />
                        </div>
                    </li>
                ))}
            </ul>
            {bindingSetScreen && <BindingSetScreen
                title={`Bindings: ${bindingSetScreen[0]}`}
                bindings={bindingSetScreen[1]}
                onClose={() => setBindingSetScreen(null)}
                onSave={() => onSave && onSave()}
            />}
        </Screen>
    )
}