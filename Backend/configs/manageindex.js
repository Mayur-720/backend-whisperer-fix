const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./dbConnect');

// Load environment variables
dotenv.config({ path: '../.env' });

const fixIndexes = async () => {
  try {
    // Verify MONGO_URL is defined
    if (!process.env.MONGO_URL) {
      throw new Error('MONGO_URL is not defined in .env file');
    }

    // Connect to MongoDB
    await connectDB();

    console.log('Checking indexes for Posts collection...');

    const Post = mongoose.model(
      'Post',
      new mongoose.Schema({}).set('collection', 'posts')
    );

    const indexes = await Post.collection.getIndexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    if (indexes['expiresAt_1']) {
      console.log('Found conflicting expiresAt_1 index. Dropping...');
      await Post.collection.dropIndex('expiresAt_1');
      console.log('Dropped expiresAt_1 index.');
    }

    console.log('Creating expiresAt_1 index with TTL...');
    await Post.collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'expiresAt_1', background: true }
    );
    console.log('Created expiresAt_1 index.');

    console.log('Verifying indexes...');
    const newIndexes = await Post.collection.getIndexes();
    console.log('Updated indexes:', JSON.stringify(newIndexes, null, 2));

    console.log('Index management completed successfully.');
  } catch (error) {
    console.error('Error managing indexes:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

fixIndexes();