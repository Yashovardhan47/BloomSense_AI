# Deployment guide

## Demo deployment

The hosted inspection build is intentionally self-contained. Keep `VITE_DEMO_MODE=true`; authentication becomes an explicit demo session, the browser runs its 67-class visual ranker, and garden changes last for the browser session.

```bash
cp .env.example .env
docker compose up --build -d
```

Open `http://localhost:8080`. The health endpoints are `/healthz` and `/api/v1/ready`.

## Connected deployment

Set these values before changing `VITE_DEMO_MODE=false`:

- `JWT_SECRET`: at least 32 random characters; use a managed secret.
- `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`: the same Google Web OAuth client ID. Add the deployed HTTPS origin to its authorised JavaScript origins.
- `PLANTNET_API_KEY`: server-side key for live plant recognition.
- `CORS_ORIGINS`: exact HTTPS frontend origins, comma separated.
- `TRANSLATE_API_URL` and optionally `TRANSLATE_API_KEY`: a LibreTranslate-compatible service.

Use TLS at the load balancer or reverse proxy. Persist the `bloomsense-data` volume and back it up. This SQLite deployment is designed for one API replica; move the store to PostgreSQL before horizontal scaling.

## Provider verification checklist

1. Register with email, log out, log in, refresh a session, and confirm that reusing the old refresh token returns `401`.
2. Use Google sign-in from an authorised origin; confirm the API readiness endpoint reports `google_oauth: configured`.
3. Upload at least five known flowers and review PlantNet alternatives. Do not promote a result as definitive merely because it ranks first.
4. Add all six garden views, refresh the page, and verify that the coverage record persists.
5. Confirm translation and browser speech in every language you intend to advertise; available voices depend on the device.
