# Leaf Organic — Product Catalogue (CMS)

Beauty / cosmetics catalogue — **not** a checkout store. Built with **Next.js 16**, **Tailwind 4**, **Prisma (SQLite)**, local file storage, fully free-tier deployable on Vercel Hobby.

Brand colors: `#9CB080` (sage) • `#618764` (leaf) • `#2B5748` (teal) • `#273338` (charcoal). Typography: `Cormorant Garamond` (display) + `Inter` (body).

## Features
- Public: Home (hero/banners), Categories (with optional subcategories), Products (weight/variants/tags/attributes), Product detail (gallery, specs, WhatsApp), Contact (form + map iframe), Blogs (optional toggle), Search/filter/sort/pagination, SEO (metadata, sitemap, robots, JSON-LD), Responsive.
- Admin: Dashboard, Categories (CRUD + Top Rated), Products (multi-image, weight, variants, tags, attributes, preview, Top Rated), Banners, Blogs, Enquiries (NEW/CONTACTED/RESOLVED), Media Library (local `public/uploads/*` with dedup), Settings (header/footer/contact/whatsapp/social/blog toggle).
- Media: `src/lib/media.ts` `MediaStorage` interface (`LocalFsAdapter`) — swap to S3/R2 by changing one file.
- Auth: Simple cookie session (`bcryptjs`), middleware protects `/admin/*`.

## Quick Start
```bash
npm install
cp .env .env.local # already contains DATABASE_URL=file:./dev.db
npx prisma migrate dev --name init
npx tsx prisma/seed.ts # creates admin@leaforganic.com / admin123 + sample data
npm run dev # http://localhost:3000
```

- Public: `http://localhost:3000`
- Admin: `http://localhost:3000/admin` (login: `admin@leaforganic.com` / `admin123`)
- Uploads: `public/uploads/*` (gitignored, ephemeral on Vercel — see note below)

## Deploy to Vercel (Free)
1. Push to GitHub.
2. Import on Vercel (Hobby).
3. Add env: `DATABASE_URL=file:./dev.db` (for demo) or `postgresql://...` (Neon/Supabase free for persistence).
4. Build command: `prisma generate && prisma migrate deploy && next build` (or add `migrate deploy` as Vercel build step).
5. Note: Vercel filesystem is ephemeral — uploads in `public/uploads` are lost on redeploy. For persistence, swap `src/lib/media.ts` to Vercel Blob or R2 (free tier) — single adapter.

## Project Structure
```
prisma/ (schema, migrations, seed)
src/
  app/ (public pages + admin/* + api/* + sitemap/robots)
  components/ (public/*, admin/*, ui/*)
  lib/ (prisma, auth, media, settings, validations, utils, actions)
public/ (logo.jpg, og-image.jpg, uploads/)
middleware.ts (admin guard)
```

## Env
```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
AUTH_SECRET="change-me-32chars"
```

## Next Steps
- Add Postgres (Neon free) for persistent DB.
- Add Vercel Blob for persistent media.
- Add SMTP for enquiry email notifications.
