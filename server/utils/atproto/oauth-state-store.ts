import type { NodeSavedState, NodeSavedStateStore } from '@atproto/oauth-client-node'
import type { UserServerSession } from '#shared/types/userSession'
import type { SessionManager } from 'h3'

export class OAuthStateStore implements NodeSavedStateStore {
  private readonly session: SessionManager<UserServerSession>

  constructor(session: SessionManager<UserServerSession>) {
    this.session = session
  }

  async get(): Promise<NodeSavedState | undefined> {
    const sessionData = this.session.data
    if (!sessionData) return undefined
    return sessionData.oauthState
  }

  async set(_key: string, val: NodeSavedState) {
    // We are ignoring the key since the mapping is already done in the session
    this.session.data.oauthState = val
    await this.session.update(this.session.data)
  }

  async del() {
    this.session.data.oauthState = undefined
    await this.session.update(this.session.data)
  }
}
