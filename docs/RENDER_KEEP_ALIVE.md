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

Suggested free monitors:

- UptimeRobot
- cron-job.org
- Better Stack Uptime

Notes:

- The endpoint does not query the database.
- It returns only service status, uptime, and timestamp.
- Do not ping heavy endpoints such as products, orders, AI, or checkout.
- If the website becomes production-critical, a paid Render instance is still the most reliable option.
