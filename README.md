<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9c80b1c9-e52c-4a5f-be7e-9d0853a41a9d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set auth and AI keys in [.env.local](.env.local)
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Google auth, email/password auth, and database access
   - `VITE_GEMINI_API_KEY` for Gemini-powered assistant/chat
   - `VITE_OPENAI_API_KEY` for OpenAI-powered assistant/chat
   - Optional model overrides: `VITE_GEMINI_MODEL`, `VITE_OPENAI_MODEL`
3. Run the app:
   `npm run dev`

## Auth Setup

- Enable `Email` under `Supabase Dashboard -> Authentication -> Providers`.
- Enable `Google` under the same providers page and add your Google OAuth client credentials there.
- Add your local and deployed app URLs to `Supabase Dashboard -> Authentication -> URL Configuration`.
- Make sure the redirect URL includes your app origin, for example `http://localhost:3000/`.

Without Supabase config, the app still supports a local email/password fallback for development, but Google sign-in will stay unavailable.
