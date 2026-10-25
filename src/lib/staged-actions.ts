// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { readDataSafe, writeData } from "./data";
import { generateId, now } from "./utils";
import type {
  StagedAction,
  StagedActionsData,
  StagedActionType,
  StagedActionStatus,
} from "@/types/staged-action";

const FILE = "staged-actions.json";

async function load(): Promise<StagedActionsData> {
  return readDataSafe<StagedActionsData>(FILE, { actions: [] });
}

async function save(data: StagedActionsData): Promise<void> {
  await writeData(FILE, data);
}

export async function listStagedActions(): Promise<StagedAction[]> {
  const data = await load();
  return data.actions;
}

export async function getStagedAction(
  id: string
): Promise<StagedAction | null> {
  const data = await load();
  return data.actions.find((a) => a.id === id) ?? null;
}

export async function createStagedAction(params: {
  type: StagedActionType;
  fileName: string;
  content: string;
  description: string;
  carouselId: string;
  autoExecute?: boolean;
}): Promise<StagedAction> {
  const data = await load();
  const action: StagedAction = {
    id: generateId(),
    type: params.type,
    fileName: params.fileName,
    content: params.content,
    description: params.description,
    carouselId: params.carouselId,
    autoExecute: params.autoExecute ?? false,
    status: "pending",
    createdAt: now(),
    resolvedAt: null,
  };
  data.actions.push(action);
  await save(data);
  return action;
}

export async function updateStagedAction(
  id: string,
  updates: Partial<Pick<StagedAction, "status" | "resolvedAt">>
): Promise<StagedAction | null> {
  const data = await load();
  const action = data.actions.find((a) => a.id === id);
  if (!action) return null;
  Object.assign(action, updates);
  await save(data);
  return action;
}

export async function updateStagedActionStatus(
  id: string,
  status: StagedActionStatus
): Promise<StagedAction | null> {
  return updateStagedAction(id, {
    status,
    resolvedAt: status !== "pending" ? now() : null,
  });
}
