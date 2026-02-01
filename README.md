# Application Automation

A Next.js application for automating email outreach and contact management with Gmail integration, AI-powered message generation, and sequence automation.

## Features

- **Contact Management** - Create, update, and organize contacts with custom fields
- **Email Sequences** - Build automated multi-step email sequences
- **Gmail Integration** - Send and receive emails via Gmail API
- **AI Message Generation** - Generate personalized email content using OpenAI
- **Webhook Support** - Receive real-time notifications via Google Pub/Sub
- **Auth0 Authentication** - Secure user authentication and session management
- **Rate Limiting** - Built-in API rate limiting to prevent abuse
- **Audit Logging** - Track all sensitive operations for compliance

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth0
- **Email**: Gmail API
- **AI**: OpenAI API
- **UI**: Material UI, React Hook Form, TanStack Query
- **Testing**: Vitest
- **Deployment**: Docker, Kubernetes, Helm

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Auth0 account
- Google Cloud project with Gmail API enabled
- OpenAI API key (for AI features)

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/lcrostarosa/application-automation.git
cd application-automation
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) for details on each variable.

### 3. Set Up Database

```bash
# Run database migrations
npm run db:migrate:dev

# Generate Prisma client
npm run db:generate
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run db:migrate:dev` | Run migrations (development) |
| `npm run db:migrate:deploy` | Run migrations (production) |
| `npm run db:migrate:status` | Check migration status |
| `npm run db:generate` | Generate Prisma client |

## Environment Variables

### Auth0

| Variable | Description |
|----------|-------------|
| `AUTH0_DOMAIN` | Your Auth0 domain (e.g., `dev-xxxxx.us.auth0.com`) |
| `AUTH0_CLIENT_ID` | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret |
| `AUTH0_SECRET` | Session encryption secret (generate with `openssl rand -hex 32`) |

### Application

| Variable | Description |
|----------|-------------|
| `APP_BASE_URL` | Application base URL (e.g., `http://localhost:3000`) |
| `API_SECRET` | Server-side signing secret (optional) |

### Google / Gmail

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI |
| `GOOGLE_REFRESH_TOKEN` | Long-lived refresh token for Gmail access |
| `EMAIL_ADDRESS` | Sender email address |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project ID (for Pub/Sub) |
| `GOOGLE_CLIENT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key |

### Pub/Sub Webhook

| Variable | Description |
|----------|-------------|
| `PUBSUB_VERIFICATION_AUDIENCE` | Webhook URL for OIDC token verification |
| `PUBSUB_SERVICE_ACCOUNT_EMAIL` | Pub/Sub service account email |

### Database

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (runtime) |
| `DATABASE_ADMIN_URL` | PostgreSQL connection string (migrations) |

## Database RBAC

The application supports role-based database access:

- **app_admin** - Full DDL privileges for migrations
- **app_readwrite** - CRUD operations for API runtime
- **app_readonly** - SELECT only for reporting (optional)

See `prisma/postgres-roles.sql` for role setup scripts.

## Docker

### Build Image

```bash
docker build -t application-automation .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

This starts the application with a PostgreSQL database.

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster
- Helm 3+
- kubectl configured

### Deploy with Helm

```bash
# Create namespace
kubectl create namespace application-automation

# Create secrets
kubectl create secret generic application-automation-secrets \
  --namespace application-automation \
  --from-literal=AUTH0_SECRET=your-secret \
  --from-literal=AUTH0_CLIENT_SECRET=your-secret \
  # ... other secrets

# Install chart
helm install application-automation ./helm/application-automation \
  --namespace application-automation \
  --set image.tag=latest \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=app.example.com
```

### Helm Values

Key configuration options in `values.yaml`:

| Value | Default | Description |
|-------|---------|-------------|
| `replicaCount` | 2 | Number of pod replicas |
| `image.repository` | application-automation | Container image |
| `ingress.enabled` | false | Enable ingress |
| `autoscaling.enabled` | false | Enable HPA |
| `migration.enabled` | true | Run migrations on deploy |

See `helm/application-automation/values.yaml` for all options.

## CI/CD

### GitHub Actions Workflows

#### CI (`.github/workflows/ci.yml`)

Runs on pull requests and pushes to main:

- **Lint** - ESLint code quality checks
- **Test** - Vitest unit tests
- **Build** - Next.js production build
- **Migration Check** - Validates Prisma migrations against PostgreSQL

#### Deploy (`.github/workflows/deploy.yml`)

Runs on pushes to main or manual trigger:

- Builds and pushes Docker image to GitHub Container Registry
- Deploys to staging automatically
- Deploys to production via manual workflow dispatch

### Required Secrets

| Secret | Description |
|--------|-------------|
| `KUBECONFIG` | Kubernetes cluster config |

### Required Variables

| Variable | Description |
|----------|-------------|
| `NAMESPACE` | Kubernetes namespace |
| `INGRESS_HOST` | Ingress hostname |
| `APP_URL` | Application URL |
| `SECRETS_NAME` | Kubernetes secrets name |
| `DB_SECRET_NAME` | Database credentials secret |

## API Endpoints

### Health

- `GET /api/health` - Health check with database connectivity

### Contacts

- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts/[id]` - Get contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Messages

- `GET /api/messages/pending` - List pending messages
- `POST /api/messages/[id]/approve` - Approve message for sending
- `POST /api/messages/[id]/generate` - Generate AI content

### Sequences

- `GET /api/sequences` - List sequences
- `POST /api/sequences` - Create sequence
- `GET /api/sequences/[id]` - Get sequence
- `PUT /api/sequences/[id]` - Update sequence

### Email

- `POST /api/send-email` - Send email
- `POST /api/webhook` - Pub/Sub webhook for email events

## Security Features

### Rate Limiting

Built-in sliding window rate limiter:

- **API endpoints**: 60 requests/minute
- **Webhook**: 100 requests/minute
- **Send email**: 100 requests/hour

### Webhook Authentication

Pub/Sub webhooks are verified using OIDC tokens:

1. Validates JWT signature against Google's public keys
2. Verifies audience matches configured URL
3. Confirms service account email

### Audit Logging

Sensitive operations are logged with:

- Timestamp
- User ID
- Action type
- Resource affected
- IP address
- Request metadata

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## License

Private - All rights reserved.
