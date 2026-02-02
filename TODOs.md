# TODOs

<!-- TODO: A todo within the TODOs!!! This is a temporary file to track work since there are so many of us mucking about on this! REMOVE BEFORE FINALIZING THE PR!!!! -->
<!-- TODO: hackmd - https://hackmd.io/@e7pGbT7hTrONe4H59uAIPg/ByMdCwoIbg -->

---

## In Flight

- Blog list/post UI - (Started - needs more polish)
- OAuth
- Standard site push - Mock PDS push for now
- constellation - bsky API
- Docs - Run them locally with `pnpm dev:docs`.

---

## On Deck

- How does i18n deal with dynamic values? $t('blog.post.title'),
- i18n - currently incomplete
- automatic pulls or pushes from an action runner
- records walkers
- bsky posts stuff - Bluesky comments
- blog publishing for https://bsky.app/profile/npmx.dev - cli/actions pipeline
- site.standard.publication lexicon - declares it's a blog on atproto can be manual setup
- site.standard.document - publishes everytime there's a new blog entry.
  - Proposed: the pipeline takes login pds, handle, and app_password as secrets. Checks to see if one has already been published for that blog post. If so does not push it. If it hasn't then it creates the atproto record when deploying/building by logging in. check if an article has been created by parsing the createdate of the blog post to a TID, do a getRecord. if it's there dont publish the new one. If it isnt send it up. I wrote about tid concept here
    https://marvins-guide.leaflet.pub/3mckm76mfws2h
  - Proposed: nuxt module with a build hook. e.g. in standard-site-sync.ts we use a hook that triggers after the file is parsed and create the site.standard.document or not if it already exists.
- Update styling for blog posts.
- BlogWrapper Component or should it be a Blog Layout?
- Organize markdown files in blog post folder?
- I18n of blog posts.
- TBD

---

## Landed

- [x] Lexicons
- [x] Prose-styling using unocss typography
- [x] anthony's alternative markdown solution for now and Nuxt content integration for later

---
