import type { IQMNodeModule, NodeId } from "../types/node";

const modules = new Map<NodeId, IQMNodeModule>();

export function registerNodeModule(module: IQMNodeModule): void {
  if (modules.has(module.id)) {
    throw new Error(`Node module already registered: ${module.id}`);
  }
  modules.set(module.id, module);
}

export function getNodeModule(nodeId: NodeId): IQMNodeModule {
  const module = modules.get(nodeId);
  if (!module) {
    throw new Error(`Node module is not registered: ${nodeId}`);
  }
  return module;
}

export function listRegisteredNodeModules(): IQMNodeModule[] {
  return Array.from(modules.values());
}

export function isNodeModuleRegistered(nodeId: NodeId): boolean {
  return modules.has(nodeId);
}
