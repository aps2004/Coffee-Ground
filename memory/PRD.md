# Coffee Grounds - PRD

## Original Problem Statement
Build a website to document great coffee shops around the UK named "Coffee Grounds". Features include user/admin ratings, JWT admin login, Emergent Google Auth for users, object storage for image uploads, landing page with "Spotlight" featured shop card (5-image collage), detailed shop pages with Spotify playlist embeds, UK Map view, CUKP section, Contact Us form, multiple admin management, and a "Labs" section for articles/interviews about coffee-making.

## Tech Stack
- **Frontend:** React 19 + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend:** FastAPI (Python) + Motor (async MongoDB)
- **Database:** MongoDB
- **Auth:** JWT (admin) + Emergent Google Auth (users)
- **Storage:** Emergent Object Storage
- **Rich Text:** react-quill-new (Quill 2.x)

## Design Language
- **Colors:** Terracotta primary (#C84B31/#B55B49), Bone White bg (#FDFBF7/#F5F5F0), dark brown text (#2C1A12)
- **Fonts:** Cormorant Garamond (headings), Manrope (body)
- **Style:** Warm, cozy, minimalist illustration aesthetic

## What's Been Implemented

### Core Features (Complete)
1. **Authentication** - JWT admin login + Emergent Google Auth for users
2. **Home Page** - Spotlight featured shop card with 5-image collage, 4000ms hover-zoom, "more" strip
3. **Shop Detail** - Enlarged hero images, Spotify playlist embeds, user ratings
4. **Map View** - Leaflet-based UK map of all listings
5. **CUKP Page** - Founders' quest story page
6. **Contact Page** - Contact form with admin message management
7. **Admin Dashboard** - Tabbed UI: Shops, Articles, Admins, Messages
8. **Object Storage** - Image uploads for shops and article covers
9. **Labs Section** - Article listing with category filters, search, article detail with rich HTML rendering, admin CRUD with rich text editor (react-quill)

### Key Endpoints
- `POST /api/auth/admin/login` - Admin JWT login
- `POST /api/auth/session` - Google Auth session
- `GET/POST /api/shops` - Shop CRUD
- `GET/POST /api/articles` - Article CRUD with rich HTML content
- `PUT/DELETE /api/articles/{id}` - Article update/delete
- `POST /api/articles/{id}/cover` - Cover image upload
- `POST /api/contact` - Contact form submission
- `GET/POST /api/auth/admins` - Admin management

## Backlog (P2)
- Link footer social icons to actual social media pages
- Upload real coffee shop photos via admin dashboard
