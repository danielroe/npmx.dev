import { createError } from 'h3'
import validatePackageName from 'validate-npm-package-name'

const NPM_USERNAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i
const NPM_USERNAME_MAX_LENGTH = 50

/**
 * Validate an npm package name and throw an HTTP error if invalid.
 * Uses validate-npm-package-name to check against npm naming rules.
 */
export function assertValidPackageName(name: string): void {
  const result = validatePackageName(name)
  if (!result.validForNewPackages && !result.validForOldPackages) {
    const errors = [...(result.errors ?? []), ...(result.warnings ?? [])]
    throw createError({
      statusCode: 400,
      message: `Invalid package name: ${errors[0] ?? 'unknown error'}`,
    })
  }
}

/**
 * Validate an npm username and throw an HTTP error if invalid.
 * Uses a regular expression to check against npm naming rules.
 */
export function assertValidUsername(username: string): void {
  if (!username || username.length > NPM_USERNAME_MAX_LENGTH || !NPM_USERNAME_RE.test(username)) {
    throw createError({
      statusCode: 400,
      message: `Invalid username: ${username}`,
    })
  }
}
