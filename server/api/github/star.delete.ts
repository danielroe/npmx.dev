import { toggleGitHubStar } from '#server/utils/github'

export default defineEventHandler(event => {
  return toggleGitHubStar(event, 'DELETE')
})
