import { spawn } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const roots = ["src", "test", "scripts"];
const files = roots.flatMap((root) => listJavaScriptFiles(root));

const results = await Promise.all(files.map((file) => checkSyntax(file)));
if (results.some((result) => result.status !== 0)) process.exit(1);
console.log(`Syntax check passed for ${files.length} JavaScript files.`);

async function checkSyntax(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--check", file], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (status) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      resolve({ status });
    });
  });
}

function listJavaScriptFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return listJavaScriptFiles(fullPath);
    return /\.(?:js|cjs)$/.test(entry) ? [fullPath] : [];
  });
}
