import axios from "axios";
import {
  ALLOWED_LEVELS,
  ALLOWED_PACKAGES,
  ALLOWED_STACKS,
  DEFAULT_ENDPOINT,
  DEFAULT_TIMEOUT_MS,
} from "./constants.js";

function getFirstEnv(keys) {
  for (const key of keys) {
    try {
      if (typeof process !== "undefined" && process.env?.[key]) {
        return process.env[key];
      }
    } catch {
      // Ignore environment access errors.
    }

    try {
      if (typeof import.meta !== "undefined" && import.meta.env?.[key]) {
        return import.meta.env[key];
      }
    } catch {
      // Ignore environment access errors.
    }
  }

  return undefined;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function buildValidationError(messages) {
  return {
    ok: false,
    error: {
      code: "VALIDATION_ERROR",
      message: messages.join(" "),
    },
  };
}

/**
 * Log a message to the evaluation service.
 *
 * @example
 * await Log("frontend", "info", "page", "App mounted");
 */
export async function Log(stack, level, packageName, message) {
  const normalizedStack = normalize(stack);
  const normalizedLevel = normalize(level);
  const normalizedPackage = normalize(packageName);
  const normalizedMessage = String(message || "").trim();

  const validationMessages = [];

  if (!ALLOWED_STACKS.includes(normalizedStack)) {
    validationMessages.push(
      `Invalid stack. Allowed: ${ALLOWED_STACKS.join(", ")}.`
    );
  }

  if (!ALLOWED_LEVELS.includes(normalizedLevel)) {
    validationMessages.push(
      `Invalid level. Allowed: ${ALLOWED_LEVELS.join(", ")}.`
    );
  }

  if (!ALLOWED_PACKAGES.includes(normalizedPackage)) {
    validationMessages.push(
      `Invalid package. Allowed: ${ALLOWED_PACKAGES.join(", ")}.`
    );
  }

  if (!normalizedMessage) {
    validationMessages.push("Message is required.");
  }

  if (validationMessages.length > 0) {
    return buildValidationError(validationMessages);
  }

  const endpoint =
    getFirstEnv(["LOG_ENDPOINT", "VITE_LOG_ENDPOINT"]) ||
    DEFAULT_ENDPOINT;
  const token = getFirstEnv(["LOG_TOKEN", "VITE_LOG_TOKEN"]);
  const timeoutValue =
    getFirstEnv(["LOG_TIMEOUT_MS", "VITE_LOG_TIMEOUT_MS"]) ||
    DEFAULT_TIMEOUT_MS;
  const timeoutMs = Number(timeoutValue) || DEFAULT_TIMEOUT_MS;

  const payload = {
    stack: normalizedStack,
    level: normalizedLevel,
    package: normalizedPackage,
    message: normalizedMessage,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await axios.post(endpoint, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      timeout: timeoutMs,
    });

    return {
      ok: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    const status = error?.response?.status;
    const responseMessage = error?.response?.data?.message;
    const errorMessage = responseMessage || error?.message || "Unknown error";

    return {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message: errorMessage,
        status,
      },
    };
  }
}
