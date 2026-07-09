import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { GeneratedProject } from "@/types/project";

const DB_DIR = path.join(process.cwd(), "storage");
const DB_PATH = path.join(DB_DIR, "projects.db");

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

export function saveProject(project: GeneratedProject) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO projects (id, title, data, created_at, updated_at)
     VALUES (@id, @title, @data, @now, @now)
     ON CONFLICT(id) DO UPDATE SET title = @title, data = @data, updated_at = @now`
  ).run({ id: project.id, title: project.title, data: JSON.stringify(project), now });
}

export function getProject(id: string): GeneratedProject | null {
  const row = db.prepare("SELECT data FROM projects WHERE id = ?").get(id) as
    | { data: string }
    | undefined;
  return row ? JSON.parse(row.data) : null;
}

export function listProjects(): { id: string; title: string; updatedAt: string }[] {
  const rows = db
    .prepare("SELECT id, title, updated_at as updatedAt FROM projects ORDER BY updated_at DESC")
    .all() as { id: string; title: string; updatedAt: string }[];
  return rows;
}

export function deleteProject(id: string) {
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}
