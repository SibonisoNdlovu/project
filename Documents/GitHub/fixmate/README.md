# FixMate — Expo + Supabase starter

A simple Cape Town-first local-services marketplace starter built with Expo, React Native, TypeScript and Supabase. The codebase is structured so the service-area model can expand across South Africa.

## Included in this ZIP

- Expo React Native app with TypeScript
- FixMate dark/light theme and reusable UI components
- Email/password sign-up and sign-in
- Customer job requests
- Public provider directory (individuals and businesses)
- Provider onboarding/profile editing
- Open job feed for onboarded providers
- Provider quotations (one quote per provider per job)
- Customer quote acceptance through an atomic PostgreSQL RPC
- Booking list and basic booking status progression
- Supabase schema, starter categories, and RLS policies
- Starter tables for conversations/messages, reviews, reports and job photos

## Requirements

- Node.js LTS (Node 20 or 22 recommended)
- npm
- Expo Go for a quick device preview, or Xcode/Android Studio for native builds
- A Supabase project

## 1. Install

```bash
npm install
```

## 2. Configure Supabase

1. Create a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Paste and run the complete `supabase/schema.sql` file.
4. In **Project Settings → API**, copy the Project URL and anon/publishable key.
5. Copy `.env.example` to `.env` and fill in the values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

6. Restart Expo after changing environment variables:

```bash
npx expo start -c
```

Do not put a Supabase `service_role` key in the app. The app must only use the anon/publishable key; database access is controlled by RLS.

## 3. Run

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for an available simulator/emulator. Web preview can be attempted with `npx expo start --web`; native device testing is the primary target.

## 4. First-use flow

1. Create an account using email and password. If email confirmation is enabled, confirm the email before signing in.
2. Open **Profile** and choose the account mode: Customer, Provider, or Both.
3. To publish a provider profile, complete **Become a provider** and save it. Provider type can be Individual or Business.
4. Customers can post a job under **Jobs**.
5. Providers can see open requests under **Jobs** and submit a quotation.
6. Customers can review quotations in Supabase for now; the customer-facing quote comparison/acceptance screen is a next implementation step. The atomic `accept_quotation` RPC is included and ready to call from a customer quote screen.
7. Accepted quotes create bookings; parties can move a booking through confirmed → in progress → completed.

## Project layout

```text
App.tsx
src/
  components/ui.tsx
  lib/supabase.ts
  screens/AuthScreen.tsx
  screens/MarketplaceScreens.tsx
  services/marketplace.ts
  theme.ts
  types.ts
supabase/schema.sql
```

## Important MVP boundaries

This is a runnable foundation, not a production marketplace release. In particular:

- Quote comparison is currently a simple list, not a detailed side-by-side comparison. Customers can accept a quote in the app.
- In-app conversation/message tables and RLS are included, but a chat UI and realtime subscriptions are not yet implemented.
- Job photo storage, push notifications, provider service-category selection, map/distance search, verification workflow, review UI, dispute handling, and admin dashboard are not yet implemented.
- Provider discovery currently lists all provider profiles; suburb/category filters are a follow-up.
- Provider verification is an admin-controlled field and must not be represented as a guarantee of service quality.
- No payments are processed. Customer and provider should agree payment arrangements directly.
- This starter has not been security-audited or tested against a live Supabase project. Test all RLS policies with separate customer/provider accounts before launch.

## Before a public launch

- Add automated tests and test on physical iOS and Android devices.
- Add customer quote comparison/acceptance screens and chat.
- Add a provider category join flow and searchable service areas.
- Configure Storage buckets and strict storage policies for job photos.
- Add notification delivery via Edge Functions and Expo Push.
- Add admin tooling, moderation, verification, reporting and audit controls.
- Review privacy policy, terms, POPIA obligations, app-store declarations, and support contact details.
- Perform a dedicated RLS/security review; never rely on hidden UI controls for authorization.

## Notes

The initial location field is free text so the Cape Town pilot can start without a paid maps integration. Store suburb/city/province/country as structured location data before implementing nationwide distance-based search.
