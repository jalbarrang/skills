# download.mjs

Download a Discord CDN attachment URL to a temp directory and print the local path.

```
node scripts/download.mjs <attachment-url>
```

- `<attachment-url>` — the CDN URL shown after 📎 in `read.mjs` output (typically `https://cdn.discordapp.com/attachments/...`).
- Saves under the OS temp dir (`discord-skill-files/`). Filename is derived from the URL path (query params stripped).
- For images (png/jpg/jpeg/gif/webp/svg), prints a hint to `read <localPath>` for vision.
- Attachment CDN URLs are fetched without the bot Authorization header. Bounded 429 retries still apply.
