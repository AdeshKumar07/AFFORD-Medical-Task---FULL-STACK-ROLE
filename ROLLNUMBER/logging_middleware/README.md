# Logging Middleware

Reusable logging client for Affordmed evaluation service.

## Install

```bash
npm install
```

## Environment

Copy the root .env into your environment and supply a token.

- LOG_ENDPOINT (Node)
- LOG_TOKEN (Node)
- VITE_LOG_ENDPOINT (Vite)
- VITE_LOG_TOKEN (Vite)

## Usage (Node.js)

```js
import { Log } from "./logger.js";

const result = await Log("backend", "info", "utils", "Job completed");
if (!result.ok) {
  // Handle logging errors without console logging.
}
```

## Usage (Vite / React)

```js
import { Log } from "../../logging_middleware/index.js";

await Log("frontend", "info", "page", "App mounted");
```

## Notes

- All application logs must go through this middleware.
- Validation failures are returned as `{ ok: false }` with a detailed error.
