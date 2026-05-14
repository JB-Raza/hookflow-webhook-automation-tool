# HookFlow - Development Plan

---

## How to Read This Plan

Each phase has a clear goal, a list of tasks, and a visible output you can test when it is done.
Complete each phase fully before moving to the next.
Never move forward on a broken foundation.

---

## Current State (Before Phase 1)

- Express server is running
- MongoDB connects successfully
- Hookflow and Delivery schemas exist
- POST /hook/:webhookPath route exists
- Basic user register/login exists
- Several critical bugs exist that must be fixed first

---

# Phase 1 — Fix the Foundation

**Goal:** Make existing code correct and secure before building anything new.

**Why first:** Everything you build on top of broken code inherits those bugs. Fix now, not later.

### Tasks

- Hash the password before saving in the register controller (use bcrypt)
- Add expiry to JWT tokens (e.g. 7 days)
- Stop returning the password field in register and login responses
- Add try/catch to registerUser and loginUser
- Add try/catch to getAllHookflows
- Scope getAllHookflows to return only the logged-in user's flows (not everyone's)
- Add isHookActive check in createDelivery before saving the payload
- Handle duplicate key errors (code 11000) in createHookflow with a proper 400 response
- Fix the Mongoose model name mismatch: Delivery.model refs 'Hookflow' but the model registers as 'hookflow'
- Add index: true to hookflowId in Delivery model
- Remove console.log of raw payload in createDelivery
- Return only { success: true, message: "Webhook received" } from createDelivery — not the full delivery object
- Remove the unused validateWebhookPayload import from Hookflow.routes.js

### Verify Output

- Register a user → no password in response
- Login → get a JWT
- Create a flow → works
- Send a POST to the webhook route → returns simple acknowledgment
- Send to a deactivated flow → returns 403

---

# Phase 2 — Complete the Webhook Receiver

**Goal:** The receiver endpoint is fully correct, robust, and production-ready.

**Why:** This is the most critical endpoint in the whole system. Every other feature depends on it working correctly.

### Tasks

- Move mongoConnect() to run before app.listen() so the DB is ready before the server accepts requests
- Add a body size limit to express.json() (e.g. 1mb) to prevent large payload attacks
- Fix the validateWebhookPayload middleware: check Object.keys(body).length === 0 for empty body detection
- Make webhookPath system-generated on the backend using crypto.randomUUID() — it should never come from req.body
- Add a global error handler middleware at the bottom of server.js as a safety net
- Add a 404 catch-all route for unknown endpoints
- Restrict CORS to your frontend's origin for the management routes (flows, users). The public /hook/:path endpoint can remain open.
- Harden the PORT log: use process.env.SERVER_PORT in the log message, not a hardcoded number

### Verify Output

- Server refuses to start if DB is not available
- Sending a 10MB payload → rejected
- Sending to an unknown route → clean 404 JSON response
- Sending an empty body → proper 400 rejection
- The generated webhookPath is a UUID, not user-supplied

---

# Phase 3 — Auth Middleware (Protected Routes)

**Goal:** Build the JWT authentication middleware that protects all management routes.

**Why:** Before building the dashboard API, you need a way to protect it. This middleware will be reused everywhere.

### Tasks

- Create an authenticateUser middleware in utils/middlewares/
- The middleware reads the Authorization header, extracts the Bearer token, verifies it using JWT_SECRET
- If valid: attach req.user = { userId } and call next()
- If invalid or missing: return 401 with a clear error message
- Apply this middleware to all Hookflow routes (create, get, update, delete)
- Apply this middleware to all Delivery history routes
- Do NOT apply it to the public webhook receiver endpoint (POST /hook/:webhookPath)

### Verify Output

- Hit any flow management route without a token → 401
- Hit same route with a valid JWT in the Authorization header → works
- The public webhook URL still works without any auth

---

# Phase 4 — Hookflow CRUD (Complete Flow Management API)

**Goal:** Full backend API for creating, reading, updating, and deleting flows.

**Why:** This is the core resource of the entire product. The dashboard will be built on top of this API.

### Tasks

