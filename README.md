# Nexus

Nexus is a production-ready multi-tenant SaaS platform. 

## Technology Stack
- React, Vite, Tailwind CSS, Zustand, React Query
- Node.js, Express, MongoDB

## Setup

1. Copy `server/.env.example` to `server/.env` and update the `MONGO_URI`.
2. Install dependencies:
   - Backend: `cd server && npm install`
   - Frontend: `cd client && npm install`
3. Run seed on backend: `cd server && npm run seed:demo`
4. Run the backend: `cd server && npm run dev`
5. Run the frontend: `cd client && npm run dev`
