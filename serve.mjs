import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
};

function send(res, code, body, type = "text/plain; charset=utf-8") {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = resolve(join(root, normalize(pathname)));
    if (!file.startsWith(root)) return send(res, 403, "forbidden");
    const info = await stat(file);
    if (!info.isFile()) return send(res, 404, "not found");
    const data = await readFile(file);
    const type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(data);
  } catch {
    send(res, 404, "not found");
  }
});

const basePort = Number(process.env.PORT || 5173);
let port = basePort;

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE" && port < basePort + 10) {
    server.listen(++port);
  } else {
    throw err;
  }
});

server.listen(port, () => {
  console.log(`night market dev server: http://localhost:${port}/`);
});
