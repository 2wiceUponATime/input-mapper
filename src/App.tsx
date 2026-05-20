import { useEffect, useState } from "preact/hooks";
import "./App.css";
import GameScreen from "./screens/Game";
import { list, readJSON, writeJSON } from "./commands";
import schemas, { type Schemas } from "./schemas";
import forward from "./assets/icons/forward.svg";

export type AppConfigs = Record<string, Schemas["AppConfig"]>;
export type InputConfigs = Record<string, Schemas["InputConfig"]>;

async function getAppNames() {
  const result = await list("apps");
  return result
    .filter(item => !item.is_dir && item.name.endsWith(".json"))
    .map(item => item.name.replace(/\.json$/, ""));
}

async function getAppConfigs(names: string[]) {
  const result: AppConfigs = {};
  for (const name of names) {
    result[name] = await readJSON(`apps/${name}.json`, schemas.AppConfig);
  }
  return result;
}

async function getInputConfigs(names: string[], appConfigs: AppConfigs) {
  const result: InputConfigs = {}
  for (const name of names) {
    try {
      result[name] = await readJSON(
        `configs/${name}.json`,
        schemas.InputConfig
      );
    } catch(err) {
      if (!(
        typeof err === "string"
        && err.includes("No such file or directory")
      )) {
        throw err;
      }
      const bindingSet = Object.fromEntries(
        Object.entries(appConfigs[name].actions)
          .map(([k, v]) => [k, v.default])
      )
      result[name] = {
        sets: [["Default", bindingSet]],
        active_set: 0,
      }
    }
  }
  return result;
}

export default function App() {
  const [gameScreen  , setGameScreen]   = useState<string       | null>(null);
  const [appConfigs  , setAppConfigs]   = useState<AppConfigs   | null>(null);
  const [inputConfigs, setInputConfigs] = useState<InputConfigs | null>(null);

  async function main() {
    const names      = await getAppNames();
    const appConfigs = await getAppConfigs(names);
    setAppConfigs(appConfigs);
    setInputConfigs(await getInputConfigs(names, appConfigs));
  }

  useEffect(() => { main(); }, []);

  return (
    <main className="screen">
      <h1>Apps</ h1>
      <ul className="list">
        {appConfigs && Object.entries(appConfigs).map(([name, config]) => (
          <li
            className="list-item link"
            onClick={() => setGameScreen(name)}
          >
            <div>{config.name}</div>
            <img className="icon button" src={forward} />
          </li>
        ))}
      </ul>
      {gameScreen && <GameScreen
        title={appConfigs && `Binding sets: ${appConfigs[gameScreen].name}`}
        appConfig  ={appConfigs   && appConfigs  [gameScreen]}
        inputConfig={inputConfigs && inputConfigs[gameScreen]}
        onClose={() => setGameScreen(null)}
        onSave={async () => {
          if (!inputConfigs) return;
          await writeJSON(
            `configs/${gameScreen}.json`,
            inputConfigs[gameScreen]
          )
        }}
      />}
    </main>
  );
}