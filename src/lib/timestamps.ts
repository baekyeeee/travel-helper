// Strictly increasing so records created in the same millisecond keep their order.
let lastCreatedAt = 0;
export function nextCreatedAt() {
  lastCreatedAt = Math.max(Date.now(), lastCreatedAt + 1);
  return lastCreatedAt;
}
