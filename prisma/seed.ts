import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "barry@ncrp.shop";
const ADMIN_TEMP_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "changeme123!";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`Admin account already exists for ${ADMIN_EMAIL}, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_TEMP_PASSWORD, 10);

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      name: "Barry",
      mustChangePassword: true,
    },
  });

  console.log(`Created ADMIN account: ${ADMIN_EMAIL}`);
  console.log(`Temporary password: ${ADMIN_TEMP_PASSWORD}`);
  console.log("This account must change its password on first login.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