- GET /api/hookflow/ — get all flows for the logged-in user (filter by userId from req.user)
- GET /api/hookflow/:id — get a single flow by ID (verify it belongs to the logged-in user)
- POST /api/hookflow/create — create a new flow (system-generates webhookPath using UUID)
- PUT /api/hookflow/:id — update a flow (only owner can update)
- DELETE /api/hookflow/:id — delete a flow and all its associated deliveries
- PATCH /api/hookflow/:id/toggle — toggle isHookActive between true and false
- Validate required fields on create: webhookName, integration.provider, delivery.destination, delivery.destinationWebhookUrl
- Return the full flow object after create and update so the frontend can immediately update its state

### Verify Output

- Using Postman or Insomnia, fully manage flows with a JWT token
- Creating a flow gives back a UUID-based webhookPath you can use immediately
- Deleting a flow also cleans up its delivery records
- Toggling active status works

---

# Phase 5 — Basic Forwarder (The Core Engine)

**Goal:** After a delivery is saved, forward the raw payload to the configured destination automatically.

**Why:** This is the product's core value. Without forwarding, HookFlow is just a database.

### Tasks

- Create a services/ folder in backend
- Create a forwarder.service.js file inside it
- The forwarder accepts a delivery document and its parent hookflow document
- It reads delivery.destination from the hookflow
- It makes an HTTP POST request to the destination URL using axios or node-fetch, sending the rawPayload as the body
- On success: update the Delivery record — set deliveryStatus to 'completed', save the response status code and response body
- On failure: update the Delivery record — set deliveryStatus to 'failed_permanently', save the error message
- In the createDelivery controller: after res.json() sends the 200 OK, trigger the forwarder in the background using setImmediate()
- The forwarder runs after the response is already sent — the source webhook caller never waits for it

**Key concept to understand:** setImmediate() schedules a function to run after the current event loop iteration completes. This means the HTTP response goes out first, then your forwarding runs. This is how you implement "acknowledge first, work later."

### Verify Output

- Send a POST request to your webhook URL → immediately get a 200 back
- A few seconds later, the destination URL (use webhook.site to test) receives the forwarded payload
- The Delivery record in MongoDB shows deliveryStatus: 'completed' and the destination's response

---

# Phase 6 — Delivery History API

**Goal:** API endpoints to read delivery history for any flow.

**Why:** The dashboard needs to display logs. This API powers that page.

### Tasks

- GET /api/delivery/:hookflowId — get all deliveries for a specific flow (paginated, newest first)
- GET /api/delivery/detail/:deliveryId — get a single delivery's full detail
- Protect both routes with authenticateUser middleware
- Verify the flow belongs to the logged-in user before returning its deliveries
- Support query params for pagination: ?page=1&limit=20
- Return useful summary fields: deliveryStatus, createdAt, receiverResponseStatusCode, attemptsToDestinationCount

### Verify Output

- After triggering a few webhooks, call the history endpoint → get a paginated list
- Calling the detail endpoint gives the full rawPayload and destination response

---

# Phase 7 — Next.js Project Setup + Routing Structure

**Goal:** Initialize the frontend project and set up the complete page structure.

**Why:** Before building any UI, the folder structure and routing must be correct. Fixing architecture mid-way in Next.js is painful.

### Tasks

- Create the Next.js app inside hookflow-webhook-automation-tool/frontend/ using App Router
- Set up the folder structure:
  - /app/(auth)/login
  - /app/(auth)/register
  - /app/(dashboard)/flows
  - /app/(dashboard)/flows/[id]
  - /app/(dashboard)/logs/[flowId]
  - /app/(dashboard)/logs/[flowId]/[deliveryId]
- Create a simple layout for the auth group (centered card)
- Create a sidebar layout for the dashboard group
- Set up a global CSS reset and color variables
- Install and configure axios for API calls
- Create an api/ utility file that attaches the JWT token to every request automatically
- Set up environment variable: NEXT_PUBLIC_API_URL pointing to the backend

### Verify Output

- Navigate to /login → see a centered layout placeholder
- Navigate to /flows → see a sidebar layout placeholder
- The routing structure is fully defined even if pages are empty

---

# Phase 8 — Auth UI (Register + Login Pages)

**Goal:** Working register and login pages connected to the backend.

**Why:** Everything else in the dashboard requires being logged in. Auth must come first.

### Tasks

