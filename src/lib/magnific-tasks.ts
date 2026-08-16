/**
 * Webhook result cache for Magnific tasks.
 *
 * Magnific is async: POST returns a task_id, the result arrives either by polling or by
 * webhook. On localhost the webhook cannot reach us, so polling is the path that always
 * works. When the app IS reachable (tunnel), /api/images/webhook drops the finished task
 * here and the poll loop picks it up on its next tick instead of hitting the API again.
 *
 * State lives on globalThis so Next's dev-mode module reloading does not lose in-flight
 * tasks between the webhook request and the generate request waiting on them.
 */

export type MagnificStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface MagnificTaskResult {
  taskId: string;
  status: MagnificStatus;
  generated: string[];
  receivedAt: number;
}

const TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 200;

const store: Map<string, MagnificTaskResult> = ((
  globalThis as { __ocMagnificTasks?: Map<string, MagnificTaskResult> }
).__ocMagnificTasks ??= new Map());

function prune(): void {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, entry] of store) {
    if (entry.receivedAt < cutoff) store.delete(id);
  }
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
}

export function recordTask(result: Omit<MagnificTaskResult, "receivedAt">): void {
  prune();
  store.set(result.taskId, { ...result, receivedAt: Date.now() });
}

export function peekTask(taskId: string): MagnificTaskResult | null {
  const entry = store.get(taskId);
  if (!entry) return null;
  if (entry.receivedAt < Date.now() - TTL_MS) {
    store.delete(taskId);
    return null;
  }
  return entry;
}
