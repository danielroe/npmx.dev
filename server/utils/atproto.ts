import type { OAuthClientMetadataInput } from '@atproto/oauth-client-node'

// TODO: limit scope as features gets added
export const scope = 'atproto transition:generic'

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
