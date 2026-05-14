export const ALLOWED_STACKS = ["backend", "frontend"];

export const ALLOWED_LEVELS = [
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
];

export const FRONTEND_PACKAGES = [
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
];

export const COMMON_PACKAGES = [
  "auth",
  "config",
  "middleware",
  "utils",
];

export const ALLOWED_PACKAGES = [
  ...FRONTEND_PACKAGES,
  ...COMMON_PACKAGES,
];

export const DEFAULT_ENDPOINT =
  "http://4.224.186.213/evaluation-service/logs";

export const DEFAULT_TIMEOUT_MS = 8000;
