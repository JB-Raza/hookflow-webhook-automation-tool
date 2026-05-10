# HookFlow - Project Context

---

# What is HookFlow?

HookFlow is a webhook automation bridge.

It receives data from one service, modifies that data based on user-defined rules, and sends it to another service.

Think of it as a programmable middleman that sits between services that do not normally communicate with each other.

---

# What Problem Does It Solve?

Companies use many different tools, but those tools usually cannot communicate directly.

Normally, developers must write custom integration code every time two services need to exchange data.

HookFlow eliminates that custom code.

Users configure the connection once through a dashboard, and after that, every event automatically flows from source to destination.

---

# What Will HookFlow Do?

## Core Capability

Receive a webhook → transform the data → forward it somewhere else.

---

## Example 1: GitHub → Discord

When someone pushes code to GitHub:

1. HookFlow catches the webhook event
2. Extracts the commit message
3. Rewrites it into a readable sentence
4. Sends that sentence to a Discord channel

---

## Example 2: Stripe → Email + Task Management

When a customer's payment fails in Stripe:

1. HookFlow detects the event
2. Checks if the amount is over `$100`
3. Sends an email to the support team
4. Creates a task in a project management tool

---

# How HookFlow Works (No Code)

---

## Step 1 - User Creates a Flow

The user logs into the HookFlow dashboard and creates a new flow.

They configure:

- Flow name
- Source service
- Destination service
- Transformation rules
- Filter conditions

---

## Step 2 - HookFlow Generates a URL

The system generates a unique webhook URL for that flow.

Example:

```txt
https://hookflow.io/hook/abc-123
```

The user copies this URL.

---

## Step 3 - User Configures the Source

The user goes to the source platform (GitHub, Stripe, etc.) and pastes the HookFlow URL into the webhook configuration page.

Optional:
- Secret key for request verification

---

## Step 4 - User Configures the Destination

The user configures the destination service.

Examples:
- Discord webhook URL
- Slack webhook URL
- Email credentials
- API endpoint

---

## Step 5 - Source Sends Data

When an event happens:
- GitHub push
- Stripe payment failure
- Datadog alert

The source service sends a JSON payload as an HTTP POST request to the HookFlow URL.

---

## Step 6 - HookFlow Processes the Data

HookFlow:

1. Receives the JSON payload
2. Finds which flow owns the URL
3. Checks whether the flow is active
4. Verifies secret key if configured
5. Applies transformation rules
6. Runs filters
7. Optionally sends data to AI for summarization or rewriting

---

## Step 7 - HookFlow Forwards the Data

HookFlow sends the transformed data to the destination service.

Examples:
- Discord
- Slack
- Email
- Custom APIs

If the destination fails:
- HookFlow retries automatically
- Delays are added between attempts

---

## Step 8 - HookFlow Records Everything

For every request, HookFlow stores:

- Raw incoming payload
- Transformed payload
- Destination response
- Timestamp
- Success or failure state
- Retry history

Users can view this in real-time on the dashboard.

---

# Main Components of HookFlow

---

## User Management

Users can:

- Create accounts
- Log in
- Manage their own flows
- View only their own logs

---

## Flow Management

Users can:

- Create flows
- Edit flows
- Delete flows
- Disable flows temporarily

Each flow contains:
- Unique webhook URL
- Transformation rules
- Filters
- Destination configuration

---

## Webhook Receiver

A public HTTP endpoint that:

- Accepts POST requests
- Extracts flow identifier from URL
- Saves raw incoming data immediately

Purpose:
- Prevent data loss
- Ensure reliable logging

---

## Transformation Engine

The transformation engine modifies incoming JSON.

### Supported Modes

#### Manual Mapping

User selects:
- which fields to keep
- how to rename them

---

#### Filter Rules

Example:

```txt
Only forward if amount > 100
```

---

#### AI Processing

Send payload to AI with custom prompt.

Example:

```txt
Summarize this error for non-technical users
```

---

## Forwarder

Responsible for sending transformed data to destinations.

### Supported Destinations

- Discord webhooks
- Slack webhooks
- Custom APIs
- Email via SMTP
- Services with REST APIs

---

## Logging System

Every request stores complete history.

Users can:
- Browse logs
- Filter logs
- Open log details
- Inspect transformations
- Inspect destination responses

---

## Real-Time Feed

Dashboard updates instantly when new webhooks arrive.

No page refresh required.

---

## Dashboard

The dashboard allows users to:

- Create flows
- Configure transformations
- Monitor activity
- View logs
- Test configurations

---

# Key Decisions the User Makes Per Flow

The user configures:

