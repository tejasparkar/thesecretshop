import mongoose from 'mongoose';

let memoryServer;

export async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('thesecretshop');
    console.log('⚠  No MONGO_URI set — using in-memory MongoDB (data resets on restart)');
  }

  await mongoose.connect(uri);
  console.log(`✔  MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return { inMemory: Boolean(memoryServer) };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
