import type { PermissionRequest, PermissionDecision } from "../types";

type PendingPermission = {
  request: PermissionRequest;
  resolve: (decision: PermissionDecision) => void;
};

const pending = new Map<string, PendingPermission>();

export function requestPermission(
  request: PermissionRequest,
): Promise<PermissionDecision> {
  return new Promise((resolve) => {
    pending.set(request.id, { request, resolve });
  });
}

export function resolvePermission(
  permId: string,
  decision: PermissionDecision,
): boolean {
  const p = pending.get(permId);
  if (!p) return false;
  pending.delete(permId);
  p.resolve(decision);
  return true;
}

export function getPending(permId: string) {
  return pending.get(permId)?.request ?? null;
}