- Build the Register page: name, email, password fields — calls POST /api/user/register
- Build the Login page: email, password fields — calls POST /api/user/login
- On successful login: store the JWT token in localStorage (or a cookie)
- After login: redirect to /flows
- Create an auth context (React Context) that provides the current user and token app-wide
- Create a protected route wrapper that redirects to /login if no token is found
- Wrap all dashboard routes with the protected route wrapper
- Show loading state while checking auth
- Show error messages inline (wrong password, user already exists)

### Verify Output

- Visit /flows without being logged in → redirected to /login
- Register a new account → redirected to /flows
- Login with wrong password → see error message
- Login successfully → token stored, land on /flows
- Refresh the page → still logged in

---

# Phase 9 — Flows Dashboard Page

**Goal:** The main dashboard page where users manage their flows.

**Why:** This is the primary UI of the product. Users live here.

### Tasks

- Fetch and display all flows for the logged-in user using GET /api/hookflow/
- Show each flow as a card with: name, status badge (active/inactive), webhook URL, created date
- Add a "Copy URL" button next to the webhook URL
- Add a Create Flow button that opens a form/modal
- The create form collects: flow name, source provider, destination type, destination URL
- On submit: call POST /api/hookflow/create — on success, add the new flow to the list without a page refresh
- Add a toggle button to enable/disable each flow (calls PATCH /api/hookflow/:id/toggle)
- Add a delete button with a confirmation step (calls DELETE /api/hookflow/:id)
- Show an empty state when the user has no flows yet

### Verify Output

- After login you see all your flows
- Create a new flow → it appears instantly in the list
- Toggle a flow → the badge updates immediately
- Delete a flow → it disappears from the list
- Copy the webhook URL → it's on your clipboard

---

# Phase 10 — Logs Dashboard Page

**Goal:** Users can view the full delivery history for each flow.

**Why:** Visibility into what happened is one of the core promises of HookFlow.

### Tasks

- Clicking a flow opens the logs page for that flow: /dashboard/logs/[flowId]
- Fetch deliveries from GET /api/delivery/:hookflowId (paginated)
- Display each delivery as a row: timestamp, status badge, destination response code
- Clicking a delivery opens the detail page: /dashboard/logs/[flowId]/[deliveryId]
- The detail page shows: raw incoming payload (formatted JSON), destination response body, error message if any, retry count, all timestamps
- Add a filter bar to filter by status (completed, failed, retrying)
- Add a Load More button for pagination
- Handle the empty state (no deliveries yet)

### Verify Output

- Trigger a few webhooks from Postman → navigate to logs page and see them
- Click a delivery → see the full payload details
- Status badges visible: green for completed, red for failed

---

# Phase 11 — Real-Time Log Feed (Socket.io)

**Goal:** New deliveries appear on the logs page instantly without refreshing.

**Why:** This is a major UX differentiator. Users watching their dashboard see live webhook activity.

### Tasks

- Install Socket.io on the backend
- When a new Delivery is created, emit a socket event to the room for that hookflowId
- On the frontend, install socket.io-client
- When the logs page loads, connect to the socket server and join the room for the current hookflowId
- When a new delivery event arrives, prepend it to the list
- Show a live indicator ("Live" badge) when socket is connected
- Disconnect from the socket room when the user navigates away

**Key concept to understand:** Socket.io uses the concept of rooms. Each flow gets its own room identified by its hookflowId. Only clients viewing that flow's logs page are in that room. When a webhook arrives, only they get notified — not every user on the platform.

### Verify Output

- Open the logs page in the browser
- Trigger a webhook from Postman
- Without refreshing, a new row appears at the top of the logs list

---

# Phase 12 — Transformation Engine: Field Mapping (Free Tier)

**Goal:** Users can configure which fields to extract and rename before forwarding.

**Why:** The raw payload from GitHub or Stripe is complex JSON. The destination (Discord, Slack) usually expects a simple, specific format.

**Tier model:**
This is the free tier transformation approach. It works when both the source and destination are known platforms from the supported enum list (github, stripe, discord, slack, etc.). Since both sides are known, you can ship pre-built transformer functions — one function per source→destination combination (e.g. githubPush→slack, stripePayment→discord). These are written once, run fast, and cost nothing per request. Field mapping is the manual, deterministic option for users who want predictable transformations without AI. The `other` option in the integration/delivery enums is the escape hatch that leads to AI transformation in Phase 14.

