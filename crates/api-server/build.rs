use std::fs;
use std::path::Path;

fn main() {
    // 1. Watch the directory itself (triggers on new file added or file deleted)
    let migrations_dir = Path::new("../../database/migrations");
    println!("cargo:rerun-if-changed={}", migrations_dir.display());

    // 2. Watch every individual .sql migration file (triggers on file content modification)
    if let Ok(entries) = fs::read_dir(migrations_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("sql") {
                println!("cargo:rerun-if-changed={}", path.display());
            }
        }
    }
}
