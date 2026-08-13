# 13 Aug 2026 (cont.)

## "Could not read that image" on every avatar upload, even valid JPEG/PNG

Report: the resize fix from earlier today (`AvatarUpload.tsx`'s `resizeImage()`) was throwing "Could not read that image -- try a JPEG or PNG" on files that were already the right format. The message is misleading about the actual cause: `resizeImage()` loads the picked file via `URL.createObjectURL(file)` and points an `<img>` at the resulting `blob:` URL so it can be drawn onto a canvas. `next.config.ts`'s CSP `img-src` was `'self' data: https://upload.wikimedia.org https://picsum.photos` -- no `blob:` -- so the browser blocked the load outright and fired `onerror` regardless of whether the file could actually be decoded.

Checked for the same gap on the other side of the flow: the avatar `<img avatarUrl>` in the same component points straight at the Supabase Storage public URL (not proxied through `next/image`), which also wasn't in `img-src`. Fixing only `blob:` would have let the resize succeed and then hit the exact same class of bug rendering the result -- an image that uploads fine and still doesn't show.

Fixed both in one pass, `next.config.ts`:
```
img-src 'self' data: https://upload.wikimedia.org https://picsum.photos
->
img-src 'self' data: blob: https://*.supabase.co https://upload.wikimedia.org https://picsum.photos
```
`blob:` for the client-side resize step, `https://*.supabase.co` (matching the pattern `connect-src` already uses) for avatars and CVs served directly from Storage.

Next.js reads `next.config.ts` at server start, not per-request -- this needs a dev server restart (or a fresh deploy in production) to take effect, unlike the component-level fixes earlier today.

## Files changed
```
M  next.config.ts
```