### Tasks

- Add a transformationRules field to the Hookflow schema as a structured object
- Support a mapping mode: user defines output field name → input field path (e.g. message: "body.head_commit.message")
- In the forwarder service: before forwarding, run the mapping rules using lodash.get to safely extract values
- Build the mapping UI in the Flow Editor page: add/remove field pairs
- On save: persist the mapping rules to the Hookflow document
- If no transformation is configured: forward the raw payload as-is
- Store the processedPayloadForDestination in the Delivery record

**Key concept to understand:** lodash.get(object, 'a.b.c') safely reads nested fields without crashing if a field is missing. Never use eval() or dynamic property access with untrusted keys.

### Verify Output

- Configure a flow with mapping: { text: "body.head_commit.message" }
- Trigger a GitHub-like webhook with a head_commit.message field
- The destination receives only { text: "your commit message" } — not the full raw payload
- The Delivery detail page shows both the raw and processed payloads

---

# Phase 13 — Transformation Engine: Filter Conditions

**Goal:** Users can set a condition that decides whether a webhook gets forwarded at all.

**Why:** Not every event from a source is relevant. A Stripe webhook might fire for every transaction — but you only care about failed ones over $100.

### Tasks

- Add a filterCondition field (string) to the Hookflow schema
- Install expr-eval library on the backend
- In the forwarder service: before forwarding, evaluate the filter condition against the raw payload
- If the condition evaluates to false: set deliveryStatus to 'filtered' and do not forward
- If no condition is set: always forward
- Build a filter condition input in the Flow Editor UI
- Show 'filtered' as a status in the delivery logs with its own badge color

**Key concept to understand:** expr-eval safely parses and evaluates mathematical and logical expressions like "amount > 100" without executing arbitrary code. This is why we use it instead of eval().

### Verify Output

- Set filter: "amount > 100" on a flow
- Send payload with amount: 50 → delivery saved with status 'filtered', destination not called
- Send payload with amount: 200 → delivery forwarded normally

---

# Phase 14 — AI Transformation (Gemini / OpenAI) (Premium Tier)

**Goal:** Users can write an AI prompt that rewrites the payload before it is forwarded.

**Why:** This is HookFlow's most powerful differentiator. A Stripe error JSON becomes a plain-English Slack message without any manual field mapping.

**Tier model:**
This is the premium tier transformation approach. It is used when the source or destination is set to `other` (custom/unknown platform), or when the user wants a dynamic, human-readable transformation instead of manual field mapping. The user writes a plain English prompt once when setting up the flow (e.g. "Summarize this GitHub push event as a Slack message with the committer's name and branch"). Your server sends the raw payload + prompt to Gemini/OpenAI and forwards whatever the AI returns. This works for any payload structure — GitHub, Stripe, or a completely custom webhook with unknown fields — because the AI reads the actual data and figures out the mapping itself. AI transformation and field mapping are mutually exclusive on a flow — a flow uses one or the other, not both.

### Tasks

- Add an aiPrompt field to the Hookflow schema (nullable string)
- Install the Google Generative AI SDK or OpenAI SDK
- In the forwarder service: if aiPrompt is set, send the raw payload + the prompt to the AI API
- The AI returns a processed string or JSON object
- Use the AI output as the forwarded payload
- If AI call fails: log the error, set deliveryStatus to 'failed_permanently', do not forward silently
- Add an AI prompt input field in the Flow Editor UI
- Make it clear in the UI that AI transformation replaces field mapping — they are mutually exclusive

### Verify Output

- Set prompt: "Summarize this GitHub push event in one sentence for a non-technical person."
- Trigger a push webhook
- Discord receives a human-readable sentence, not raw JSON
- The Delivery detail shows the AI output in the processedPayload field

---

# Phase 15 — Retry System (BullMQ + Redis)

**Goal:** When a destination fails, HookFlow automatically retries with delays between attempts.

**Why:** Destinations go down temporarily. A system that gives up on the first failure loses data. Real products retry.

### Tasks

