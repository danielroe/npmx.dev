import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ALL_ENV_VARS = [
  'CONTEXT',
  'VERCEL_ENV',
  'URL',
  'NUXT_ENV_VERCEL_URL',
  'NUXT_ENV_VERCEL_PROJECT_PRODUCTION_URL',
  'PULL_REQUEST',
  'VERCEL_GIT_PULL_REQUEST_ID',
  'BRANCH',
  'VERCEL_GIT_COMMIT_REF',
]

describe('isCanary', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  beforeEach(() => {
    for (const envVar of ALL_ENV_VARS) {
      vi.stubEnv(envVar, undefined)
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns true when VERCEL_ENV is "canary"', async () => {
    vi.stubEnv('VERCEL_ENV', 'canary')
    const { isCanary } = await import('../../../config/env')

    expect(isCanary).toBe(true)
  })

  it('returns true when VERCEL_ENV is "production" and branch is "main"', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main')
    const { isCanary } = await import('../../../config/env')

    expect(isCanary).toBe(true)
  })

  it.each([
    ['production (non-main branch)', 'production', 'v1.0.0'],
    ['preview', 'preview', undefined],
    ['development', 'development', undefined],
    ['unset', undefined, undefined],
  ])('returns false when VERCEL_ENV is %s', async (_label, value, branch) => {
    if (value !== undefined) vi.stubEnv('VERCEL_ENV', value)
    if (branch !== undefined) vi.stubEnv('VERCEL_GIT_COMMIT_REF', branch)
    const { isCanary } = await import('../../../config/env')

    expect(isCanary).toBe(false)
  })
})

describe('getEnv', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  beforeEach(() => {
    for (const envVar of ALL_ENV_VARS) {
      vi.stubEnv(envVar, undefined)
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns "dev" in development mode', async () => {
    const { getEnv } = await import('../../../config/env')
    const result = await getEnv(true)

    expect(result.env).toBe('dev')
  })

  it('returns "canary" when VERCEL_ENV is "canary"', async () => {
    vi.stubEnv('VERCEL_ENV', 'canary')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main')
    const { getEnv } = await import('../../../config/env')
    const result = await getEnv(false)

    expect(result.env).toBe('canary')
  })

  it('returns "preview" for Vercel preview deploys', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_GIT_PULL_REQUEST_ID', '123')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main')
    const { getEnv } = await import('../../../config/env')
    const result = await getEnv(false)

    expect(result.env).toBe('preview')
  })

  it('returns "preview" for PR deploys from main branch', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_GIT_PULL_REQUEST_ID', '456')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main')
    const { getEnv } = await import('../../../config/env')
    const result = await getEnv(false)

    expect(result.env).toBe('preview')
  })

  it('returns "canary" for Vercel production deploys from main branch', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main')
    const { getEnv } = await import('../../../config/env')
    const result = await getEnv(false)

    expect(result.env).toBe('canary')
  })

  it('returns "release" for Vercel production deploys from non-main branch', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'v1.0.0')
    const { getEnv } = await import('../../../config/env')
    const result = await getEnv(false)

    expect(result.env).toBe('release')
  })

  it('prioritises "canary" over "preview" when VERCEL_ENV is "canary" and PR is open', async () => {
    vi.stubEnv('VERCEL_ENV', 'canary')
    vi.stubEnv('VERCEL_GIT_PULL_REQUEST_ID', '789')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'main')
    const { getEnv } = await import('../../../config/env')
    const result = await getEnv(false)

    expect(result.env).toBe('canary')
  })

  it('prioritises "dev" over "canary" in development mode', async () => {
    vi.stubEnv('VERCEL_ENV', 'canary')
    const { getEnv } = await import('../../../config/env')
    const result = await getEnv(true)

    expect(result.env).toBe('dev')
  })
})

