import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany({ select: { id: true, name: true, email: true, createdAt: true } });
  console.log("Existing admins:", admins);

  const [, , newPassword] = process.argv;
  if (!newPassword) {
    console.log('\nTo reset the first admin\'s password, run again with:');
    console.log('  node reset-Chase-admin.mjs yourNewPassword');
    return;
  }

  if (admins.length === 0) {
    console.log("No admin accounts found — nothing to reset.");
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updated = await prisma.admin.update({
    where: { id: admins[0].id },
    data: { passwordHash },
  });
  console.log(`\nPassword reset for ${updated.email}. You can log in with that email and the new password now.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
