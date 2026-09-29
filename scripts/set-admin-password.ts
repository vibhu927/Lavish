// Create or update the admin login. Run this whenever the password is unknown
// or needs changing -- `npm run seed` deliberately leaves an existing admin's
// password alone, so it cannot be used to reset it.
//
//   npm run admin
//   npm run admin -- you@example.com 'a-strong-password'
//
// Credentials may also come from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { loadEnv } from "./load-env";

loadEnv();

async function main() {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    console.error(
      "Set both an email and a password:\n" +
        "  npm run admin -- you@example.com 'a-strong-password'\n" +
        "  ...or set ADMIN_EMAIL and ADMIN_PASSWORD in .env and run `npm run admin`."
    );
    process.exit(1);
  }
  if (!email.includes("@")) {
    console.error(`"${email}" is not a valid email address.`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  const user = await prisma.adminUser.upsert({
    where: { email },
    // Updating the hash is the whole point of this script. `npm run seed` uses
    // `update: {}` so that re-seeding never silently rotates a live password.
    update: { passwordHash: hash },
    create: { email, name: "Admin", passwordHash: hash, role: "ADMIN" },
  });

  console.log(
    `${existing ? "Password updated" : "Admin created"}: ${user.email} (id=${user.id})`
  );
}

main().catch((e) => {
  console.error("Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
