/** Short, readable receipt reference derived from the transaction hash and log position. */
export function receiptRef(txHash: string, logIndex: number, extra = 0) {
  const h = txHash.toLowerCase().replace(/^0x/, "");
  const start = extra * 8;
  const body = h.slice(start, start + 8).toUpperCase();
  return `FC-${body.slice(0, 4)}-${body.slice(4, 8)}-${logIndex.toString(36).toUpperCase().padStart(2, "0")}`;
}

export function normaliseRef(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function isTxHash(input: string) {
  return /^0x[0-9a-fA-F]{64}$/.test(input.trim());
}
