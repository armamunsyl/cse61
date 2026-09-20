import { connectDb, disconnectDb } from "../config/db.js";
import { RoutineSlot } from "../models/RoutineSlot.js";
import { routineRowsToDocuments, updatedRoutine } from "../data/updatedRoutine.js";

async function run() {
  await connectDb();
  await RoutineSlot.deleteMany({});
  const inserted = await RoutineSlot.insertMany(routineRowsToDocuments(updatedRoutine));
  console.log(`Routine synced. Inserted ${inserted.length} slots.`);
  await disconnectDb();
}

run().catch(async (error) => {
  console.error(error.message);
  await disconnectDb();
  process.exit(1);
});
