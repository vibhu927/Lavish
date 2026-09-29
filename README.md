# Leaf Organic — Product Catalogue (CMS)

Beauty / cosmetics catalogue — **not** a checkout store. Built with **Next.js 16** and **Tailwind 4**, with a JSON-file data layer and local file storage, deployed on a **VPS**.

Brand colors: `#9CB080` (sage) • `#618764` (leaf) • `#2B5748` (teal) • `#273338` (charcoal). Typography: `Cormorant Garamond` (display) + `Inter` (body).

## Features
- Public: Home (hero/banners), Categories (with optional subcategories), Products (weight/variants/tags/attributes), Product detail (gallery, specs, WhatsApp), Contact (form + map iframe), Blogs (optional toggle), Search/filter/sort/pagination, SEO (metadata, sitemap, robots, JSON-LD), Responsive.
- Admin: Dashboard, Categories (CRUD + Top Rated), Products (multi-image, weight, variants, tags, attributes, preview, Top Rated), Banners, Blogs, Enquiries (NEW/CONTACTED/RESOLVED), Media Library (with dedup), Settings (header/footer/contact/whatsapp/social/blog toggle).
- Media: `src/lib/media.ts` `MediaStorage` interface (`LocalFsAdapter`) — swap to S3/R2 by changing one file.
- Auth: signed cookie session (`bcryptjs` + HMAC-SHA256), middleware protects `/admin/*`.

## Why not Vercel?

This app **writes to its own filesystem at runtime**: every content change is a JSON write, and every upload is a file on disk. Vercel's filesystem is read-only and ephemeral, so both the database and all media vanish on redeploy. The app now targets a VPS with a persistent disk.

## Data layer

There is no database server. Each model is one JSON file under `data/`:

| | |
|---|---|
| Location | `data/<model>.json` (override with `DATA_DIR`) |
| Writes | atomic temp-file + `rename`, serialised by an in-process mutex |
| Reads | cached, invalidated by file `mtime` |
| Queries | `src/lib/db/client.ts` implements the Prisma surface the app already used |

Call sites still read `prisma.product.findMany(...)`. That is deliberate: `src/lib/prisma.ts` exports a JSON-backed client with the same API (`findUnique`/`findMany`/`create`/`update`/`upsert`/`delete`/`count`, plus `where`/`include`/`select`/`orderBy`/`take`/`skip`), so the app code and its types are unchanged. Unique-violation and not-found errors are thrown as Prisma's `P2002` / `P2025`.

To move to a real database later, replace `src/lib/db/client.ts` and delete the rest of `src/lib/db/`.

> **Single process only.** The write mutex and read cache live in one Node process. Do not run multiple replicas or `next start` behind a cluster — two processes would each cache stale data. One systemd unit is fine.

## Quick Start

```bash
npm install
cp .env.example .env          # then set AUTH_SECRET
npm run dev                   # http://localhost:3000
```

That's it. There is no database to install, migrate, or seed by hand — the app
reads and writes `data/*.json` directly. The first `npm run build` notices the
folder is empty and fills it with starter content so the site isn't blank; on
any later build it sees content already there and leaves it alone.

- Public: `http://localhost:3000`
- Admin: `http://localhost:3000/admin` (seed login: `admin@leaforganic.com` / `admin123`)
- Uploads: `uploads/*` (gitignored)

Other scripts:

```bash
npm run seed                                    # re-add starter content (won't overwrite)
npm run reset                                   # empty every data/*.json file
npm run admin -- you@example.com 'a-password'   # set/change the admin login
npm run build                                   # production build
npm start                                       # serve the production build
npm run backup                                  # snapshot data/ + uploads/
```

None of these talk to a database. `seed` and `reset` just write and empty JSON
files.

