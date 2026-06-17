import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import {
  comments,
  folders,
  notifications,
  videoSegments,
  videos,
} from "@/db/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const folder: typeof folders.$inferInsert = {
    userId: " efefeff",
    name: "dvff",
    parentId: "396ec287-938d-48c8-a1b1-d8fe2429fa07",
  };

  await db.insert(folders).values(folder);
  console.log("New user created!");

  const folderss = await db.select().from(folders);
  console.log("Getting all folders from the database: ", folderss);

  /*
  const users: {
    id: number;
    name: string;
    age: number;
    email: string;
  }[]
  */

  // await db
  //   .update(usersTable)
  //   .set({
  //     age: 31,
  //   })
  //   .where(eq(usersTable.email, user.email));
  // console.log("User info updated!");

  // await db.delete(usersTable).where(eq(usersTable.email, user.email));
  // console.log("User deleted!");
}

main();
