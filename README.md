# Soul Sync 🌟

**Soul Sync** is an AI-powered dating and connection app that blends cutting-edge technology with ancient wisdom. It uses **AI Vector Embeddings** to match personalities and **Astrology (Western & Eastern Horoscope / Tu Vi)** to calculate deep compatibility.

> [!TIP]
> This project is built with **Expo SDK 55**, **Convex**, and **Clerk**.

## 🛠 Tech Stack

- **Frontend**: React Native (Expo SDK 55), Expo Router, Reanimated 4, Glassmorphism UI.
- **Backend**: Convex (Real-time DB & Cloud Functions).
- **Auth**: Clerk.
- **AI**: Google Gemini (Embeddings & Astrology Logic).
- **Styling**: NativeWind (Tailwind CSS for Native).

---

## 🧬 Core Features

- **AI Matching**: Converts bios and interests into 3072-dimensional vectors to find matches on the same "frequency."
- **Astrology Engine**: Automatically calculates Zodiac placements and Eastern Horoscope (Can Chi, Elemental Fate) based on birth date and time.
- **Daily Picks**: Recommends 3 highlighted profiles daily, complete with AI-generated explanations of why you should match.
- **Real-time Chat**: Low-latency, instant messaging.

---

## 🧪 Database Seeding (For Developers)

To seed 100+ Vietnamese celebrity profiles for testing the Discover (Swipe) feature, run:
```bash
npx convex run seed:seedCelebs
