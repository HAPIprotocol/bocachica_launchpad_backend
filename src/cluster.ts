import * as clusterOriginal from 'cluster';
import { Cluster } from 'cluster';

// Hack for Typescript typings of native cluster package
export const cluster = clusterOriginal as unknown as Cluster;

export enum ProcessType {
  None = 'NONE',
  Web = 'WEB',
  Worker = 'WORKER',
}

global.processType = ProcessType.None;

export function getProcessType() {
  return global.processType;
}

export function setProcessType(type: ProcessType) {
  global.processType = type;
}
