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

  const { session } = await atclient.callback(new URLSearchParams(query as Record<string, string>))
  const agent = new Agent(session)
  event.context.agent = agent
  console.log(agent.did)
  return sendRedirect(event, '/')
})

export class StateStore implements NodeSavedStateStore {
  private readonly stateKey = 'oauth:bluesky:stat'

  constructor(private event: H3Event) {}

  async get(): Promise<NodeSavedState | undefined> {
    const result = getCookie(this.event, this.stateKey)
    if (!result) return
    return JSON.parse(atob(result))
  }

  async set(key: string, val: NodeSavedState) {
    setCookie(this.event, this.stateKey, btoa(JSON.stringify(val)))
  }

  async del() {
    deleteCookie(this.event, this.stateKey)
  }
}

export class SessionStore implements NodeSavedSessionStore {
  private readonly sessionKey = 'oauth:bluesky:session'

  constructor(private event: H3Event) {}

  async get(): Promise<NodeSavedSession | undefined> {
    const result = getCookie(this.event, this.sessionKey)
    if (!result) return
    return JSON.parse(atob(result))
  }

  async set(key: string, val: NodeSavedSession) {
    setCookie(this.event, this.sessionKey, btoa(JSON.stringify(val)))
  }

  async del() {
    deleteCookie(this.event, this.sessionKey)
  }
}
