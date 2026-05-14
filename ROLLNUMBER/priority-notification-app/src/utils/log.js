import { Log } from "../../../logging_middleware/index.js";

export async function logEvent(level, packageName, message) {
  return Log("frontend", level, packageName, message);
}
