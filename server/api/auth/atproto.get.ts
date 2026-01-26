export default defineOAuthBlueskyEventHandler({
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        bluesky: user.did,
      },
      loggedInAt: Date.now(),
    })

    return sendRedirect(event, '/')
  },
})
