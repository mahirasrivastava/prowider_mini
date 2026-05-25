const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lead-distribution';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to database.');

  // Clear existing collections
  // We use drop/deleteMany to make sure we start fresh.
  try {
    await mongoose.connection.db.collection('providers').deleteMany({});
    await mongoose.connection.db.collection('leads').deleteMany({});
    await mongoose.connection.db.collection('processedpayments').deleteMany({});
    console.log('Cleared existing collections.');
  } catch (err) {
    console.log('No collections to clear or error clearing:', err.message);
  }

  const providers = [
    { providerId: 1, name: 'Provider 1', leadsCount: 0, lastAssignedAt: null },
    { providerId: 2, name: 'Provider 2', leadsCount: 0, lastAssignedAt: null },
    { providerId: 3, name: 'Provider 3', leadsCount: 0, lastAssignedAt: null },
    { providerId: 4, name: 'Provider 4', leadsCount: 0, lastAssignedAt: null },
    { providerId: 5, name: 'Provider 5', leadsCount: 0, lastAssignedAt: null },
    { providerId: 6, name: 'Provider 6', leadsCount: 0, lastAssignedAt: null },
    { providerId: 7, name: 'Provider 7', leadsCount: 0, lastAssignedAt: null },
    { providerId: 8, name: 'Provider 8', leadsCount: 0, lastAssignedAt: null },
  ];

  await mongoose.connection.db.collection('providers').insertMany(providers);
  console.log('Successfully seeded 8 providers.');

  // Explicitly create indexes to guarantee unique constraints are active
  await mongoose.connection.db.collection('leads').createIndex(
    { phoneNumber: 1, service: 1 },
    { unique: true }
  );
  console.log('Created compound unique index on leads (phoneNumber + service).');

  await mongoose.connection.db.collection('processedpayments').createIndex(
    { paymentId: 1 },
    { unique: true }
  );
  console.log('Created unique index on processedpayments (paymentId).');

  await mongoose.disconnect();
  console.log('Database connection closed. Seeding complete!');
}

seed().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
