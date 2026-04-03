# UniUnion React Frontend

This is the React frontend for UniUnion, a student utility app for VIT Chennai.

## Features

- Authentication with Firebase (Email/Password and Google Sign-In)
- Lending system for borrowing/lending items
- Room locator (RoomRadar)
- Lost and found (ReFind)
- User profiles

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   Or use npx:
   ```bash
   npx vite
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

4. For production build:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # Shared components
├── context/            # React contexts (Auth)
├── features/           # Feature-specific components
│   ├── auth/          # Authentication
│   ├── lending/       # Lending system
│   ├── locator/       # Room locator
│   ├── refind/        # Lost and found
│   └── profile/       # User profiles
├── firebase.ts         # Firebase configuration
└── App.tsx            # Main app component
```

## Backend

The backend uses Firebase (Firestore, Auth, Storage). The Flutter app's Firebase configuration has been reused here.

## Migration from Flutter

This React app replaces the Flutter frontend while keeping the same Firebase backend.