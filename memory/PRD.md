# Coffee Grounds - PRD

## Problem Statement
Build a website called "Coffee Grounds" to document great coffee shops around the UK with listings, ratings, detailed descriptions, image galleries, Spotify playlists, admin management, CUKP founders' story section, and a UK map view.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Framer Motion + React Leaflet
- **Backend**: FastAPI + MongoDB + Motor (async)
- **Auth**: JWT for admin (login: test123, pass: 12345), Emergent Google Auth for users
- **Storage**: Emergent Object Storage for image uploads
- **Map**: Leaflet/OpenStreetMap for UK map view
- **Music**: Spotify embed playlists per coffee shop

## User Personas
1. **Visitor** (non-logged in): Browse listings, view shop details, listen to playlists, explore map, read CUKP story
2. **Registered User** (Google Auth): All visitor features + rate/review coffee shops
3. **Admin** (JWT auth): Full CRUD on listings, image upload/delete, manage playlists, set admin ratings

## Core Requirements
- Website called "Coffee Grounds" with warm earthy theme
- Landing page with hero + listings sorted by rating + CUKP teaser
- Image collage on listing cards (Tetris grid layout)
- Detailed shop page with hero image, description, Spotify playlist player, reviews
- CUKP section: dedicated page + homepage teaser about founders' quest
- UK map with coffee shop markers (Leaflet)
- Search/filter/sort functionality
- Admin dashboard for CRUD + image upload + playlist management
- Both admin and user ratings system
- Google OAuth for user login, JWT for admin

## What's Been Implemented (April 2026)
- Full backend with all CRUD endpoints, dual auth, ratings, image upload, playlist support
- 6 seeded sample coffee shops across UK cities with Spotify playlists
- "Coffee Grounds" branding throughout
- CUKP page with founders' story (Eleanor Whitfield & James Hartley), stats, quote, founder bios
- CUKP teaser section on homepage
- Spotify embed player on each shop detail page ("The Sound of {shop name}")
- Admin playlist URL field for managing playlists per shop
- Home page with hero, listings, search, sort
- UK map with interactive markers
- Admin dashboard with full CRUD + image upload + playlist badges
- Admin credentials: test123 / 12345

## Prioritized Backlog
- **P1**: Map clustering for dense areas, image reordering, user favorites
- **P2**: Social sharing, email notifications, advanced filtering by city/tags, blog/editorial section
