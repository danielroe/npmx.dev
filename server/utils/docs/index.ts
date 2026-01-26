/**
 * API Documentation Generator
 *
 * Generates TypeScript API documentation for npm packages.
 * Uses esm.sh to resolve package types, which handles @types/* packages automatically.
 *
 * In production, uses a Deno microservice to generate docs.
 * In development, falls back to local deno subprocess if available.
 *
 * @module server/utils/docs
 */

import type { DocsGenerationResult } from '#shared/types/deno-doc'
import { getDocNodes } from './client'
import { buildSymbolLookup, flattenNamespaces, mergeOverloads } from './processing'
import { renderDocNodes, renderToc } from './render'

/**
 * Generate API documentation for an npm package.
 *
 * Uses `deno doc --json` with esm.sh URLs to extract TypeScript type information
 * and JSDoc comments, then renders them as HTML.
 *
 * @param packageName - The npm package name (e.g., "react", "@types/lodash")
 * @param version - The package version (e.g., "19.2.3")
 * @returns Generated documentation or null if no types are available
 *
 * @example
 * ```ts
 * const docs = await generateDocsWithDeno('ufo', '1.5.0')
 * if (docs) {
 *   console.log(docs.html)
 * }
 * ```
 */
export async function generateDocsWithDeno(
  packageName: string,
  version: string,
): Promise<DocsGenerationResult | null> {
  // Get doc nodes from remote API (production) or local deno (development)
  const result = await getDocNodes(packageName, version)

  if (!result.nodes || result.nodes.length === 0) {
    return null
  }

  // Process nodes: flatten namespaces, merge overloads, and build lookup
  const flattenedNodes = flattenNamespaces(result.nodes)
  const mergedSymbols = mergeOverloads(flattenedNodes)
  const symbolLookup = buildSymbolLookup(flattenedNodes)

  // Render HTML and TOC from pre-computed merged symbols
  const html = await renderDocNodes(mergedSymbols, symbolLookup)
  const toc = renderToc(mergedSymbols)

  return { html, toc, nodes: flattenedNodes }
}
