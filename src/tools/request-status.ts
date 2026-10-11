import { z } from "zod";
import { errorResult } from "../errors.js";
import { defineTool, jsonResult } from "./define-tool.js";

export const requestStatusTool = defineTool({
  name: "ae_request_status",
  title: "Recover request outcome",
  description:
    "Look up a retained request by UUID after a timeout, without executing or retrying host code. Works for push and targeted instance requests. A running or unknown outcome may still mutate the project; do not retry it.",
  group: "inspect",
  blockedInReadOnly: false,
  effect: "read",
  inputShape: { requestId: z.string().uuid() },
  handler: async ({ requestId }, transport) => {
    if (!transport.requestStatus)
      return errorResult("TRANSPORT", "This transport does not support retained request outcomes");
    try {
      return jsonResult({ ...(await transport.requestStatus(requestId)) });
    } catch (error) {
      return errorResult("TRANSPORT", error instanceof Error ? error.message : String(error));
    }
  },
});
