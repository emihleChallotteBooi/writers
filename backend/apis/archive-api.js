const fs = require("fs/promises");
const path = require("path");
const { Router } = require("express");

function createArchiveRouter({ rootDir, contentDir }) {
  const router = Router();

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

  function toClientPath(fullPath) {
    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
    return `./${relativePath}`;
  }

  router.get("/archive", async (req, res) => {
    try {
      const markdownFiles = await walkMarkdownFiles(contentDir);
      markdownFiles.sort((a, b) => a.localeCompare(b));

      const archive = await Promise.all(markdownFiles.map(async filePath => ({
        filePath: toClientPath(filePath),
        markdown: await fs.readFile(filePath, "utf8")
      })));

      res.json(archive);
    } catch (error) {
      console.error("Archive API error:", error);
      res.status(500).json({ error: "Failed to load archive from server" });
    }
  });

  return router;
}

module.exports = {
  createArchiveRouter
};
