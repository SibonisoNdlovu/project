# FixMate implementation notes

## Product decisions
- Individual and registered-business providers
- Customers can browse providers and publish jobs
- Multiple providers can quote on one job
- In-app messaging plus WhatsApp/phone planned
- Free launch; subscriptions and lead generation can follow
- Cape Town launch with nationwide-ready service-area model

## Current scope
Implemented in this starter: authentication, theme, provider profiles, job publishing, provider job feed, quote submission, booking list/status progression, Supabase schema/RLS and atomic quote acceptance function.

Not implemented yet: quote inbox/acceptance UI, full chat, attachments, notifications, payment processing, maps, verification workflow, admin dashboard and moderation UI. See README for launch checklist.
