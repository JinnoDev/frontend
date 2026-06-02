# SocialConnect — MVP Full Stack

App tipo Instagram con **NestJS (API) + Next.js (Frontend) + MongoDB**.

---

## Estructura

```
socialconnect/
├── api/          ← Tu API NestJS (el zip que ya tenías)
└── frontend/     ← Next.js App (este zip)
```

---

## Setup rápido

### 1. MongoDB
Asegúrate de tener MongoDB corriendo en `localhost:27017` o usa MongoDB Atlas.

### 2. API (NestJS) — Puerto 3000
```bash
# Copia tu carpeta api/ aquí y entra a ella
cd api
npm install
cp .env.example .env
# Edita .env con tu MONGODB_URI y JWT_SECRET
npm run start:dev
```

El archivo `.env` debe tener:
```env
MONGODB_URI=mongodb://localhost:27017/socialconnect
JWT_SECRET=tu_secreto_seguro_aqui
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

### 3. Frontend (Next.js) — Puerto 3001
```bash
cd frontend
npm install
# .env.local ya está configurado para localhost:3000
npm run dev
```

Abre: **http://localhost:3001**

---

## Pantallas implementadas

| Ruta | Pantalla |
|------|----------|
| `/login` | Login con email/password |
| `/register` | Registro de cuenta |
| `/home` | Feed de posts + panel usuarios en línea |
| `/search` | Búsqueda + recientes |
| `/explore` | Grid de exploración |
| `/messages` | Chats + conversación |
| `/notifications` | Notificaciones |
| `/profile` | Perfil propio + grid de posts + editar |
| `/profile/[id]` | Perfil público + seguir |

---

## Notas

- JWT se guarda en cookies (7 días)
- El frontend redirige a `/login` si no hay sesión
- Todas las rutas protegidas usan `JwtAuthGuard`
- Swagger disponible en `http://localhost:3000/docs`
