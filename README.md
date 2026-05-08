# HookFlow - Webhook Automation Bridge

HookFlow is a developer-centric automation tool that receives webhooks from any source, transforms the data using rules or AI, and forwards it to multiple destinations such as Discord, Slack, Email, and Custom Webhooks.

---

# The Problem This Solves

Modern companies use 5 to 20 different SaaS tools. These tools usually do not communicate with each other directly. Every time two services need to integrate, developers spend hours reading documentation and writing custom integration code.

## Example Scenario

You want:

> "When a Stripe payment fails, send an alert to Slack and create a ticket in HubSpot."

---

## Without HookFlow (The Manual Way)

| Step | Task | Time |
|---|---|---|
| 1 | Read Stripe webhook documentation | 2 hours |
| 2 | Build a server to receive Stripe webhooks | 4 hours |
| 3 | Read Slack webhook documentation | 1 hour |
| 4 | Add Slack integration | 2 hours |
| 5 | Read HubSpot API documentation | 3 hours |
| 6 | Add HubSpot integration | 4 hours |
| 7 | Deploy and monitor everything | 2 hours |
| **Total** | **For ONE connection** | **18 hours** |

Now multiply that by every integration your company needs:

| Connection | Hours |
|---|---|
| Stripe → Slack | 18 |
| Stripe → HubSpot | 18 |
| GitHub → Slack | 18 |
| GitHub → PagerDuty | 18 |
| Datadog → Slack | 18 |
| Datadog → PagerDuty | 18 |
| **Total** | **108 hours** |

### Estimated Cost

- Developer cost: **$100/hour**
- Total cost: **$10,800**

---

## With HookFlow

Build HookFlow once.

After that, every new integration takes around **10 minutes** through a UI configuration. No coding required.

### Time Comparison

- 6 integrations × 10 minutes
- Total setup time: **1 hour**

### Estimated Cost

- Total cost: **$100**

---

# What HookFlow Does

HookFlow acts as a middleman between services that do not natively integrate.

## Workflow

1. User creates a **Flow** in the HookFlow dashboard
2. HookFlow generates a unique webhook URL

```txt
https://hookflow.io/hook/abc-123
```

3. User pastes that URL into any service that supports webhooks such as:
   - GitHub
   - Stripe
   - Discord
   - Datadog
   - Shopify
   - Any custom service

4. When the service sends data to HookFlow, it:
   - Receives the raw JSON payload
   - Transforms the data using rules or AI
   - Forwards the transformed payload to configured destinations
   - Logs every request and response

---

# Real-World Use Cases

| Trigger (Webhook Source) | Action (Destination) | Use Case |
|---|---|---|
| GitHub push event | Discord channel | Notify team when code is pushed |
| Stripe payment failed | Slack + Email | Alert sales team and notify customer |
| Datadog alert | PagerDuty | Automatically create incidents |
| GitHub issue created | HubSpot | Create CRM ticket automatically |
| Any webhook | Custom API | Forward transformed data internally |

---

# How HookFlow Works (7-Step Flow)

1. User creates a Flow in the dashboard
2. HookFlow generates a unique webhook endpoint
3. User adds the endpoint to GitHub, Stripe, or another webhook-enabled service
4. External service sends JSON payload to HookFlow
5. HookFlow stores the raw payload in MongoDB
6. HookFlow transforms the payload using:
   - Field mapping
   - Conditions
   - AI prompts
7. HookFlow forwards the transformed payload to destinations such as:
   - Discord
   - Slack
   - Email
   - Custom Webhooks

Finally, the user can view every request and response in a live dashboard.

---

# Technical Architecture

## Technology Stack

| Component | Technology | Why |
|---|---|---|
| Frontend | Next.js (App Router) | SEO + React dashboard |
| Backend | Node.js + Express | Fast webhook ingestion |
| Database | MongoDB | Flexible JSON schema |
| Real-time Updates | Socket.io | Live logs without refresh |
| AI Integration | Gemini / OpenAI API | Smart transformations |
| Queue System (Optional) | BullMQ + Redis | Retries and reliability |

---

# Core System Flow

```txt
External Service (GitHub / Stripe / Datadog)
                │
                │ POST webhook JSON
                ▼

┌──────────────────────────────────────────────┐
│ HookFlow Endpoint: POST /hook/:id           │
│----------------------------------------------│
│ • Validate secret key (optional)            │
│ • Save raw JSON to Logs collection          │
│ • Emit socket event for live dashboard      │
└──────────────────────────────────────────────┘
                │
                ▼

┌──────────────────────────────────────────────┐
│ Transformation Engine                       │
│----------------------------------------------│
│ • Manual field mapping (lodash.get)         │
│ • Filter conditions (expr-eval)             │
│ • AI summarization (Gemini/OpenAI)          │
└──────────────────────────────────────────────┘
                │
                ▼

┌──────────────────────────────────────────────┐
│ Forwarder                                   │
│----------------------------------------------│
│ • Send Email (Nodemailer / SendGrid)        │
│ • Send Discord / Slack webhook              │
│ • Send Custom URL (axios/fetch)             │
│ • Update logs with success/failure status   │
└──────────────────────────────────────────────┘
```

---

# Feature Requirements

## Phase 1: Core Receiver

- [ ] Create `POST /hook/:id` endpoint
- [ ] Save `req.body` to MongoDB Logs collection
- [ ] Return `200 OK`

---

## Phase 2: Forwarder

- [ ] Trigger forwarding after payload is saved
- [ ] Start with `console.log`
- [ ] Add Email support
- [ ] Add Discord support
- [ ] Update logs with:
  - Status
  - Destination response
  - Errors

