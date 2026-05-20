import Screen, { ScreenProps } from "./Screen";
import forward from "@/assets/icons/forward.svg";
import type { Schemas } from "@/schemas";
import { useState } from "preact/hooks";
import BindingScreen from "./Binding";
import { humanizeSnakeCase } from "@/utils/humanize";

export default function BindingSetScreen(props: ScreenProps & {
    bindings: Schemas["BindingSet"] | null;
    onSave: () => unknown;
}) {
    const [bindingScreen, setBindingScreen] = useState<
        [string, Schemas["Binding"][]] | null
    >(null)
    const { bindings, onSave } = props;

    return (
        <Screen {...props}>
            <ul className="list">
                {bindings && Object
                    .entries(bindings)
                    .map(([name, bindings]) => (
                        <li
                            className="list-item link"
                            onClick={() => setBindingScreen([name, bindings])}
                        >
                            <div>{humanizeSnakeCase(name)}</div>
                            <img className="icon button" src={forward} />
                        </li>
                    ))
                }
            </ul>
            {bindingScreen && <BindingScreen 
                title={`Edit binding: ${humanizeSnakeCase(bindingScreen[0])}`}
                onClose={() => {
                    if (bindings) {
                        bindings[bindingScreen[0]] = bindingScreen[1]
                            .filter(binding => binding.type);
                    }
                    setBindingScreen(null);
                    onSave();
                }}
                onSave={onSave}
                bindings={bindingScreen[1]}
            />}
        </Screen>
    )
}