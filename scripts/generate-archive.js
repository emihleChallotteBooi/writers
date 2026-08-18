const fs = require("fs/promises");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const contentDir = path.join(rootDir, "server-side", "content");
const outputFile = path.join(rootDir, "archive.json");

async function walkMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function generateArchive() {
  const markdownFiles = await walkMarkdownFiles(contentDir);
  markdownFiles.sort((a, b) => a.localeCompare(b));

  const archive = await Promise.all(markdownFiles.map(async filePath => ({
    filePath: `./${path.relative(rootDir, filePath).replace(/\\/g, "/")}`,
    markdown: await fs.readFile(filePath, "utf8")
  })));

  await fs.writeFile(outputFile, `${JSON.stringify(archive)}\n`, "utf8");
  console.log(`Generated archive.json with ${archive.length} pieces`);
}

generateArchive().catch(error => {
  console.error("Failed to generate archive.json:", error);
  process.exitCode = 1;
});
