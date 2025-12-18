import { PrismaClient } from "@prisma/client";

declare global {
  var prismaClientSingleton: PrismaClient | undefined;
}

const prismaClient = global.prismaClientSingleton ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaClientSingleton = prismaClient;
}

export default prismaClient;
