# renTalk

A rental-home search app for Ho Chi Minh City, with a responsive ivory/forest-green UI, Goong maps, and a MiniMax rental assistant.

## Demo

**One minute, 60fps, 1280x720:**

[docs/demo/rental-system-demo-60s.mp4](docs/demo/rental-system-demo-60s.mp4)

Recorded in a single continuous take against a local database with seeded listings. Silent. The chapter cards, pointer and captions are drawn over the running app; nothing is mocked.

- `0:00` Landing · `0:04` Filters and sort
- `0:11` Map and clusters · `0:19` Listing detail and save
- `0:27` Compare two homes · `0:37` Roommate matching
- `0:43` Publish a listing · `0:46` Rental assistant

**Full walkthrough, 4½ minutes:** [docs/demo/rental-system-demo.mp4](docs/demo/rental-system-demo.mp4). Same tour, plus the sign-in and role gate, your own roommate profile, sign-up, and the 404 page.

Both videos are committed to the repository, so these links download them. GitHub will not play either one in place: the blob page refuses with "we can't show files that are this big right now", and `raw.githubusercontent.com` serves them as `application/octet-stream`. To get an inline player, drag the file into an issue or PR comment and link the `user-attachments` URL GitHub hands back.

## Local preview

- Frontend: http://localhost:4000
- Rental API: http://127.0.0.1:8100/api/health
- Assistant: http://127.0.0.1:8000/health
- Isolated MySQL: `127.0.0.1:3307`, database `rentalk_local`

The local preview contains six clearly marked sample homes, not verified rental offers. The existing services on port 8080 are not used or modified.

Prerequisites: Node.js 22 or 24, Docker, Python 3.11+, and uv. Tested here with Node 24.18.0. Run commands from the repository root unless a step changes directories.

1. Copy `frontend/.env.sample` to `frontend/.env.local`, `backend/.env.example` to `backend/.env`, and `chatbot-service/.env.example` to `chatbot-service/.env`. **Do not overwrite existing configured files.** Enter provider keys in these ignored files. Generate separate JWT secrets, for example with `openssl rand -hex 32` twice. Local files on the current workstation are already configured.
2. Start the isolated database:

   ```sh
   docker compose -f docker-compose.local.yml up -d
   ```

3. Install and start the backend in one terminal:

   ```sh
   cd backend
   npm ci
   npm run migrate
   npm run seed:local
   npm run build
   npm run start:prod
   ```

   `start:prod` runs compiled code. The supplied local environment intentionally remains `NODE_ENV=development`. The seed refuses to run outside `rentalk_local` or in production; it never overwrites existing listings.

4. Start the assistant in a second terminal:

   ```sh
   cd chatbot-service
   uv venv .venv
   uv pip install --python .venv/bin/python -r requirements.txt
   .venv/bin/uvicorn minimax_app:app --host 127.0.0.1 --port 8000
   ```

   This uses the new bounded MiniMax implementation. The older `main.py` / LangChain service has been removed; `minimax_app.py` is the only assistant entrypoint. `MINIMAX_MODEL` defaults to `MiniMax-M2.5`, which was verified with the supplied key. Confirm that your provider plan permits the intended deployment workload.

5. Start the frontend in a third terminal:

   ```sh
   cd frontend
   npm ci --legacy-peer-deps
   npm run build
   npm start
   ```

   Use `npm run dev` while editing. Development and production output use separate directories (`.next-dev` and `.next`) to avoid build collisions. `npm run dev` binds to loopback; `npm start` binds to all interfaces (`0.0.0.0`) because the compose stack requires it — prefer `npm run dev` on untrusted networks.

## Verification

```sh
cd backend
npm test -- --runInBand
node scripts/smoke-local.cjs
```

The smoke test creates and removes only its own temporary account. It checks health, listings, filters, geographic search, invalid requests, registration, login, salted password storage, favorites, and token refresh. Seed the local database before running it.

```sh
cd chatbot-service
.venv/bin/python -m unittest test_minimax_app.py
```

```sh
cd frontend
npm run lint
npm run build
npm audit --omit=dev
```

For either Node service, `npm audit --omit=dev` reports runtime dependency findings. See [the readiness checklist](docs/production-readiness.md) for the remaining release gates. A passing build is not a deployment approval.

## Design

DM Sans for interface text, Lora italic for editorial emphasis, warm ivory surfaces, forest-green actions, and consistent focus states. Home search, listing cards, map search, login/signup, and the listing form share the new palette. The generated hero is labeled illustrative; stock photos in seeded listings are demonstration assets.

Design reference: [minimal real-estate layout study](https://www.behance.net/gallery/241398693/Real-Estate-Modern-landing-page-in-minimalism). Implementation references: [Goong JavaScript](https://docs.goong.io/javascript/), [MiniMax API](https://platform.minimax.io/docs/api-reference/text-openai-api), and [Next.js security guidance](https://vercel.com/changelog/next-js-may-2026-security-release).

The image-generation prompt and asset provenance are recorded in [design-assets.md](docs/design-assets.md).
