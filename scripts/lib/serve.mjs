import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

/** Serves a built folder on a port. The cache header lets a warm-up fetch be reused by the router. */
export function serve(root, port) {
  const server = createServer((request, response) => {
    const path = normalize(decodeURIComponent(request.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
    let file = join(root, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      response.statusCode = 404;
      return response.end();
    }
    response.setHeader("content-type", TYPES[extname(file)] ?? "application/octet-stream");
    response.setHeader("cache-control", "max-age=600");
    response.end(readFileSync(file));
  });
  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${port}`, close: () => server.close() })),
  );
}
