import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { motionSpecSchema } from './motion/spec.js';

export const WORKFLOW_GUIDE=`After Effects Uber MCP — motion graphics

1. Inspect ae_context and ae_project_info. Confirm the intended project/instance; never choose a different target when an explicit one is absent.
2. Discover operations with ae_catalog. Use native comp IDs and {id: layerId} selectors after creation; refresh references after project reopen/replacement.
3. Use ae_motion_plan for title-card, lower-third or statistic-card. Edit its strict version-1 spec for custom layouts. The layer array is back-to-front. Positions are visual centers. timing fields are start seconds plus in/hold/out durations; all must fit the composition.
4. Call ae_motion_build. Each build creates a new comp. Record comp/layer IDs, spec hash and warnings. Preserve the JSON spec as an artifact when continuing across sessions.
5. Use ae_motion_audit for bounded native facts. Use ae_motion_review with several entrance/hold/exit times for actual captured images and a hash-bound review manifest. Inspect images yourself. Numerical checks do not establish attractive composition, clean text, correct alpha/color or full animation quality.
6. Revise native layers via ae_do using stable IDs. Discover text, shape, keyframe, expression and effect operations rather than guessing parameters. batch.run groups undo but is not automatic rollback. Reinspect errors and partial results before proceeding.
7. A timeout is an unknown outcome until reconciled. Use ae_request_status with the returned requestId. Never retry a create/import/build simply because it timed out.
8. Save a new AEP path with ae_save_project. Render queue operations affect the configured queue: inspect it and avoid rendering unrelated jobs. Essential Graphics operations are in the egp catalog category.

ae_motion_review stores observations with artistAcceptance=pending. The spec tag identifies the source spec, not the current manually edited AE state. Sparse frame captures do not qualify an entire animation. Output/color warnings must remain visible in the handoff.

Default raw JSX is disabled. Read-only mode supports inspection and review captures, but color handling may differ. The local mailbox is trusted code execution; this server is not a sandbox.
`;

export function registerWorkflow(server:McpServer):void {
  server.registerResource('motion-workflow','ae-uber://workflow',{title:'Motion graphics workflow',mimeType:'text/plain'},async uri=>({contents:[{uri:uri.href,mimeType:'text/plain',text:WORKFLOW_GUIDE}]}));
  server.registerResource('motion-spec-schema','ae-uber://motion-spec-schema',{title:'Motion spec JSON schema',mimeType:'application/json'},async uri=>({contents:[{uri:uri.href,mimeType:'application/json',text:JSON.stringify(z.toJSONSchema(motionSpecSchema),null,2)}]}));
  server.registerPrompt('motion-graphics',{title:'Build and review native motion graphics',description:'Plan, build, inspect and revise an editable AE motion graphic.',argsSchema:{brief:z.string().describe('Requested motion graphic and delivery constraints')}},async({brief})=>({messages:[{role:'user',content:{type:'text',text:`Motion brief: ${brief}\n\n${WORKFLOW_GUIDE}`}}]}));
}
