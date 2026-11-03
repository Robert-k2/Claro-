# Claro Visa Portal — mobile (React Native / Expo)

**Quick start (no server needed):** `npm install && npx expo install --fix && npx expo start`. With no `EXPO_PUBLIC_API_URL` the app runs in Demo mode (in-memory data, resets on reload). Set it in `.env` to use the real API + MongoDB (see ../README.md).


For Latin American students applying for a Czech study visa, Claro Visa Portal is a mobile app that lets them book
consultations with a visa consultant and see exactly which documents are missing, approved or need correction, and by when.

## Run
```
npm install
npx expo install --fix     # aligns package versions with your Expo SDK
npx expo start             # scan the QR code with Expo Go, or press a / i / w
```

## Dictionary
- Case status: Preparation -> Submitted -> Approved / Rejected
- Document status: Missing / Submitted / Needs correction / Approved

## Roles (switch at the top of the app)
- Camila Reyes (client): case + next step, upload documents, book / cancel 30-min consultations
- Tereza Kralova (Tue) and Martin Novak (Fri 9-13), consultants: create slots, approve documents or request correction
- Lucie Horakova (admin): see all cases, set case status

## Files
- App.js          state, actions, navigation shell
- src/data.js     seed data, dictionary, date helpers
- src/ui.js       theme (light/dark) and shared components
- src/screens.js  all screens

Data is in memory only (resets on reload). Next step: persist with AsyncStorage or a backend.
