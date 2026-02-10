import cors from "cors";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3001);
const POSTS_DIR = path.join(__dirname, "src", "content", "posts");
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4321",
  "http://localhost:4322",
  "http://localhost:4323",
  "http://localhost:4324",
];

const ALLOWED_ORIGINS = process.env.ADMIN_ALLOWED_ORIGINS
  ? process.env.ADMIN_ALLOWED_ORIGINS.split(",").map((item) => item.trim())
  : DEFAULT_ALLOWED_ORIGINS;

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

function sendServerError(res, message, error) {
  console.error(message, error);
  res.status(500).json({ error: message });
}

function authenticate(req, res, next) {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: "Admin authentication is not configured" });
  }

  const password = req.headers["x-admin-password"];
  if (typeof password !== "string" || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

function isValidFilename(filename) {
  return (
    typeof filename === "string" &&
    filename.endsWith(".md") &&
    !filename.includes("..") &&
    !filename.includes("/") &&
    !filename.includes("\\")
  );
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Blog backend service is running",
    authConfigured: Boolean(ADMIN_PASSWORD),
  });
});

app.get("/api/posts", authenticate, async (req, res) => {
  try {
    const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
    const markdownFiles = entries.filter(
      (entry) => entry.isFile() && entry.name.endsWith(".md"),
    );

    const posts = await Promise.all(
      markdownFiles.map(async (entry) => {
        const filePath = path.join(POSTS_DIR, entry.name);
        const stats = await fs.stat(filePath);
        return {
          name: entry.name,
          path: `src/content/posts/${entry.name}`,
          size: stats.size,
          mtime: stats.mtime,
          ctime: stats.ctime,
        };
      }),
    );

    posts.sort((a, b) => b.mtime - a.mtime);
    res.json({ posts });
  } catch (error) {
    sendServerError(res, "Failed to list posts", error);
  }
});

app.get("/api/posts/:filename", authenticate, async (req, res) => {
  try {
    const { filename } = req.params;

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(POSTS_DIR, filename);
    const content = await fs.readFile(filePath, "utf-8");

    res.json({
      filename,
      content,
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({ error: "Post not found" });
    }
    sendServerError(res, "Failed to read post", error);
  }
});

app.post("/api/posts", authenticate, async (req, res) => {
  try {
    const { filename, content } = req.body;

    if (!filename || !content) {
      return res
        .status(400)
        .json({ error: "Missing required parameters: filename, content" });
    }

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(POSTS_DIR, filename);

    try {
      await fs.access(filePath);
      return res.status(409).json({ error: "Post already exists" });
    } catch {
      // Continue creating when file does not exist.
    }

    await fs.writeFile(filePath, content, "utf-8");

    res.json({
      success: true,
      message: "Post created successfully",
      filename,
    });
  } catch (error) {
    sendServerError(res, "Failed to create post", error);
  }
});

app.put("/api/posts/:filename", authenticate, async (req, res) => {
  try {
    const { filename } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Missing required parameter: content" });
    }

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(POSTS_DIR, filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: "Post not found" });
    }

    await fs.writeFile(filePath, content, "utf-8");

    res.json({
      success: true,
      message: "Post updated successfully",
      filename,
    });
  } catch (error) {
    sendServerError(res, "Failed to update post", error);
  }
});

app.delete("/api/posts/:filename", authenticate, async (req, res) => {
  try {
    const { filename } = req.params;

    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(POSTS_DIR, filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: "Post not found" });
    }

    await fs.unlink(filePath);

    res.json({
      success: true,
      message: "Post deleted successfully",
      filename,
    });
  } catch (error) {
    sendServerError(res, "Failed to delete post", error);
  }
});

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Blog backend is running on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
