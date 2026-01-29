import type { H3Event } from 'h3'
import { Agent } from '@atproto/api'
import { NodeOAuthClient } from '@atproto/oauth-client-node'
import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from '@atproto/oauth-client-node'
import { scope, getOauthClientMetadata } from '~~/server/utils/atproto'
import { createError, getQuery, sendRedirect, getCookie, setCookie, deleteCookie } from 'h3'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const clientMetadata = getOauthClientMetadata()
  const stateStore = new StateStore(event)
  const sessionStore = new SessionStore(event)
  const atclient = new NodeOAuthClient({
    stateStore,
    sessionStore,
    clientMetadata,
  })

  if (!query.code) {
    const handle = query.handle?.toString()

    if (!handle) {
      throw createError({
        status: 400,
        message: 'Handle not provided in query',
      })
    }

    const redirectUrl = await atclient.authorize(handle, { scope })
    return sendRedirect(event, redirectUrl.toString())
  }

  const { session: authSession } = await atclient.callback(
    new URLSearchParams(query as Record<string, string>),
  )
  const agent = new Agent(authSession)
  event.context.agent = agent

  //TODO prob do server side kv store here too?
  const session = await useSession(event, {
    password: process.env.NUXT_SESSION_PASSWORD as string,
  })

  const response = await fetch(
    `https://slingshot.microcosm.blue/xrpc/com.bad-example.identity.resolveMiniDoc?identifier=${agent.did}`,
    { headers: { 'User-Agent': 'npmx' } },
  )
  const miniDoc = (await response.json()) as { did: string; handle: string; pds: string }

  await session.update({
    miniDoc,
  })

  // await sessionStore.del()

  return sendRedirect(event, '/')
})

/**
 * Storage key prefix for oauth state storage.
 */
export const OAUTH_STATE_CACHE_STORAGE_BASE = 'oauth-atproto-state'

export class StateStore implements NodeSavedStateStore {
  private readonly cookieKey = 'oauth:atproto:state'
  private readonly storage = useStorage(OAUTH_STATE_CACHE_STORAGE_BASE)

  constructor(private event: H3Event) {}

  async get(): Promise<NodeSavedState | undefined> {
    const stateKey = getCookie(this.event, this.cookieKey)
    if (!stateKey) return
    const result = await this.storage.getItem<NodeSavedState>(stateKey)
    if (!result) return
    return result
  }

  async set(key: string, val: NodeSavedState) {
    setCookie(this.event, this.cookieKey, key)
    await this.storage.setItem<NodeSavedState>(key, val)
  }

  async del() {
    let stateKey = getCookie(this.event, this.cookieKey)
    deleteCookie(this.event, this.cookieKey)
    if (stateKey) {
      await this.storage.del(stateKey)
    }
  }
}

/**
 * Storage key prefix for oauth session storage.
 */
export const OAUTH_SESSION_CACHE_STORAGE_BASE = 'oauth-atproto-session'

export class SessionStore implements NodeSavedSessionStore {
  //TODO not sure if we will support multi accounts, but if we do in the future will need to change this around
  private readonly cookieKey = 'oauth:atproto:session'
  private readonly storage = useStorage(OAUTH_SESSION_CACHE_STORAGE_BASE)

  constructor(private event: H3Event) {}

  async get(): Promise<NodeSavedSession | undefined> {
    const sessionKey = getCookie(this.event, this.cookieKey)
    if (!sessionKey) return
    let result = await this.storage.getItem<NodeSavedSession>(sessionKey)
    if (!result) return
    return result
  }

  async set(key: string, val: NodeSavedSession) {
    setCookie(this.event, this.cookieKey, key)
    await this.storage.setItem<NodeSavedSession>(key, val)
  }

  async del() {
    let sessionKey = getCookie(this.event, this.cookieKey)
    if (sessionKey) {
      await this.storage.del(sessionKey)
    }
    deleteCookie(this.event, this.cookieKey)
  }
}