| Setting | Description |
|---|---|
| Name | Internal reference name |
| Source Type | Service sending webhook |
| Secret Key | Optional verification secret |
| Active / Inactive | Whether flow should process events |
| Transformation Rules | How incoming data should change |
| Filter Condition | Whether event should forward |
| Destination Type | Where data should go |
| Destination Address | Webhook URL / Email / API |
| Retry Settings | Retry attempts and delays |

---

# What the User Does NOT Configure

The user does **not** control:

| Item | Reason |
|---|---|
| Incoming JSON structure | Determined by source service |
| HTTP method | Always POST |
| Content type | Usually JSON |
| When webhooks are sent | Controlled by source platform |

---

# Failure Scenarios

---

## Scenario 1 - Malformed JSON

HookFlow:
- Saves request
- Marks log as failed
- Shows error in dashboard

---

## Scenario 2 - Destination Is Down

HookFlow:
- Retries request
- Waits between attempts
- Logs all failures

If retries exhaust:
- Log marked failed

---

## Scenario 3 - Filter Syntax Error

HookFlow:
- Receives webhook successfully
- Saves payload
- Fails during filter evaluation
- Does not forward request

Error appears in logs.

---

## Scenario 4 - AI Service Unavailable

Transformation fails.

Result:
- Data not forwarded
- Error logged in dashboard

---

# Dashboard Pages

---

## Flows Page

Displays:
- Flow name
- Status
- Webhook URL
- Last modified date

Actions:
- Create
- Edit
- Delete
- Enable / Disable

---

## Flow Editor Page

Sections include:

- Basic info
- Source configuration
- Transformation rules
- Filter conditions
- Destination settings
- Retry policy

---

## Logs Page

Displays:

- Timestamp
- Flow name
- Status
- Destination response summary

Filters:
- Flow name
- Success / failure

---

## Log Detail Page

Displays:

- Raw incoming JSON
- Transformed payload
- AI output
- Destination response
- Errors
- Retry history
- Timestamps

---

# What Is NOT Included in MVP

The initial version does NOT include:

- Team accounts
- Multi-user organizations
- Scheduled jobs / cron triggers
- Custom JavaScript execution
- Native mobile app
- CSV / JSON export
- Built-in webhook testing
- Rate limiting
- Idempotency protection
- File upload support
- Custom webhook domains

---

# MVP Success Checklist

## Required Features

- [ ] User registration and login
- [ ] Create flows
- [ ] Generate unique webhook URLs
- [ ] Receive test POST requests
- [ ] Save webhook data to database
- [ ] Forward payload to destination
- [ ] Display logs in dashboard
- [ ] View raw and transformed payloads

---

## Nice-to-Have Features

- [ ] Transformation UI
- [ ] Filter conditions
- [ ] AI integration
- [ ] Real-time logs
- [ ] Secret verification
- [ ] Retry system

---

# Target User

The ideal user is:

- Developer
- Technical product person
- Automation-focused team

They:
- Understand webhooks
- Use tools like GitHub, Stripe, Discord
- Want automation without maintaining custom code

They expect:
- Clean UI
- Reliable logs
- Clear error handling

---

# Product Limitations

Users should understand:

---

## Webhook Dependency

HookFlow only works with services that support outgoing webhooks.

---

## Destination Dependency

HookFlow can only send data to:
- webhook endpoints
- APIs
- email systems

---

## Log Retention

Logs are not permanent analytics storage.

They accumulate until:
- deleted
- expired
- archived

---

## Delivery Guarantees

HookFlow retries delivery but does not guarantee permanent delivery.

If destination remains unavailable too long:
- event may be dropped

---

## AI Costs

AI transformations require external AI APIs.

Additional AI usage costs are not included by HookFlow.

---

# Final Product Vision

HookFlow is a universal automation bridge between disconnected services.

Instead of writing custom integrations repeatedly, users configure flows visually while HookFlow handles:

- Webhook ingestion
- Transformation
- AI processing
- Delivery
- Retries
- Monitoring
- Logging

The goal is:

> Faster integrations, lower engineering cost, and complete visibility into automated workflows.

---

# Business Case: The Real Cost of Custom Integrations

Every time two services need to communicate, developers spend significant time building and maintaining custom integration code.

## Without HookFlow

A single integration (e.g. Stripe → Slack) involves:

- Reading the source service's webhook documentation
- Building a server to receive webhooks
- Reading the destination service's documentation
- Building the forwarding logic
- Deploying and monitoring everything

Each integration takes approximately 18 hours of developer time at an estimated cost of $100/hour.

Multiply that across six typical company integrations and the total cost reaches roughly $10,800.

## With HookFlow

Each new integration takes approximately 10 minutes through the dashboard UI. No coding required.

Six integrations take about one hour total, bringing the cost down to approximately $100.

---

# Real-World Use Cases

