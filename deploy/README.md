# Deploying CipherOcto (one VPS, Nginx)

One domain serves everything:

| URL | Goes to |
|---|---|
| `https://cipherocto.com/` and dashboard routes | static React build |
| `https://cipherocto.com/api/v1/...` | API on `127.0.0.1:4000` |
| `https://cipherocto.com/<app>/privacy` | API → privacy policy from MongoDB |

Because the dashboard and API share one origin, the HttpOnly session cookie stays first-party and no CORS setup is needed in production.

## 1. API + MongoDB

```bash
cd cipherocto-api
cp .env.example .env        # set SEED_ADMIN_*, PURCHASE_TOKEN_KEY, WEB_ORIGINS=https://cipherocto.com
docker compose up -d --build
```

`WEB_ORIGINS` must be exactly the dashboard origin (scheme + host, no trailing slash).

## 2. Dashboard

```bash
cd cipherocto-web
npm ci && npm run build
sudo mkdir -p /var/www/cipherocto-web
sudo rsync -a --delete dist/ /var/www/cipherocto-web/
```

## 3. Nginx + TLS

See the install steps at the top of `deploy/nginx/cipherocto.conf`.

## Publishing a privacy policy

1. Dashboard → **Privacy Policies** → pick the app.
2. Choose the `.html` file (or paste it) → **Publish**.
3. Copy the link, e.g. `https://cipherocto.com/raycall/privacy`, into the Play Console.

Pages are read from MongoDB on every request, so publishing or replacing a policy is live immediately. Nothing is restarted and no files are written to disk.

## Notes

- The part of the URL before `/privacy` is the app's **URL name** (slug). It is set when the app is registered (derived from its name) and can be changed on the Privacy Policies page; the old link stops working when it changes.
- Names such as `api`, `login`, `apps`, `billing` are reserved because they collide with dashboard or API paths.
- Uploaded HTML is sanitized on the server (scripts, event handlers, forms, iframes and remote CSS are stripped) and served with a strict `Content-Security-Policy`.
- Existing apps get a slug automatically the first time the new API version starts (migration `0003`).