## Configuration

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | **yes in production** | 16+ chars, signs the admin session cookie. `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | yes in production | absolute origin, used by sitemap/robots/OG tags |
| `DATA_DIR` | no | defaults to `./data` |
| `UPLOAD_DIR` | no | defaults to `./uploads` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | credentials for `npm run seed` / `npm run admin` |

Without `AUTH_SECRET` the app refuses to sign sessions and admin pages error out. This is deliberate — never ship with the dev default.

## Deploy to a VPS

Assumes Ubuntu with nginx in front. The app itself just needs Node 20+ and a writable `data/` + `uploads/`.

**1. Get the code and install**

```bash
sudo adduser --system --group --home /srv/leaf-organic leaf
sudo -u leaf git clone <your-repo> /srv/leaf-organic
cd /srv/leaf-organic
sudo -u leaf npm ci
sudo -u leaf cp .env.example .env
sudo -u leaf openssl rand -base64 32          # paste into AUTH_SECRET
```

**2. Build.** Nothing to set up first — there is no database:

```bash
sudo -u leaf npm run build
```

`data/` and `uploads/` are gitignored (the running server writes to them on
every admin edit, so tracking them would break `git pull` on deploy). The build
sees the empty folder, writes starter content, and carries on. It skips that
step whenever content already exists, so rebuilds never overwrite a live site.

The build creates `admin@leaforganic.com` / `admin123`. On a public server,
change it right away:

```bash
sudo -u leaf npm run admin -- you@example.com 'a-strong-password'
```

> `npm run seed` never changes the password of an admin that already exists —
> re-seeding a live site must not be able to lock you out. Use `npm run admin`
> to set or change a password; it creates the admin if it doesn't exist. Both
> read `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` if you prefer, but those
> scripts have to load `.env` themselves (plain `node`/`tsx` do not), so
> passing the arguments is safer.

**3. Run it under systemd**

```bash
sudo cp deploy/leaf-organic.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now leaf-organic
sudo systemctl status leaf-organic
```

The unit runs as the unprivileged `leaf` user with `ProtectSystem=strict`, and grants write access only to `data/` and `uploads/`. Edit `deploy/leaf-organic.service` first if you install elsewhere.

**4. nginx + TLS**

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/leaf-organic
sudo ln -s ../sites-available/leaf-organic /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d example.com -d www.example.com
```

Replace `example.com` in the config with your domain. Note the `X-Forwarded-Proto` header — the app uses it to decide whether to set `Secure` on the session cookie, so don't drop it.

**5. Updating**

```bash
cd /srv/leaf-organic
sudo -u leaf git pull
sudo -u leaf npm ci
sudo -u leaf npm run build
sudo systemctl restart leaf-organic
```

`data/` and `uploads/` are outside git, so pulling and rebuilding never touches live content. The build's auto-seed is a no-op once content exists.

## Backups

`data/` **is** the database and `uploads/` **is** the media library. Back up both together:

```bash
npm run backup          # or: node scripts/backup.mjs -> backups/leaf-<timestamp>.tar.gz
```

Restore by untarring into the app directory and restarting:

```bash
cd /srv/leaf-organic
sudo -u leaf tar -xzf /path/to/leaf-20260101-120000.tar.gz
sudo systemctl restart leaf-organic
```

Schedule it with cron or a systemd timer, and copy `backups/` off the machine — a backup on the same disk is not a backup.

## Project structure

```
data/                     live JSON database (gitignored)
uploads/                  live media store (gitignored)
backups/                  snapshots from scripts/backup.mjs (gitignored)
deploy/                   systemd unit + nginx site
scripts/                  seed / reset / admin / backup, run with npm run <name>
src/
  app/                    routes; admin/ is the CMS, uploads/[...path] serves media
  components/
  lib/
    db/                   models, entities, store, client  <- the JSON layer
    prisma.ts             compatibility export (the `prisma` object)
    auth.ts  media.ts  settings.ts  validations.ts  actions.ts  utils.ts
```

## Notes / limits

- **Locked out of the admin?** Run `npm run admin -- <email> '<new-password>'`. `npm run seed` will not reset it.
- **Back up before you edit content in bulk.** The JSON files are the only copy.
- Uploads are capped at 4.5 MB, image MIME types only, deduplicated by content hash.
- Serving uploads through a route handler (rather than `public/`) is deliberate: `public/` is snapshotted at build time, so files added later would 404 until the next rebuild.
- Moving to S3/R2 for media means implementing `MediaStorage` in `src/lib/media.ts`. Moving to Postgres means reimplementing `src/lib/db/client.ts`.