| Trigger (Source) | Action (Destination) | Purpose |
|---|---|---|
| GitHub push event | Discord channel | Notify team when code is pushed |
| Stripe payment failed | Slack + Email | Alert sales team and notify customer |
| Datadog alert | PagerDuty | Automatically create incidents |
| GitHub issue created | HubSpot | Create CRM ticket automatically |
| Any webhook | Custom API | Forward transformed data internally |

---

# Technology Stack Decisions

| Component | Technology | Reason |
|---|---|---|
| Frontend | Next.js (App Router) | SEO support and React-based dashboard |
| Backend | Node.js + Express | Fast webhook ingestion |
| Database | MongoDB | Flexible JSON schema for varying payloads |
| Real-time Updates | Socket.io | Live log feed without page refresh |
| AI Integration | Gemini / OpenAI API | Smart payload transformation and summarization |
| Queue System (Optional) | BullMQ + Redis | Retry reliability and background job processing |

Key library decisions:
- `lodash.get` for safe field mapping inside transformation rules (no eval)
- `expr-eval` for safely parsing filter condition expressions (e.g. `amount > 100`)
- `Nodemailer` or `SendGrid` for email destination support

---

# Development Phases

## Phase 1: Core Receiver
The public webhook endpoint. Accepts POST requests, saves raw payload to the database, and returns 200 OK immediately.

## Phase 2: Forwarder
Triggers after the payload is saved. Sends the payload to the configured destination. Updates the Delivery record with the result, status, and any errors.

## Phase 3: Dashboard
JWT authentication, user registration and login, flow management (create, edit, delete), unique webhook URL generation, live log feed using Socket.io, and a detailed log viewer.

## Phase 4: Logic Engine
Manual field mapping UI, filter conditions (e.g. only forward if amount > 100), AI prompt transformations (e.g. summarize this error for non-technical users), and safe expression parsing without direct eval usage.

## Phase 5: Destinations
Full support for Email (Nodemailer / SendGrid), Discord webhooks, Slack webhooks, and custom webhook URLs.

---

# Required Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Port the Express server listens on |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing and verifying JWTs |
| `OPENAI_API_KEY` | Optional, only if using OpenAI for transformations |
| `GEMINI_API_KEY` | Optional, only if using Gemini for transformations |
| `EMAIL_HOST` | SMTP host for email destination support |
| `EMAIL_USER` | SMTP email address |
| `EMAIL_PASS` | SMTP app password |

---

# Why This Project Matters

| Metric | Without HookFlow | With HookFlow |
|---|---|---|
| Time to connect 2 services | 18 hours | 10 minutes |
| Cost for 6 integrations | $10,800 | $100 |
| Developer involvement | Required every time | Only once |
| Visibility into failures | Hidden in server logs | Live dashboard |
| Retry handling | Manual | Automatic |
| API changes in source/destination | Require code updates | Reconfigure in UI |

---

# Future Enhancements

## Reliability

- Retry queue with exponential backoff
- BullMQ integration for background job processing
- Redis-backed queue system
- Dead-letter queue for permanently failed deliveries

## Security

- Webhook signature verification per flow
- Rate limiting per flow
- Idempotency keys to prevent duplicate processing
- Secret-based request validation

## Developer Features

- Export delivery logs to CSV or JSON
- Custom JavaScript transformation support
- Sandboxed execution environment for custom code
- Pre-built flow templates for common integrations

## Team Features

- Team accounts
- Organization workspaces
- Shared dashboards across team members
- Role-based access permissions

---

# Critical Engineering Rule: Acknowledge First, Work Later

## The Problem

When an external service (GitHub, Stripe, etc.) sends a webhook to HookFlow, it starts a timer.

If HookFlow does not respond within a few seconds, the source marks the delivery as **failed** and may retry — even if HookFlow was actually processing the request successfully in the background.

This causes duplicate deliveries and wasted retries.

---

## The Wrong Flow (Never Do This)

```
Source sends POST →
  HookFlow receives it →
    Saves to DB →
      Calls AI to transform →
        Forwards to Discord →
          Discord responds →
            NOW HookFlow sends 200 to source  ← Too late
```

The entire chain could take 3–10 seconds. If the AI call or destination is slow, the source times out and retries. You now have duplicate deliveries.

---

## The Correct Flow (Always Do This)

```
Source sends POST →
  HookFlow receives it →
    Saves raw payload to DB →
      Immediately sends 200 OK to source  ← Source is satisfied, connection closed
        (separately, in the background)
          Transforms the payload →
            Forwards to destination →
              Updates the Delivery record with the result
```

The source gets its response in milliseconds. It does not care what happens after that.

---

## The Rule for Every Developer Working on This Codebase

> The webhook receiver must return `200 OK` immediately after saving the raw payload to the database.
>
> Transformation, AI processing, and forwarding always happen **after** the response is sent, in a background process.
>
> Never put downstream work between the database save and the HTTP response.
