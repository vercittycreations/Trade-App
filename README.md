# Multi-Asset Trading & Analytics Simulator

Educational, internship-grade trading simulation platform built with React, Firebase, and Recharts. This project **does not use real market data**—all prices are randomly generated for learning purposes.

## Features
- Firebase Authentication with email/password.
- Firebase Firestore user profiles with simulated balances.
- Multi-asset market snapshot (equities, crypto, FX, commodities).
- Trend visualization with Recharts.
- Portfolio health and strategy prompts.

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure Firebase
Create a Firebase project, enable Email/Password authentication, and create a Firestore database. Then copy your project credentials into a `.env` file:

```bash
cp .env.example .env
```

Update the values in `.env` with your Firebase configuration.

### 3) Run the app
```bash
npm run dev
```

## Firestore Rules
Apply the following rules to keep data scoped to the authenticated user:
```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Project Structure
```
src/
  components/      UI building blocks
  contexts/        Auth context for Firebase
  utils/           Randomized simulator data and Firestore helpers
  styles/          Global CSS
  firebase.js      Firebase SDK setup
```

## Example Firestore Document
```
users/{userId}
{
  userId: "firebase-uid",
  email: "trader@example.com",
  displayName: "Jordan Lee",
  watchlist: ["AAPL", "BTC"],
  portfolioHoldings: [
    { symbol: "AAPL", quantity: 20, entryPrice: 185.12 }
  ],
  appliedIndicators: [
    { name: "RSI", asset: "AAPL" }
  ],
  preferences: {
    theme: "light",
    baseCurrency: "USD"
  },
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
```

## Notes
- This application is **educational only**. No real market APIs or live trading.
- Data is randomly generated every session to encourage practice and exploration.
