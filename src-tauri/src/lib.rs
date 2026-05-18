use std::{fs, io, path::PathBuf, sync::LazyLock};

use home::home_dir;
use serde::Serialize;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read, list, write])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
