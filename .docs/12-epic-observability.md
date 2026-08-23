# Epic 12 — Observability & Analytics

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 10 (Observability).

This Epic assumes the app is functionally complete — all prior Epics
(01–11) done — since it's most useful once there's real behavior worth
capturing events for. It has no dependency on Epic 13 or 14 and could be
done before either of them.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

The app reports analytics and errors to PostHog from both the API and the
client, giving visibility into real usage and failures without needing to
watch the app live during a party to know something broke.

## Tasks

- Add the PostHog SDK to `apps/api` (server-side event capture and
  exception tracking) and `apps/mobile` (client-side event capture and
  exception tracking). Use PostHog Cloud, free tier — no self-hosting.
- Capture, at minimum: party created, party joined (customer vs. guest),
  order created, order claimed, order reached `ready`, and unhandled
  exceptions on both the client and server.
- Do not build or integrate a separate error-tracking tool (e.g. Sentry) —
  PostHog's free tier covers analytics, error tracking, and log ingestion
  in one place, per Section 10 of the architecture spec.

## Definition of Done
- PostHog receives events from both a live client session and a real API
  request, visible in the PostHog dashboard.
- An unhandled exception on both the client and server is confirmed to
  appear in PostHog's error tracking.
