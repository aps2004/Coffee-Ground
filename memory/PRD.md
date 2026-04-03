# UK Coffee Shop Directory - PRD

## Problem Statement
Build a website to document great coffee shops around the UK with listings, ratings, detailed descriptions, image galleries, admin management, and a UK map view.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Framer Motion + React Leaflet
- **Backend**: FastAPI + MongoDB + Motor (async)
- **Auth**: JWT for admin, Emergent Google Auth for users
- **Storage**: Emergent Object Storage for image uploads
- **Map**: Leaflet/OpenStreetMap for UK map view

## User Personas
1. **Visitor** (non-logged in): Browse listings, view shop details, explore map
2. **Registered User** (Google Auth): All visitor features + rate/review coffee shops
3. **Admin** (JWT auth): Full CRUD on listings, image upload/delete, set admin ratings

## Core Requirements
- Landing page with hero section + coffee shop listings sorted by rating
- Image collage on listing cards (Tetris grid layout)
- Detailed shop page with enlarged hero image, full description, reviews
- UK map with coffee shop markers (Leaflet)
- Search/filter/sort functionality
- Admin dashboard for CRUD operations
- Both admin and user ratings system
- Google OAuth for user registration/login
- Warm, cozy earthy theme (Cormorant Garamond + Manrope fonts)

## What's Been Implemented (April 2026)
- Full backend with all CRUD endpoints, dual auth system, ratings, image upload
- 6 seeded sample coffee shops across UK cities
- Home page with hero, listings grid, search, sort
- Shop detail page with hero image, description, ratings sidebar, reviews
- UK map view with interactive markers and popups
- Admin login page with JWT auth
- Admin dashboard with add/edit/delete shops + image upload
- Google Auth integration for user login
- Responsive design with glass-morphism navbar
- Object storage integration for image uploads

## Prioritized Backlog
- **P0**: Core features complete
- **P1**: Password reset for admin, image reordering in admin, map clustering for dense areas
- **P2**: Featured/promoted shops, social sharing, email notifications for new shops, advanced filtering (by city, tags), favorites/bookmarks for logged-in users

## Next Tasks
1. Add more coffee shop data with real images
2. Implement user favorites/bookmarks
3. Add city-based filtering on map
4. Add SEO meta tags for shop pages
5. Consider adding a blog/editorial section for coffee guides
