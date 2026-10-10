# Flow State 🌸

A privacy-first period tracking PWA built for students.

## What it does

- Tracks your cycle, phase, and daily symptoms
- Smart calendar with time-blocked study sessions
- AI-powered daily advice via Groq (cycle + exam aware)
- Taylor Swift sleep energy matching
- Overload warnings during PMS/menstruation phase
- Dad joke notifications (2-3x a week)
- Custom calendar categories with color picker
- User-defined important dates (exams, deadlines)
- Daily sync to Supabase (optional)
- Installable as a PWA

## Tech stack

- Vanilla HTML, CSS, JavaScript
- Vercel (hosting + serverless functions)
- Groq API (Llama 3 for AI advice)
- Progressive Web App (offline support via service worker)

## Setup

1. Clone the repo
2. Deploy to Vercel
3. Add `GROQ_API_KEY` as a Vercel environment variable
4. Done — no build step, no dependencies

## Personalizing

- Add your own calendar categories in Settings
- Set important dates (exams, deadlines) in Settings
- Notifications are configurable per user

## Privacy

All personal data (logs, cycle info, calendar events) stays in the browser's localStorage.
No accounts, no tracking, no data sent anywhere except the AI advice call.

## License

MIT