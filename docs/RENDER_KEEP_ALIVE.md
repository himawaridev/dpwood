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
10-12 minutes
```

The repository includes `.github/workflows/keep-render-awake.yml`. It runs at
minutes `3,13,23,33,43,53` to avoid GitHub Actions congestion on round minutes
and calls the lightweight endpoint without `deep=true`.

Suggested free monitors:

- UptimeRobot
- cron-job.org
- Better Stack Uptime

Notes:

- The endpoint does not query the database.
- The server starts listening before database initialization, so this endpoint can still return `200` while the database is reconnecting.
- It returns only service status, uptime, and timestamp.
- Do not ping heavy endpoints such as products, orders, AI, or checkout.
- If the website becomes production-critical, a paid Render instance is still the most reliable option.
- GitHub scheduled workflows are best-effort and may still be delayed or dropped.
  For a strict 10-minute interval, configure UptimeRobot or cron-job.org to call
  `https://dpwood.onrender.com/api/health` and require HTTP `200`.
