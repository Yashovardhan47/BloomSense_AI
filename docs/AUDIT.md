# Repository audit — 28 October 2026

## What was wrong

The former `bloomsense-update` root commit contained 597 paths, but nearly every source, test, deployment, database, and documentation file was empty or a one-line placeholder. It could not install, build, test, or deploy. The public version-6 Site and the GitHub branch were different projects.

## Corrected in this revision

- Restored the exact version-6 React interface: separate public landing page, protected post-login home, recognition workspace, personal garden, and history.
- Replaced the forced `Rose` behaviour with two explicit modes: a browser CLIP catalogue for the static demo and PlantNet for connected recognition. Missing provider configuration now fails visibly instead of inventing a species.
- Added password authentication, short-lived JWT access tokens, rotating/revocable refresh tokens, Google ID-token verification, protected per-user records, auth throttling, and strict CORS.
- Added persistent garden dimensions, six-view capture, plants, health-photo events, watering state, tasks, timelines, and coverage analysis.
- Added botanical source links, safety boundaries, related imagery, history, translation-provider support, voice output, Docker images, health checks, CI, and tests.

## Honest limits

- The 67-class browser model is a broad visual ranker, not calibrated species identification. Production recognition requires a valid PlantNet key and still needs user confirmation.
- Health photos are stored as monitoring events; the API deliberately does not invent disease diagnoses. A validated disease model and an agronomist-reviewed evaluation set remain separate work.
- SQLite is suitable for one demo instance. Multi-replica production requires PostgreSQL/object storage and a migration layer.
- Google OAuth, PlantNet, and live translation cannot be end-to-end certified without the deployment's real credentials and authorised domain.
- Speech recognition and speech synthesis depend on browser/device support; this is not universal offline speech infrastructure.

## Highest-value novel additions

1. **Garden digital twin** — camera pose guidance, segmentation, depth/AR measurements, and change detection tied to mapped plant positions.
2. **Evidence-calibrated diagnosis** — separate species, symptom, and causal-diagnosis models; abstention; confidence calibration; expert escalation; treatment audit trail.
3. **Causal care planner** — combine weather, soil sensors, irrigation history, plant stage, and outcomes to estimate what action actually improves health.
4. **Phenology intelligence** — predict bloom, dormancy, pruning, pollination, and harvest windows from longitudinal images and local climate.
5. **Privacy-preserving community atlas** — opt-in anonymous observations, invasive-species alerts, and local biodiversity trends with location fuzzing.
6. **Resilient reminders** — timezone-aware recurring rules, notification preferences, offline queueing, and weather-triggered rescheduling.
