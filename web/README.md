# apps/web
1. `cd apps/web && npm install`
2. Copy `.env.example` to `.env.local` and set the API/WS addresses (use the API computer's IP when testing across machines).
3. `npm run dev` then open http://localhost:3000
Requires the API (port 4000) and realtime server (port 4001) from the shared contract.
