let lastRequestId: string | undefined;

export function setLastRequestIdFromResponse(
  response: Pick<Response, 'headers'> | { headers?: Headers },
): void {
  const id = response.headers?.get?.('x-request-id');
  if (id) {
    lastRequestId = id.trim();
  }
}

export function getLastRequestId(): string | undefined {
  return lastRequestId;
}
