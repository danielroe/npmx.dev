import type { OAuthClientMetadataInput } from '@atproto/oauth-client-node'
import type { EventHandlerRequest, H3Event } from 'h3'
import type { OAuthSession } from '@atproto/oauth-client-node'
import { NodeOAuthClient } from '@atproto/oauth-client-node'
import { SessionStore, StateStore } from '#server/api/auth/atproto.get'

// TODO: limit scope as features gets added. atproto just allows login so no scary login screen till we have scopes
export const scope = 'atproto'

export function getOauthClientMetadata() {
  const dev = import.meta.dev

  // on dev, match in nuxt.config.ts devServer: { host: "127.0.0.1" }
  const client_uri = dev ? `http://127.0.0.1:3000` : 'https://npmx.dev'
  const redirect_uri = `${client_uri}/api/auth/atproto`

  const client_id = dev
    ? `http://localhost?redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}`
    : `${client_uri}/oauth-client-metadata.json`

  return {
    client_name: 'npmx.dev',
    client_id,
    client_uri,
    scope,
    redirect_uris: [redirect_uri] as [string, ...string[]],
    grant_types: ['authorization_code', 'refresh_token'],
    application_type: 'web',
    token_endpoint_auth_method: 'none',
    dpop_bound_access_tokens: true,
  } as OAuthClientMetadataInput
}

type EventHandlerWithOAuthSession<T extends EventHandlerRequest, D> = (
  event: H3Event<T>,
  session: OAuthSession | undefined,
) => Promise<D>

async function getOAuthSession(event: H3Event): Promise<OAuthSession | undefined> {
  const clientMetadata = getOauthClientMetadata()
  const stateStore = new StateStore(event)
  const sessionStore = new SessionStore(event)

  const client = new NodeOAuthClient({
    stateStore,
    sessionStore,
    clientMetadata,
  })

  const currentSession = await sessionStore.get()
  if (!currentSession) return undefined

  // restore using the subject
  return await client.restore(currentSession.tokenSet.sub)
}

export function eventHandlerWithOAuthSession<T extends EventHandlerRequest, D>(
  handler: EventHandlerWithOAuthSession<T, D>,
) {
  return defineEventHandler(async event => {
    const oAuthSession = await getOAuthSession(event)
    return await handler(event, oAuthSession)
  })
}
