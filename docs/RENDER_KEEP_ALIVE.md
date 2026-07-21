# Render Keep-Alive

Backend exposes a lightweight health endpoint:

```text
GET /api/health
```

Use this URL after deploying backend to Render:

```text
https://YOUR_RENDER_BACKEND_URL/api/health
```

Recommended monitor interval:

```text
5 minutes
```

The repository includes `.github/workflows/keep-render-awake.yml`. It runs every
five minutes, offset from round minutes to reduce GitHub Actions congestion, and
calls the lightweight endpoint without `deep=true`.

The storefront also sends a lightweight ten-minute ping while at least one
visible browser tab is open. Browser pings are only a fallback because browsers
suspend timers and stop them when tabs are closed.

Suggested free monitors:

- UptimeRobot
- cron-job.org
- Better Stack Uptime

Notes:

- The endpoint does not query the database.
- The server starts listening before database initialization, so this endpoint can still return `200` while the database is reconnecting.
- In production it returns only service status and timestamp.
- Do not ping heavy endpoints such as products, orders, AI, or checkout.
- If the website becomes production-critical, a paid Render instance is still the most reliable option.
- GitHub scheduled workflows are best-effort and may still be delayed or dropped.
  For a strict 5-minute interval, configure UptimeRobot or cron-job.org to call
  `https://dpwood.onrender.com/api/health` and require HTTP `200`.
