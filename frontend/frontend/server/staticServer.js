import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const staticDirectory = path.resolve(serverDirectory, "../dist");
const indexPath = path.join(staticDirectory, "index.html");
const port = Number.parseInt(process.env.PORT || "8080", 10);
const host = "0.0.0.0";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT doit être un port TCP valide.");
}

if (!existsSync(indexPath)) {
  throw new Error("Le build frontend est absent : dist/index.html introuvable.");
}

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method Not Allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url || "/", "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400);
    response.end("Bad Request");
    return;
  }

  const requestedFile = path.resolve(staticDirectory, `.${pathname}`);
  const isInsideStaticDirectory =
    requestedFile === staticDirectory ||
    requestedFile.startsWith(`${staticDirectory}${path.sep}`);

  if (!isInsideStaticDirectory) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const servesHtmlRoute =
    request.headers.accept?.includes("text/html") ||
    path.extname(pathname) === "";
  const filePath =
    existsSync(requestedFile) && statSync(requestedFile).isFile()
      ? requestedFile
      : servesHtmlRoute
        ? indexPath
        : null;

  if (!filePath) {
    response.writeHead(404);
    response.end("Not Found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentLength = statSync(filePath).size;
  response.writeHead(200, {
    "Cache-Control":
      filePath === indexPath
        ? "no-cache"
        : "public, max-age=31536000, immutable",
    "Content-Length": contentLength,
    "Content-Type": contentTypes.get(extension) || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`MACEVO frontend listening on ${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
