#!/usr/bin/env deno run --allow-net --allow-env

import { doc } from 'jsr:@deno/doc'

interface GenerateRequest {
  package: string
  version: string
}

interface GenerateResponse {
  nodes: unknown[]
}

interface ErrorResponse {
  error: string
  message?: string
}

/**
 * Validate the authorization header against the API secret.
 * If no secret is configured, all requests are allowed.
 */
function validateAuth(req: Request): boolean {
  const expectedToken = Deno.env.get('API_SECRET')
  if (!expectedToken) return true

  const authHeader = req.headers.get('Authorization')
  return authHeader === `Bearer ${expectedToken}`
}

/**
 * Generate API documentation for an npm package using @deno/doc.
 *
 * POST /api/generate
 * Body: { package: string, version: string }
 *
 * @returns { nodes: DocNode[] } or { error: string, message?: string }
 * @see https://github.com/denoland/deno_doc
 */
export default async function handler(req: Request): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add CORS headers for the main app
  const origin = req.headers.get('Origin')
  if (origin) {
    // Allow requests from npmx.dev and localhost for development
    // TODO: might need to add other origins?
    const allowedOrigins = [
      'https://npmx.dev',
      'https://www.npmx.dev',
      'http://localhost:3000',
      'http://localhost:3001',
    ]
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      headers['Access-Control-Allow-Origin'] = origin
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    }
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    const error: ErrorResponse = { error: 'method_not_allowed' }
    return new Response(JSON.stringify(error), { status: 405, headers })
  }

  // Check authorization
  if (!validateAuth(req)) {
    const error: ErrorResponse = { error: 'unauthorized' }
    return new Response(JSON.stringify(error), { status: 401, headers })
  }

  try {
    const body: GenerateRequest = await req.json()

    // Validate request body
    if (!body.package || typeof body.package !== 'string') {
      const error: ErrorResponse = {
        error: 'bad_request',
        message: 'package is required',
      }
      return new Response(JSON.stringify(error), { status: 400, headers })
    }

    if (!body.version || typeof body.version !== 'string') {
      const error: ErrorResponse = {
        error: 'bad_request',
        message: 'version is required',
      }
      return new Response(JSON.stringify(error), { status: 400, headers })
    }

    // Build esm.sh URL for the package types
    const specifier = `https://esm.sh/${body.package}@${body.version}?target=deno`

    // Generate documentation using @deno/doc
    const docNodes = await doc([specifier])

    // The doc function returns a record keyed by specifier
    // We want to return all nodes from all specifiers
    const allNodes: unknown[] = []
    for (const nodes of Object.values(docNodes) as unknown[][]) {
      allNodes.push(...nodes)
    }

    const response: GenerateResponse = { nodes: allNodes }
    return new Response(JSON.stringify(response), { status: 200, headers })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Check for common error patterns
    if (
      message.includes('Could not find') ||
      message.includes('404') ||
      message.includes('Not Found')
    ) {
      const errorResponse: ErrorResponse = {
        error: 'not_found',
        message: 'Package types not found',
      }
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers,
      })
    }

    // Generic error
    const errorResponse: ErrorResponse = {
      error: 'generation_failed',
      message,
    }
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers,
    })
  }
}
