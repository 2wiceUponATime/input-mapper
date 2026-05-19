use std::{fs, io, path::PathBuf, sync::{Arc, LazyLock, Mutex}};

use gilrs::{Axis, Button, EventType, Gilrs};
use home::home_dir;
use serde::{Serialize, ser::SerializeStruct};
use tauri::{AppHandle, Emitter, State};

#[derive(Default)]
struct PollingState {
    running: Arc<Mutex<bool>>,
}

macro_rules! handle {
    ($result:expr) => {
        $result.map_err(|err| err.to_string())?
    };
}

#[derive(Serialize)]
struct ListEntry {
    name: String,
    is_dir: bool,
}

#[derive(Clone)]
enum JoypadEvent {
    Button(Button),
    Axis  (Axis, f32),
}

impl Serialize for JoypadEvent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer
    {
        match self {
            Self::Button(button) => {
                let mut s = serializer.serialize_struct("JoypadEvent", 2)?;
                s.serialize_field("type", "button")?;
                s.serialize_field("value", &format!("{:?}", button))?;
                s.end()
            }
            Self::Axis(axis, direction) => {
                let mut s = serializer.serialize_struct("JoypadEvent", 3)?;
                s.serialize_field("type", "axis")?;
                s.serialize_field("value", &format!("{:?}", axis))?;
                s.serialize_field("direction", direction)?;
                s.end()
            },
        }
    }
}

static CONFIG_DIR: LazyLock<Result<PathBuf, String>> = LazyLock::new(|| {
    let mut dir = home_dir()
        .ok_or("Unable to determine home directory".to_string())?;
    dir.push(".input-mapper");
    Ok(dir)
});

fn create_dirs(path: &PathBuf) -> io::Result<()> {
    fs::create_dir_all(path.parent().unwrap_or(path))
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
fn read(file: &str) -> Result<String, String> {
    let mut path = CONFIG_DIR.as_ref()?.clone();
    path.push(file);
    println!("read {}", path.to_string_lossy());
    handle!(create_dirs(&path));
    Ok(handle!(fs::read_to_string(&path)))
}

#[tauri::command]
fn list(dir: &str) -> Result<Vec<ListEntry>, String> {
    let mut path = CONFIG_DIR.as_ref()?.clone();
    path.push(dir);
    println!("list {}", path.to_string_lossy());
    handle!(create_dirs(&path));
    let result = handle!(fs::read_dir(path))
        .filter_map(|res| {
            let entry = res.ok()?;
            Some(ListEntry {
                name: entry.file_name().into_string().ok()?,
                is_dir: entry.file_type().ok()?.is_dir(),
            })
        })
        .collect();
    Ok(result)
}

#[tauri::command]
fn write(file: &str, content: &str) -> Result<(), String> {
    let mut path = CONFIG_DIR.as_ref()?.clone();
    path.push(file);
    println!("write {}", path.display());
    handle!(create_dirs(&path));
    handle!(fs::write(path, content.trim().to_owned() + "\n"));
    Ok(())
}

fn axis_to_event(axis: Axis, value: f32) -> Option<JoypadEvent> {
    const THRESHOLD: f32 = 0.7;

    if value.abs() < THRESHOLD {
        return None;
    }

    Some(JoypadEvent::Axis(axis, value))
}

#[tauri::command]
fn start_polling_joypad(app: AppHandle, state: State<PollingState>) -> Result<(), String> {
    use EventType::*;

    let mut running = state.running.lock().unwrap();
    if *running {
        return Ok(());
    }
    *running = true;

    let mut gilrs = handle!(Gilrs::new());

    std::thread::spawn(move || -> Result<(), tauri::Error> {
        loop {
            if let Some(e) = gilrs.next_event() {
                match e.event {
                    ButtonPressed(button, _) => app.emit("joypad", JoypadEvent::Button(button))?,
                    AxisChanged(axis, value, _) => match axis_to_event(axis, value) {
                        Some(value) => app.emit("joypad", value)?,
                        None => continue,
                    },
                    _ => continue,
                };
            }
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(PollingState::default())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read,
            list,
            write,
            start_polling_joypad,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
