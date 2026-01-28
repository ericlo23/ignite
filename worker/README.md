# Ignite Auth Worker

Cloudflare Worker that acts as a token broker for Google OAuth authorization code flow.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up local development

Configure environment variables in the `.dev.vars` file (see `.dev.vars.example`).

### 3. Set production secrets

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

### 4. Configure KV namespace

The KV namespace ID is already configured in `wrangler.toml`. If you need to create a new one:

```bash
npx wrangler kv:namespace create SESSIONS
```

Then update the `id` in `wrangler.toml`.

## Development

Start the local development server:

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`.

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

The worker will be deployed to `https://ignite-auth.<your-subdomain>.workers.dev`.

## Endpoints

- `GET /auth/login?redirect_uri=<uri>` - Returns Google OAuth URL
- `POST /auth/callback` - Exchanges auth code for tokens
- `POST /auth/refresh` - Refreshes access token using session
- `POST /auth/revoke` - Revokes session and refresh token

## Configuration

- **Production**: Edit `ALLOWED_ORIGIN` in `wrangler.toml`
- **Development**: Edit `ALLOWED_ORIGIN` in `.dev.vars`
