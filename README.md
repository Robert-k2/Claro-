# Claro Visa Portal

For Latin American students applying for a Czech study visa, Claro Visa Portal is a mobile app that lets them book
consultations with a visa consultant and see exactly which documents are missing, approved or need correction, and by when.

```
mobile/  React Native (Expo) app
server/  Node + Express + Mongoose REST API
MongoDB  stores cases, documents and consultation slots
```
A React Native app cannot talk to MongoDB directly, so the app calls the API and the API talks to MongoDB.

## 1. Database
Either run MongoDB locally with Docker (from this folder):
```
docker compose up -d
```
or create a free MongoDB Atlas cluster and use its connection string.

## 2. API
```
cd server
cp .env.example .env        # set MONGODB_URI if you use Atlas
npm install
npm start                   # http://localhost:4000, seeds the database on first run
npm run seed                # optional: wipe and reseed the demo data
```

## 3. Mobile app
```
cd mobile
npm install
npx expo install --fix
cp .env.example .env        # on a physical phone set EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:4000
npx expo start
```
Android emulator reaches the API at 10.0.2.2 automatically; iOS simulator and web use localhost.

## Dictionary
- Case status: Preparation -> Submitted -> Approved / Rejected
- Document status: Missing / Submitted / Needs correction / Approved

## Rules enforced by MongoDB queries (server/src/index.js)
- Booking is atomic: a slot can only be booked if `by` is still null, so two clients can never get the same slot.
- A unique index on consultant + date + time prevents duplicate slots.
- Only Missing / Needs correction documents can be uploaded; only Submitted documents can be reviewed.
- Sending a document back requires a correction note.
- Booked slots cannot be deleted.

## Not included (next steps)
- Login: the role switcher at the top of the app is a demo. Add real authentication (e.g. JWT) before real clients use it.
- File storage: uploads currently store only the file name. Add S3 / Cloudinary / GridFS to keep the actual file.
