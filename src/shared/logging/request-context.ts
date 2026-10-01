import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  actorId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}
