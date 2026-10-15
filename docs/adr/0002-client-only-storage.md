# Client-only storage for v1, no backend

The company's `conventions.md` assumes a `src/services` + OpenAPI backend for data fetching, but this app has no backend in v1: it's single-user with no login, so all data (Destinations, Stores, Items) and uploaded photos are stored client-side in the browser (IndexedDB) instead. This means no cross-device sync in v1 — if that's needed later, this decision should be revisited and data migrated to a real backend.
