# docs-api

A Deno-based microservice for generating API documentation from npm packages.

## Overview

This service uses `@deno/doc` to generate documentation nodes from npm package types via esm.sh. It's designed to run on Vercel using the `vercel-deno` community runtime.

## Deployment

1. Deploy as a separate Vercel project
2. Configure custom domain (e.g., `docs-api.npmx.dev`)
3. Optionally set `API_SECRET` environment variable for authentication

## API

### POST /api/generate

Generate documentation for an npm package.

**Request:**

```json
{
  "package": "ufo",
  "version": "1.5.0"
}
```

**Response (success):**

```json
{
  "nodes": [...]
}
```

**Response (error):**

```json
{
  "error": "not_found",
  "message": "Package types not found"
}
```

## Local Development

```bash
cd docs-api
deno run --allow-net --allow-env api/generate.ts
```

## Environment Variables

- `API_SECRET` (optional): Bearer token for authentication