describe('getPreviewUrl', () => {
  beforeEach(() => {
    // Reset consts evaluated at module init time
    vi.resetModules()
  })

  beforeEach(() => {
    for (const envVar of ALL_ENV_VARS) {
      vi.stubEnv(envVar, undefined)
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns `undefined` if no known preview env is detected', async () => {
    const { getPreviewUrl } = await import('../../../config/env')

    expect(getPreviewUrl()).toBeUndefined()
  })

  it.each([
    ['Netlify production', { CONTEXT: 'production', URL: 'https://prod.example.com' }],
    ['Vercel production', { VERCEL_ENV: 'production', NUXT_ENV_VERCEL_URL: 'prod.example.com' }],
    ['Vercel canary', { VERCEL_ENV: 'canary', NUXT_ENV_VERCEL_URL: 'main.example.com' }],
  ])('%s environment returns `undefined`', async (_name, envVars) => {
    for (const [key, value] of Object.entries(envVars)) {
      vi.stubEnv(key, value)
    }
    const { getPreviewUrl } = await import('../../../config/env')

    expect(getPreviewUrl()).toBeUndefined()
  })

  it.each([
    ['Netlify dev', { CONTEXT: 'dev', URL: 'https://dev.example.com' }, 'https://dev.example.com'],
    [
      'Netlify deploy-preview',
      {
        CONTEXT: 'deploy-preview',
        URL: 'https://preview.example.com',
      },
      'https://preview.example.com',
    ],
    [
      'Netlify branch-deploy',
      { CONTEXT: 'branch-deploy', URL: 'https://beta.example.com' },
      'https://beta.example.com',
    ],
    [
      'Netlify preview-server',
      {
        CONTEXT: 'preview-server',
        URL: 'https://my-feat--preview.example.com',
      },
      'https://my-feat--preview.example.com',
    ],
    [
      'Vercel development',
      { VERCEL_ENV: 'development', NUXT_ENV_VERCEL_URL: 'dev.example.com' },
      'https://dev.example.com',
    ],
    [
      'Vercel preview',
      { VERCEL_ENV: 'preview', NUXT_ENV_VERCEL_URL: 'preview.example.com' },
      'https://preview.example.com',
    ],
  ])('%s environment returns preview URL', async (_name, envVars, expectedUrl) => {
    for (const [key, value] of Object.entries(envVars)) {
      vi.stubEnv(key, value)
    }

    const { getPreviewUrl } = await import('../../../config/env')

    expect(getPreviewUrl()).toBe(expectedUrl)
  })
})

describe('getProductionUrl', () => {
  beforeEach(() => {
    // Reset consts evaluated at module init time
    vi.resetModules()
  })

  beforeEach(() => {
    for (const envVar of ALL_ENV_VARS) {
      vi.stubEnv(envVar, undefined)
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns `undefined` if no known production env is detected', async () => {
    const { getProductionUrl } = await import('../../../config/env')

    expect(getProductionUrl()).toBeUndefined()
  })

  it.each([
    ['Netlify dev', { CONTEXT: 'dev', URL: 'https://dev.example.com' }],
    [
      'Netlify deploy-preview',
      {
        CONTEXT: 'deploy-preview',
        URL: 'https://preview.example.com',
      },
    ],
    ['Netlify branch-deploy', { CONTEXT: 'branch-deploy', URL: 'https://beta.example.com' }],
    [
      'Netlify preview-server',
      {
        CONTEXT: 'preview-server',
        URL: 'https://my-feat--preview.example.com',
      },
    ],
    [
      'Vercel development',
      {
        VERCEL_ENV: 'development',
        NUXT_ENV_VERCEL_PROJECT_PRODUCTION_URL: 'dev.example.com',
      },
    ],
    [
      'Vercel preview',
      {
        VERCEL_ENV: 'preview',
        NUXT_ENV_VERCEL_PROJECT_PRODUCTION_URL: 'preview.example.com',
      },
    ],
  ])('%s environment returns `undefined`', async (_name, envVars) => {
    for (const [key, value] of Object.entries(envVars)) {
      vi.stubEnv(key, value)
    }
    const { getProductionUrl } = await import('../../../config/env')

    expect(getProductionUrl()).toBeUndefined()
  })

  it.each([
    [
      'Netlify production',
      { CONTEXT: 'production', URL: 'https://prod.example.com' },
      'https://prod.example.com',
    ],
    [
      'Vercel production',
      {
        VERCEL_ENV: 'production',
        NUXT_ENV_VERCEL_PROJECT_PRODUCTION_URL: 'prod.example.com',
      },
      'https://prod.example.com',
    ],
  ])('%s environment returns production URL', async (_name, envVars, expectedUrl) => {
    for (const [key, value] of Object.entries(envVars)) {
      vi.stubEnv(key, value)
    }
    const { getProductionUrl } = await import('../../../config/env')

    expect(getProductionUrl()).toBe(expectedUrl)
  })
})