- Install BullMQ and Redis (use Redis locally via Docker or Redis Cloud free tier)
- Create a delivery queue that processes forwarding jobs in the background
- When a delivery is saved, add it to the queue instead of using setImmediate()
- On job failure: BullMQ automatically retries based on the retryCount from the Hookflow config
- Use exponential backoff between retries (first retry after 30s, second after 2min, third after 10min)
- Update the Delivery record with attemptsToDestinationCount on each attempt
- After all retries exhausted: set deliveryStatus to 'failed_permanently'
- During retries: deliveryStatus is 'retrying'

**Key concept to understand:** A queue decouples the receiving of a webhook from the processing of it. Even if your forwarding service crashes mid-way, the job is still in the queue and will be picked up when it restarts. This is how production systems achieve reliability.

### Verify Output

- Point a flow at a destination URL that does not exist
- Trigger a webhook
- The Delivery status changes: received → retrying → retrying → failed_permanently
- The attemptsToDestinationCount increments with each retry
- The delays between retries grow

---

# Phase 16 — Secret Verification (HMAC Signature)

**Goal:** Verify that incoming webhooks are genuinely from the expected source.

**Why:** Without this, anyone who knows your webhook URL can send fake data. GitHub, Stripe, and others sign their requests with a shared secret.

### Tasks

- When a user sets a webhookSecret on a flow, enable verification for that flow
- When a webhook arrives: read the signature header (X-Hub-Signature-256 for GitHub, Stripe-Signature for Stripe)
- Use Node's built-in crypto module to compute HMAC-SHA256 of the raw request body using the shared secret
- Compare computed signature to the incoming header using a timing-safe comparison (crypto.timingSafeEqual)
- If signatures do not match: return 401, save the delivery with an error, do not forward
- If no secret is set: skip verification (backward compatible)

**Key concept to understand:** Use crypto.timingSafeEqual() instead of === for comparing signatures. A regular === exits as soon as it finds the first difference, which leaks timing information that attackers can exploit. timingSafeEqual always takes the same amount of time regardless of where the mismatch occurs.

### Verify Output

- Set a secret on a flow
- Send a request with the wrong signature → 401, delivery logged as failed
- Send a request with the correct signature → accepted and forwarded

---

# Phase 17 — Email Destination Support

**Goal:** Users can configure a flow to send an email instead of (or in addition to) a webhook.

**Why:** Email is the most universal destination. Many teams want webhook events delivered to an inbox.

### Tasks

- Install Nodemailer
- Add email as a destination type in the Hookflow schema
- Add emailConfig to the delivery config: to, subject template
- In the forwarder service: detect destination type and branch accordingly
- For email: compose the email body using the processed payload, send via SMTP
- The subject can reference a field from the payload (e.g. "Payment failed: {{amount}}")
- Add email destination configuration in the Flow Editor UI

### Verify Output

- Configure a flow with destination type: email and a recipient address
- Trigger a webhook
- An email arrives at the configured address with the payload content

---

# Phase 18 — UI Polish and Error States

**Goal:** The dashboard looks and behaves like a real product, not a prototype.

**Why:** This is a portfolio piece and a real product. First impressions matter for users and interviewers.

### Tasks

- Add skeleton loaders while data is fetching (not blank white screens)
- Add proper empty states with helpful messages and call-to-action buttons
- Add toast notifications for success and error actions (flow created, flow deleted, copy success)
- Handle network errors gracefully — show a retry button, not a broken page
- Make the webhook URL copy button show a visual confirmation ("Copied!" for 2 seconds)
- Add a loading spinner on form submission buttons
- Ensure all forms have proper client-side validation before hitting the API
- Test the full flow on mobile screen sizes and fix obvious breakages

### Verify Output

- The app feels polished and professional
- No blank screens. No silent failures
- Everything that can go wrong shows a helpful message

---

# Phase 19 — End-to-End Testing

**Goal:** Manually test the complete user journey from sign-up to receiving a forwarded webhook.

**Why:** Before deploying, you need to know the whole thing works together — not just individual endpoints.

### Tasks

