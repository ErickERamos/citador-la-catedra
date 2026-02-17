import { execSync } from "child_process";
import { existsSync, mkdirSync, rmSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const distDir = resolve(rootDir, "dist");
const releaseDir = resolve(rootDir, "release");

// Ensure release directory exists
if (!existsSync(releaseDir)) {
  mkdirSync(releaseDir, { recursive: true });
}

const zipName = "citador-la-catedra-v1.0.0.zip";
const zipPath = join(releaseDir, zipName);

// Clean previous release
if (existsSync(zipPath)) {
  rmSync(zipPath);
}

console.log("📦 Packaging extension...");

try {
  // Run build first
  console.log("🔨 Running build...");
  execSync("npm run build", { stdio: "inherit", cwd: rootDir });

  // Generate icons if missing
  console.log("🎨 Ensuring icons exist...");
  execSync("node scripts/generate-icons.mjs", { stdio: "inherit", cwd: rootDir });

  // Create ZIP using bestzip
  console.log(`🤐 Zipping to ${zipName}...`);
  // Use npx bestzip to zip the contents of dist
  // bestzip destination source
  // We need to run this from the dist directory so the paths in the zip are relative to dist
  execSync(`npx bestzip "${zipPath}" *`, { stdio: "inherit", cwd: distDir });

  console.log(`✅ Extension packaged successfully at: ${zipPath}`);
} catch (error) {
  console.error("❌ Error packaging extension:", error);
  process.exit(1);
}
