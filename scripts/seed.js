const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const instructor = await prisma.user.upsert({
    where: { email: "instructor@example.com" },
    update: {},
    create: {
      email: "instructor@example.com",
      name: "Dr. Jane Smith",
      role: "instructor",
    },
  });

  const student1 = await prisma.user.upsert({
    where: { email: "student1@example.com" },
    update: {},
    create: {
      email: "student1@example.com",
      name: "Alice Johnson",
      role: "student",
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "student2@example.com" },
    update: {},
    create: {
      email: "student2@example.com",
      name: "Bob Williams",
      role: "student",
    },
  });

  const assignments = await Promise.all([
    prisma.assignment.create({
      data: {
        title: "Introduction to Machine Learning",
        description: "Write an essay explaining the basics of supervised and unsupervised learning. Include examples.",
        maxScore: 100,
        createdById: instructor.id,
      },
    }).catch(() => null),
    prisma.assignment.create({
      data: {
        title: "Data Structures Analysis",
        description: "Compare arrays vs linked lists. Discuss time complexity of common operations.",
        maxScore: 100,
        createdById: instructor.id,
      },
    }).catch(() => null),
  ]);

  console.log("Seeded:", { instructor, student1, student2, assignments });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
