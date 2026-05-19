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
    Button(i16),
    Axis  (i16, f32),
}

impl Serialize for JoypadEvent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer
    {
        match self {
            Self::Button(index) => {
                let mut s = serializer.serialize_struct("JoypadEvent", 2)?;
                s.serialize_field("type", "button")?;
                s.serialize_field("index", index)?;
                s.end()
            }
            Self::Axis(index, direction) => {
                let mut s = serializer.serialize_struct("JoypadEvent", 3)?;
                s.serialize_field("type", "axis")?;
                s.serialize_field("index", index)?;
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

fn button_to_event(button: Button) -> Option<JoypadEvent> {
    use Button::*;
    Some(JoypadEvent::Button(match button {
        South => 0,
        East  => 1,
        North => 3,
        West  => 2,
        LeftTrigger   => 9,
        LeftTrigger2  => return Some(JoypadEvent::Axis(4, 1.0)),
        RightTrigger  => 10,
        RightTrigger2 => return Some(JoypadEvent::Axis(5, 1.0)),
        Select => 4,
        Start  => 6,
        Mode   => 5,
        LeftThumb  => 7,
        RightThumb => 8,
        DPadUp    => 11,
        DPadDown  => 12,
        DPadLeft  => 13,
        DPadRight => 14,
        _ => return None,
    }))
}

fn axis_to_event(axis: Axis, value: f32) -> Option<JoypadEvent> {
    const THRESHOLD: f32 = 0.7;

    if value.abs() < THRESHOLD {
        return None;
    }

    Some(JoypadEvent::Axis(match axis {
        Axis::LeftStickX  => 0,
        Axis::LeftStickY  => 1,
        Axis::RightStickX => 2,
        Axis::RightStickY => 3,
        _ => return None
    }, value))
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

    std::thread::spawn(move || {
        loop {
            if let Some(e) = gilrs.next_event() {
                match e.event {
                    ButtonPressed(button, _) => match button_to_event(button) {
                        Some(value) => app.emit("joypad", value).unwrap(),
                        None => continue,
                    },
                    AxisChanged(axis, value, _) => match axis_to_event(axis, value) {
                        Some(value) => app.emit("joypad", value).unwrap(),
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