- Register a new user account from the UI
- Create a new flow from the dashboard (use webhook.site as the destination)
- Copy the generated webhook URL
- Use Postman to simulate a GitHub push event to that URL
- Verify the delivery appears in the logs page instantly (Socket.io)
- Open the delivery detail — confirm raw payload is correct
- Check webhook.site — confirm the forwarded payload arrived
- Test with an inactive flow — confirm it rejects with 403
- Test the filter condition — confirm filtered deliveries do not reach the destination
- Test a wrong HMAC secret — confirm 401 response
- Test retry: point to a dead URL, confirm retries happen and status updates

### Verify Output

- A written checklist of everything that passed and anything that needs a fix before deployment

---

# Phase 20 — Deployment

**Goal:** HookFlow is live on the internet with a real URL.

### Tasks

- Create a MongoDB Atlas cluster (free tier) and move your data there
- Deploy the backend to Railway or Render (free tier available)
- Set all environment variables on the hosting platform
- Deploy the frontend to Vercel — connect to GitHub repo for auto-deployments
- Update NEXT_PUBLIC_API_URL to point to the deployed backend URL
- Update CORS on the backend to allow only the Vercel frontend domain
- Test the full end-to-end flow on the live URLs
- Register a domain if desired and point it to Vercel

### Verify Output

- A live URL you can share with anyone
- The full product works: sign up → create flow → trigger webhook → see log in real time

---

# Phase 21 — Load Testing with k6

**Goal:** Measure the real performance of HookFlow under load — locally first, then against the hosted production server.

**Why:** Knowing that the app works is not enough. You need to know how many concurrent webhooks it can handle, where it breaks, and what the latency looks like under stress. This is what separates a portfolio project from a production-grade system.

### Tasks

- Install k6 locally (https://k6.io/docs/get-started/installation/)
- Create a `load-tests/` folder at the project root
- Write a baseline test (`baseline.js`): 10 virtual users, 30 seconds, POST to the webhook receiver endpoint with a realistic GitHub-like payload
- Write a stress test (`stress.js`): ramp from 10 to 500 virtual users over 2 minutes, hold, then ramp down
- Write a spike test (`spike.js`): sudden burst of 1000 requests in 10 seconds to simulate a flood of webhooks
- Measure and record: request duration (p50, p90, p99), failure rate, throughput (requests/sec)
- Identify the bottleneck: is it the Express server, MongoDB write speed, or the forwarder HTTP call?
- Run the same tests against the deployed production server (Railway/Render) and compare results
- Document findings: what load the system handles comfortably, where it degrades, and what would need to change to scale further (e.g. connection pooling, horizontal scaling, queue workers)

### Verify Output

- k6 runs locally against `http://localhost:3000` with no errors at baseline load
- Stress test reveals the breaking point (e.g. p99 latency spikes above 2s at X users)
- Spike test shows how the system recovers after a sudden burst
- Production test numbers are documented and compared to local results

---

# Summary Table


| Phase | What You Build          | Visible Output                     |
| ----- | ----------------------- | ---------------------------------- |
| 1     | Fix foundation bugs     | Secure, correct existing endpoints |
| 2     | Harden the receiver     | Robust public webhook endpoint     |
| 3     | Auth middleware         | Protected routes with JWT          |
| 4     | Hookflow CRUD API       | Full flow management via API       |
| 5     | Basic forwarder         | Payload reaches destination        |
| 6     | Delivery history API    | Query delivery logs via API        |
| 7     | Next.js setup + routing | Frontend structure in place        |
| 8     | Auth UI                 | Working login and register pages   |
| 9     | Flows dashboard         | Manage flows from the browser      |
| 10    | Logs dashboard          | Browse delivery history in UI      |
| 11    | Real-time feed          | Live webhook events in dashboard   |
| 12    | Field mapping           | Custom payload reshaping           |
| 13    | Filter conditions       | Conditional forwarding             |
| 14    | AI transformation       | Human-readable forwarded messages  |
| 15    | Retry system            | Automatic retries with backoff     |
| 16    | Secret verification     | HMAC signature validation          |
| 17    | Email destination       | Webhooks delivered to inbox        |
| 18    | UI polish               | Production-quality interface       |
| 19    | End-to-end testing      | Verified complete user journey     |
| 20    | Deployment              | Live product on the internet       |
| 21    | k6 load testing         | Performance benchmarks under load  |


