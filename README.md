# FutureLuck — Votre chance, notre priorité.

Plateforme web et mobile-first de marchés virtuels à récompenses financières.

## Stack Technique
- **Frontend**: React 19, Vite, Tailwind CSS v4, composants style shadcn/ui, Lucide Icons, Axios, React Router v7
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, Bcryptjs, Helmet, Rate Limiting
- **Médias**: Cloudinary (avec fallback local `/uploads` si les clés Cloudinary ne sont pas encore configurées)

## Démarrage rapide

### 1. Configurer l'environnement Backend
Vérifiez `backend/.env` :
- `MONGODB_URI` (ex: `mongodb://127.0.0.1:27017/futureluck`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (optionnel en dev)

### 2. Initialiser les données de démonstration
```bash
cd backend
npm run seed
```
Compte créé par défaut :
- **Admin** : `admin@futureluck.com` / `Admin@2026`

### 3. Lancer le Backend et le Frontend
```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```
