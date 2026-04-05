# Coffee Grounds - PRD

## Original Problem Statement
Build a website to document great coffee shops around the UK named "Coffee Grounds". Features include user/admin ratings, JWT admin login, Emergent Google Auth for users, object storage for image uploads, landing page with "Spotlight" featured shop card (5-image collage), detailed shop pages with Spotify playlist embeds, UK Map view, CUKP section, Contact Us form, multiple admin management, and a "Labs" section for articles/interviews about coffee-making. Role-based access control with 4 roles: Guest, Registered User, Contributor, Admin.

## Tech Stack
- **Frontend:** React 19 + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend:** FastAPI (Python) + Motor (async MongoDB)
- **Database:** MongoDB
- **Auth:** JWT (admin + user email/password) + Emergent Google Auth (users)
- **Storage:** Emergent Object Storage
- **Rich Text:** react-quill-new (Quill 2.x)

## Design Language
- **Colors:** Terracotta primary (#C84B31/#B55B49), Bone White bg (#FDFBF7/#F5F5F0), dark brown text (#2C1A12)
- **Fonts:** Cormorant Garamond (headings), Manrope (body)
- **Style:** Warm, cozy, minimalist illustration aesthetic

## Roles & Permissions
| | Guest | User | Contributor | Admin |
|---|---|---|---|---|
| Browse shops/articles | Yes | Yes | Yes | Yes |
| Rate & comment on cafes | No | Yes | Yes | Yes |
| Create/edit/delete shops | No | No | Yes (own) | Yes (all) |
| Upload/edit/delete/highlight shop images | No | No | Yes (own) | Yes (all) |
| View/edit Lab articles & images | No | No | No | Yes |
| Add Contributors (promote users) | No | No | No | Yes |
| View registered user contact info | No | No | No | Yes |
| Add/delete Admins | No | No | No | Yes |

## What's Been Implemented

### Core Features (Complete)
1. **Authentication** - JWT admin login + user email/password registration & login + Emergent Google Auth
2. **RBAC** - 4 roles (guest, user, contributor, admin) with backend enforcement and frontend role-filtered UI
3. **Auth Page** - Unified login/register page with Google Auth, email/password, password guideline
4. **Home Page** - Spotlight featured shop card with 5-image collage, 4000ms hover-zoom, "more" strip
5. **Shop Detail** - Enlarged hero images, Spotify playlist embeds, user ratings (all authenticated users)
6. **Map View** - Leaflet-based UK map of all listings
7. **CUKP Page** - Founders' quest story page
8. **Contact Page** - Contact form with admin message management
9. **Admin Dashboard** - Role-filtered tabs: Shops (contributors see own only), Articles, Users (admin: role management), Admins, Messages
10. **Object Storage** - Image uploads for shops and article covers
11. **Labs Section** - Article listing with category filters, search, detail with rich HTML, admin CRUD with rich text editor
12. **Navbar** - Coffee grinder logo, center-aligned navigation (Home, Cafe, Labs, CUKP, Contact Us)

### Key Endpoints
- `POST /api/auth/register` - User registration (email/password)
- `POST /api/auth/login` - User login (any role)
- `POST /api/auth/admin/login` - Admin JWT login
- `POST /api/auth/session` - Google Auth session
- `GET /api/auth/me` - Current user info
- `GET /api/auth/users` - List all users (admin only)
- `PUT /api/auth/users/{user_id}/role` - Change user role (admin only)
- `GET/POST /api/shops` - Shop CRUD (contributor+ for write)
- `PUT/DELETE /api/shops/{id}` - Shop update/delete (own for contributors, all for admin)
- `GET/POST /api/articles` - Article CRUD (admin only for write)
- `PUT/DELETE /api/articles/{id}` - Article update/delete (admin)
- `POST /api/contact` - Contact form submission

## Backlog (P2)
- Link footer social icons to actual social media pages
- Upload real coffee shop photos via admin dashboard
