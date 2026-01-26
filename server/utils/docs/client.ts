/**
 * Deno Integration (Microservice)
 *
 * In production, calls a remote Deno microservice to generate docs.
 * In development, uses local deno subprocess if available, otherwise falls back to remote.
 *
 * @module server/utils/docs/client
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { DenoDocNode, DenoDocResult } from '#shared/types/deno-doc'

const execFileAsync = promisify(execFile)

// =============================================================================
// Configuration
// =============================================================================

/** URL of the docs generation microservice */
const DOCS_API_URL = process.env.DOCS_API_URL || 'https://docs-api.npmx.dev/api/generate'

/** Optional API secret for authenticating with the microservice */
const DOCS_API_SECRET = process.env.DOCS_API_SECRET

/** Timeout for deno doc command in milliseconds (2 minutes) */
const DENO_DOC_TIMEOUT_MS = 2 * 60 * 1000

/** Timeout for remote API requests in milliseconds (2 minutes) */
const REMOTE_API_TIMEOUT_MS = 2 * 60 * 1000

/** Maximum buffer size for deno doc output (50MB for large packages like React) */
const DENO_DOC_MAX_BUFFER = 50 * 1024 * 1024

// =============================================================================
// Main Export
// =============================================================================

/**
 * Get documentation nodes for a package.
 *
 * In production, calls the remote docs-api microservice.
 * In development, uses local deno subprocess if available, otherwise falls back to remote.
 */
export async function getDocNodes(packageName: string, version: string): Promise<DenoDocResult> {
  const isDev = import.meta.dev

  if (isDev) {
    // In development, prefer local deno if available
    const hasLocalDeno = await isDenoInstalled()
    if (hasLocalDeno) {
      const url = buildEsmShUrl(packageName, version)
      return runLocalDenoDoc(url)
    }
    // Fall back to remote if deno not installed locally
    // eslint-disable-next-line no-console
    console.warn('Deno not installed locally, falling back to remote docs API')
  }

  // Production or dev fallback: use remote microservice
  return runRemoteDenoDoc(packageName, version)
}

// =============================================================================
// Internal Functions
// =============================================================================

/** Cached promise for deno availability check - computed once on first access */
let denoCheckPromise: Promise<boolean> | null = null

/**
 * Check if deno is installed (cached after first check).
 */
async function isDenoInstalled(): Promise<boolean> {
  if (!denoCheckPromise) {
    denoCheckPromise = execFileAsync('deno', ['--version'], { timeout: 5000 })
      .then(() => true)
      .catch(() => false)
  }
  return denoCheckPromise
}

/**
 * Build esm.sh URL for a package that deno doc can process.
 */
function buildEsmShUrl(packageName: string, version: string): string {
  return `https://esm.sh/${packageName}@${version}?target=deno`
}

/**
 * Call the remote docs-api microservice to generate documentation.
 */
async function runRemoteDenoDoc(packageName: string, version: string): Promise<DenoDocResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add authorization header if secret is configured
  if (DOCS_API_SECRET) {
    headers['Authorization'] = `Bearer ${DOCS_API_SECRET}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REMOTE_API_TIMEOUT_MS)

  try {
    const response = await fetch(DOCS_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ package: packageName, version }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      const errorMessage = (errorBody as { message?: string }).message || response.statusText

      if (response.status === 404) {
        // Package types not found - return empty result
        return { version: 1, nodes: [] }
      }

      throw new Error(`Docs API error (${response.status}): ${errorMessage}`)
    }

    const data = (await response.json()) as { nodes: DenoDocNode[] }
    return { version: 1, nodes: data.nodes }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          `Docs API timed out after ${REMOTE_API_TIMEOUT_MS / 1000}s - package may be too large`,
          { cause: error },
        )
      }
      throw new Error(`Docs API request failed: ${error.message}`, { cause: error })
    }
    throw new Error('Docs API request failed with unknown error', { cause: error })
  }
}

/**
 * Run local deno doc subprocess and parse the JSON output.
 * Used in development when deno is installed locally.
 */
async function runLocalDenoDoc(specifier: string): Promise<DenoDocResult> {
  try {
    const { stdout } = await execFileAsync('deno', ['doc', '--json', specifier], {
      maxBuffer: DENO_DOC_MAX_BUFFER,
      timeout: DENO_DOC_TIMEOUT_MS,
    })

    return JSON.parse(stdout) as DenoDocResult
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT') || error.message.includes('timed out')) {
        throw new Error(
          `Deno doc timed out after ${DENO_DOC_TIMEOUT_MS / 1000}s - package may be too large`,
          { cause: error },
        )
      }
      throw new Error(`Deno doc failed: ${error.message}`, { cause: error })
    }
    throw new Error('Deno doc failed with unknown error', { cause: error })
  }
}
