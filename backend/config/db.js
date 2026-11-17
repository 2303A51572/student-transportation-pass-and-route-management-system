const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transport_db';

  try {
    // Attempt standard connection first with reasonable timeout
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log(`[MongoDB] Connected successfully to: ${uri}`);
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to standard URI (${uri}): ${err.message}`);
    console.log('[MongoDB] Initializing embedded MongoDB Memory Server for local development/testing...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memUri = mongodInstance.getUri();
      await mongoose.connect(memUri);
      console.log(`[MongoDB] Embedded MongoDB Server active at: ${memUri}`);
    } catch (memErr) {
      console.error(`[MongoDB] Failed to start embedded MongoDB Server: ${memErr.message}`);
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error(`[MongoDB] Error disconnecting: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
