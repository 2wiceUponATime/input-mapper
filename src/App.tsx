import { useEffect, useState } from "preact/hooks";
import "./App.css";
import GameScreen from "./screens/Game";
import { list, readJSON, writeJSON } from "./commands";
import schemas, { type Schemas } from "./schemas";
import forward from "./assets/icons/forward.svg";
import { ZodError } from "zod";
import { defaultBindings } from "./utils/utils";

export type AppConfigs   = Record<string, Schemas["AppConfig"  ] | null>;
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
    try {
      result[name] = await readJSON(`apps/${name}.json`, schemas.AppConfig);
    } catch(_err) {
      result[name] = null;
    }
  }
  return result;
}

async function getInputConfigs(names: string[], appConfigs: AppConfigs) {
  const result: InputConfigs = {}
  for (const name of names) {
    if (!appConfigs[name]) continue;
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
        if (err instanceof ZodError) {
          result[name] = {
            sets: [defaultBindings(appConfigs[name])],
            active_set: 0,
          };
          continue;
        }
        throw err;
      }
      result[name] = {
        sets: [defaultBindings(appConfigs[name])],
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

  const appConfig   = gameScreen !== null && appConfigs
    ? (appConfigs  [gameScreen] as Schemas["AppConfig"  ])
    : null;
  const inputConfig = gameScreen !== null && inputConfigs
    ? (inputConfigs[gameScreen])
    : null;

  return (
    <main className="screen">
      <h1>Apps</ h1>
      <ul className="list">
        {appConfigs && Object.entries(appConfigs).map(([name, config]) => config
          ? <li
              className="list-item link"
              onClick={() => setGameScreen(name)}
          >
            <div>{config.name}</div>
            <img className="icon button" src={forward} />
          </li>
          : <li
              className="list-item error"
          >
            <div>
            Error loading app configuration for "{name}"
            </div>
          </li>
        )}
      </ul>
      {gameScreen && <GameScreen
        title={appConfig && `Binding sets: ${appConfig.name}`}
        appConfig  ={appConfig  }
        inputConfig={inputConfig}
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