---

## Phase 3: Dashboard

- [ ] JWT Authentication
- [ ] Register/Login system
- [ ] Create, edit, delete flows
- [ ] Generate unique webhook URLs
- [ ] Live logs using Socket.io
- [ ] Detailed log viewer showing:
  - Raw payload
  - Transformed payload
  - Destination response

---

## Phase 4: Logic Engine

- [ ] Manual mapping UI
- [ ] Filter conditions

Example:

```txt
Only forward if amount > 100
```

- [ ] AI prompt transformations

Example:

```txt
Summarize this error log for my boss
```

- [ ] Safe expression parser
- [ ] No direct `eval()` usage

---

## Phase 5: Destinations

- [ ] Email (Nodemailer / SendGrid)
- [ ] Discord Webhook
- [ ] Slack Webhook
- [ ] Custom Webhook URL

---

# Database Schema

## Flows Collection

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "GitHub to Discord Alerts",
  "webhookUrl": "/hook/abc-123",
  "secretKey": "optional-secret-for-validation",
  "isActive": true,
  "transformationRules": {
    "type": "manual",
    "mapping": {
      "discord_message": "body.head_commit.message"
    },
    "filter": "body.amount > 100",
    "aiPrompt": "Summarize this JSON into a short alert"
  },
  "destination": {
    "type": "discord",
    "url": "https://discord.com/api/webhooks/...",
    "emailConfig": {
      "to": "team@company.com"
    }
  },
  "createdAt": "Date"
}
```

---

## Logs Collection

```json
{
  "_id": "ObjectId",
  "flowId": "ObjectId",
  "rawPayload": {},
  "transformedPayload": {},
  "destinationResponse": {},
  "status": "success",
  "errorMessage": null,
  "createdAt": "Date"
}
```

### Field Explanation

| Field | Description |
|---|---|
| rawPayload | Original webhook JSON |
| transformedPayload | Payload after mapping/AI |
| destinationResponse | Response from Discord/Email/API |
| status | success or failed |
| errorMessage | Failure reason if request fails |

---

## Users Collection

```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "passwordHash": "bcrypt_hash",
  "createdAt": "Date"
}
```

---

# API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create new user |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/flows` | Get all flows |
| POST | `/flows` | Create flow |
| PUT | `/flows/:id` | Update flow |
| DELETE | `/flows/:id` | Delete flow |
| POST | `/hook/:id` | Public webhook receiver |
| GET | `/logs/:flowId` | Get logs for a flow |
| GET | `/logs/:flowId/live` | Live WebSocket logs |

---

# Getting Started

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Optional:
  - OpenAI API Key
  - Gemini API Key

---

# Installation

```bash
# Clone repository
git clone https://github.com/yourusername/hookflow.git

# Enter project directory
cd hookflow

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials

# Start MongoDB
mongod

# Run development server
npm run dev
```

---

# Environment Variables

## `.env`

```env
PORT=3000

MONGODB_URI=mongodb://localhost:27017/hookflow

JWT_SECRET=your-super-secret-key-change-this

OPENAI_API_KEY=optional-if-using-ai

GEMINI_API_KEY=optional-if-using-gemini

EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

# Example Workflow

## GitHub Push → Discord Notification

### Step 1: Create Flow

Create a new flow in the HookFlow dashboard.

### Step 2: Configure Flow

| Field | Value |
|---|---|
| Name | GitHub Discord Alerts |
| Destination | Discord Webhook |
| Webhook URL | `https://discord.com/api/webhooks/xxx/yyy` |

HookFlow generates:

```txt
https://hookflow.io/hook/abc-123
```

---

### Step 3: Configure GitHub Webhook

Go to:

```txt
GitHub → Repository → Settings → Webhooks → Add webhook
```

### Configure:

| Setting | Value |
|---|---|
| Payload URL | `https://hookflow.io/hook/abc-123` |
| Content Type | `application/json` |
| Events | Just the push event |

Save the webhook.

---

### Result

Every GitHub push will:

1. Send JSON payload to HookFlow
2. HookFlow transforms data
3. HookFlow forwards notification to Discord

---

# Why This Project Matters

| Metric | Without HookFlow | With HookFlow |
|---|---|---|
| Time to connect 2 services | 18 hours | 10 minutes |
| Cost for 6 integrations | $10,800 | $100 |
| Developer involvement | Required every time | Only once |
| Visibility into failures | Hidden in logs | Live dashboard |
| Retry handling | Manual | Automatic |
| API changes | Require code updates | Configure in UI |

---

# Future Enhancements

## Reliability

- [ ] Retry queue with exponential backoff
- [ ] BullMQ integration
- [ ] Redis queue system
- [ ] Dead-letter queue

---

## Security

- [ ] Webhook signature verification
- [ ] Rate limiting per flow
- [ ] Idempotency keys
- [ ] Secret-based validation

---

## Developer Features

- [ ] Export logs to CSV/JSON
- [ ] Custom JavaScript transformations
- [ ] Sandbox execution environment
- [ ] Flow templates

---

## Team Features

- [ ] Team accounts
- [ ] Organization workspaces
- [ ] Shared dashboards
- [ ] Role-based permissions

---

# Final Vision

HookFlow becomes a universal automation bridge between disconnected systems.

Instead of writing custom integrations repeatedly, developers configure flows visually while HookFlow handles:

- Webhook ingestion
- Transformation
- AI processing
- Forwarding
- Monitoring
- Retries
- Logging
- Reliability

The result:

> Faster integrations, lower engineering costs, and complete visibility into automation pipelines.
