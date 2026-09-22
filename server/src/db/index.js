import { env } from "../config/env.js";
import { fileStore } from "./file.js";
import { migrate as migrateMysql, seed as seedMysql, mysqlStore } from "./mysql.js";
import { seedFileStore } from "./seedFile.js";

export const store = env.dbDriver === "mysql" ? mysqlStore : fileStore;

export async function migrate() {
  if (env.dbDriver === "mysql") return migrateMysql();
  return [];
}

export async function seed() {
  if (env.dbDriver === "mysql") return seedMysql();
  return seedFileStore();
}
