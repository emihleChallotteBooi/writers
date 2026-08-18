const express = require("express");
const path = require("path");
const { createArchiveRouter } = require("./apis/archive-api");

const app = express();
const ROOT = path.resolve(__dirname, "..");
const CONTENT_ROOT = path.join(ROOT, "server-side", "content");
const PORT = Number(process.env.PORT || 5500);

app.use("/api", createArchiveRouter({
  rootDir: ROOT,
  contentDir: CONTENT_ROOT
}));

// Serve static app files from project root
app.use(express.static(ROOT));

app.listen(PORT, () => {
  console.log(`Writers server running at http://localhost:${PORT}`);
});
