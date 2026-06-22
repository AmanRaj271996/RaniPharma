# Medicine Wholesale Store - MediStore

A production-ready enterprise-level medicine wholesale store application built with **ASP.NET Core 8** (Backend) and **Angular 17** (Frontend) with **SQLite** database.

## 🏗️ Architecture

```
MedicineWholesaleApp/
├── backend/                    # .NET 8 Web API
│   └── MedicineStore.API/
│       ├── Controllers/        # API endpoints
│       ├── Models/             # Data models
│       ├── Data/               # Database context
│       ├── Services/           # Business logic
│       └── Dockerfile          # Container config
├── frontend/                   # Angular 17 SPA
│   └── src/
│       ├── app/
│       │   ├── components/     # Shared components
│       │   ├── pages/          # Route pages
│       │   ├── services/       # API services
│       │   ├── guards/         # Auth guards
│       │   └── interceptors/   # HTTP interceptors
│       └── environments/       # Environment configs
└── README.md
```

## 🚀 Features

- **Homepage** - Beautiful animated landing page with hero section
- **Login System** - JWT-based authentication
- **Inventory Management** - Full CRUD for medicines (add, edit, delete, search)
- **About Page** - Owner bio with photo placeholder & company timeline
- **Contact Page** - Location, map, phone, social links
- **WhatsApp Integration** - Floating button with pre-filled message
- **Social Media** - Facebook, Instagram links
- **Responsive Design** - Works on all devices
- **Animations** - Smooth CSS animations throughout
- **Copyright Footer** - Professional footer with all links

## 💰 FREE Hosting Setup

### Option 1: Render.com (Recommended - Completely Free)

#### Backend Deployment:
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set:
   - **Root Directory**: `backend/MedicineStore.API`
   - **Runtime**: Docker
   - **Instance Type**: Free
5. Add environment variable:
   - `ASPNETCORE_ENVIRONMENT` = `Production`
6. Deploy!

#### Frontend Deployment (Netlify - Free):
1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repo
3. Set:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build:prod`
   - **Publish directory**: `frontend/dist/medicine-store/browser`
4. Before deploying, update `frontend/src/environments/environment.prod.ts` with your Render backend URL
5. Deploy!

### Option 2: Railway.app (Free Tier)
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repo, set root to `backend/MedicineStore.API`
4. It auto-detects Dockerfile and deploys

### Option 3: Vercel (Frontend Only)
1. Go to [vercel.com](https://vercel.com)
2. Import Git Repository
3. Set framework to Angular, root directory to `frontend`
4. Deploy

## 🛠️ Local Development Setup

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [Angular CLI](https://angular.io/cli): `npm install -g @angular/cli`

### Backend Setup
```bash
cd backend/MedicineStore.API
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```
Backend runs at: `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
ng serve
```
Frontend runs at: `http://localhost:4200`

### Default Login Credentials
- **Username**: `admin`
- **Password**: `Admin@123`

## 🗄️ Database

Uses **SQLite** - a file-based database that requires:
- ✅ No server installation
- ✅ No cloud subscription
- ✅ No monthly costs
- ✅ Zero configuration
- ✅ Deploys with the app automatically

The database file (`medicinestore.db`) is created automatically on first run.

## 📱 Contact & Social

- **WhatsApp**: +91 9777096527 (with pre-text: "Hi how may I help")
- **Location**: Alalpatti, Darbhanga, Bihar
- **Facebook**: (Update URL in footer & contact page)
- **Instagram**: (Update URL in footer & contact page)

## 🔧 Customization

### Update Social Media Links
Edit these files:
- `frontend/src/app/components/footer/footer.component.html`
- `frontend/src/app/pages/contact/contact.component.html`

### Update Owner Photo
Replace the placeholder in:
- `frontend/src/app/pages/about/about.component.html`

Replace the `<div class="image-placeholder">` with:
```html
<img src="assets/images/owner.jpg" alt="Owner Name">
```

### Update Backend URL for Production
Edit: `frontend/src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-RENDER-URL.onrender.com/api'
};
```

## 📋 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/register` | Register | No |
| GET | `/api/medicine` | List medicines | No |
| GET | `/api/medicine/{id}` | Get medicine | No |
| POST | `/api/medicine` | Add medicine | Yes |
| PUT | `/api/medicine/{id}` | Update medicine | Yes |
| DELETE | `/api/medicine/{id}` | Delete medicine | Yes |
| GET | `/api/medicine/stats` | Get stats | Yes |
| GET | `/api/medicine/categories` | Get categories | No |

## 📄 License

© 2024 MediStore - Medicine Wholesale Store. All Rights Reserved.
