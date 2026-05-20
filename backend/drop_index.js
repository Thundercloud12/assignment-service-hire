const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect('mongodb+srv://poojarykeerthan163_db_user:VbwL1QzwnpjkcFeF@cluster0.va41mo0.mongodb.net/?appName=Cluster0');
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    const collection = db.collection('email_templates');
    
    // Check if index exists before trying to drop it
    const indexes = await collection.indexes();
    const hasNameIndex = indexes.some(i => i.name === 'name_1');
    
    if (hasNameIndex) {
      await collection.dropIndex('name_1');
      console.log('Dropped name_1 index successfully');
    } else {
      console.log('Index name_1 does not exist, nothing to do');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndex();
