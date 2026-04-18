# Esquema de Firestore

Colecciones, relaciones y estructura de datos.

---

## Diagrama de Colecciones

```
┌──────────────────────────────────────────┐
│         FIRESTORE DATABASE               │
├──────────────────────────────────────────┤
│                                          │
│ ┌────────────┐  ┌──────────────┐        │
│ │   users    │  │ territories  │        │
│ ├────────────┤  ├──────────────┤        │
│ │ uid (PK)   │◄─┤ id (PK)      │        │
│ │ email      │  │ name         │        │
│ │ role       │  │ number       │        │
│ │ name       │  │ color        │        │
│ │ createdAt  │  │ coordinates[]│        │
│ └────────────┘  │ createdBy    │        │
│      ▲          │ groupId      │        │
│      │          │ lastModified │        │
│      │          └──────────────┘        │
│      │                │                 │
│      │              (1:many)            │
│      │                ▼                 │
│      │         ┌─────────────────┐     │
│      └────────►│    groups       │     │
│               │                  │     │
│               │ id (PK)          │     │
│               │ leaderId         │     │
│               │ territoryIds[]   │     │
│               └─────────────────┘     │
│                                        │
│     ┌──────────────────────────┐      │
│     │    avoidHouses          │       │
│     │ (casas a evitar)        │       │
│     ├──────────────────────────┤      │
│     │ id (PK)                 │       │
│     │ territoryId (FK)        │       │
│     │ address                 │       │
│     │ coordinates             │       │
│     │ createdBy               │       │
│     └──────────────────────────┘      │
│                                        │
│     ┌──────────────┐                  │
│     │congregations │                  │
│     ├──────────────┤                  │
│     │ id (PK)      │                  │
│     │ name         │                  │
│     │ location     │                  │
│     └──────────────┘                  │
└──────────────────────────────────────────┘
```

---

## Colecciones Definidas

### 📋 `users` — Información de usuarios y autenticación

| Campo | Tipo | Req | Descripción |
|---|---|---|---|
| `uid` | string | ✅ | ID de Firebase Auth (PK) |
| `email` | string | ✅ | Email único del usuario |
| `displayName` | string | ✅ | Nombre completo |
| `photoURL` | string | ❌ | URL de foto de perfil |
| `role` | 'user' \| 'admin' \| 'superadmin' | ✅ | Nivel de acceso |
| `createdAt` | number \| string | ✅ | Timestamp de creación |

**Service:** `userService.ts`

---

### 🗺️ `territories` — Zonas geográficas a visitar

| Campo | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | string | ✅ | Document ID autogenerado (PK) |
| `name` | string | ✅ | Nombre del territorio |
| `number` | number | ✅ | Número de identificación |
| `coordinates` | Array<{lat, lng}> | ✅ | Puntos del polígono (mín 3) |
| `color` | string | ✅ | Color RGBA para mapa |
| `groupId` | string \| null | ❌ | FK a groups (asignación) |
| `createdBy` | string | ✅ | UID del creador |
| `createdAt` | any | ✅ | Timestamp de creación |
| `lastModified` | number | ✅ | Timestamp UNIX última mod |
| `visitStartDate` | string \| null | ❌ | Fecha inicio de visita |
| `visitEndDate` | string \| null | ❌ | Fecha fin de visita |
| `note` | string | ❌ | Notas sobre el territorio |
| `couples` | number | ❌ | Número de parejas |
| `hours` | number | ❌ | Horas de visita |
| `synced` | boolean | ❌ | Si está sincronizado |

**Service:** `territoryService.ts`

---

### 👥 `groups` — Grupos de visitadores

| Campo | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | string | ✅ | Document ID autogenerado (PK) |
| `number` | number | ✅ | Número del grupo |
| `leaderId` | string | ✅ | UID del líder del grupo |
| `territoryIds` | Array<string> | ✅ | FK array a territories |
| `createdAt` | string | ✅ | Timestamp de creación |
| `updatedAt` | string | ✅ | Última actualización |

**Service:** `groupService.ts`

---

### 🏠 `avoidHouses` — Casas con restricciones

| Campo | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | string | ✅ | Document ID autogenerado (PK) |
| `territoryId` | string | ✅ | FK a territories |
| `address` | string | ✅ | Dirección completa |
| `reason` | string | ✅ | Motivo de restricción |
| `coordinates` | {lat, lng} | ✅ | Ubicación GPS exacta |
| `createdBy` | string | ✅ | UID del usuario que la registró |
| `createdAt` | Timestamp | ✅ | Fecha/hora de registro |

**Service:** `houseService.ts`  
**Características:** Sincronización en tiempo real con `onSnapshot` + caché SWR

---

### ⛪ `congregations` — Organizaciones

| Campo | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | string | ✅ | Document ID autogenerado (PK) |
| `name` | string | ✅ | Nombre de la congregación |
| `location` | string | ❌ | Ubicación / dirección |
| `createdAt` | number | ✅ | Timestamp de creación |

**Service:** `congregationService.ts`

---

## Relaciones entre Colecciones

| Relación | De | A | Tipo | Campo | Nota |
|---|---|---|---|---|---|
| Usuario → Territorio | `users` | `territories` | 1:many | `territories.createdBy` | Un usuario crea múltiples |
| Territorio → Grupo | `territories` | `groups` | many:1 | `territories.groupId` | Se asigna a un grupo |
| Grupo → Territorio | `groups` | `territories` | 1:many | `groups.territoryIds` | Gestiona múltiples |
| Grupo → Usuario (líder) | `groups` | `users` | many:1 | `groups.leaderId` | Cada grupo tiene líder |
| Territorio → Casa | `territories` | `avoidHouses` | 1:many | `avoidHouses.territoryId` | Múltiples casas |
| Usuario → Casa (registró) | `users` | `avoidHouses` | 1:many | `avoidHouses.createdBy` | Registra múltiples |

---

## Relación Service → Colección

| Colección | Service Principal | Tipo de Dato | Sincronización |
|---|---|---|---|
| `users` | `userService.ts` | Auth + Firestore | Sesión (AsyncStorage) |
| `territories` | `territoryService.ts` | Firestore | Sincronización local + caché |
| `groups` | `groupService.ts` | Firestore | Sincronización local + caché |
| `avoidHouses` | `houseService.ts` | Firestore | Listeners RT + SWR |
| `congregations` | `congregationService.ts` | Firestore | SWR en memoria |

---

## Índices Recomendados

**Simples (auto-creados):**
- `users`: email, role
- `territories`: name, number, groupId, createdBy
- `groups`: number, leaderId
- `avoidHouses`: territoryId, createdAt
- `congregations`: name

**Compuestos (si hay queries complejas):**
- `territories`: (createdBy, lastModified)
- `groups`: (leaderId, createdAt)
- `avoidHouses`: (territoryId, createdAt)
