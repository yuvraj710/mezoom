const { query, connectDB } = require('../config/database');

const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Meetings table
    await query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(12) PRIMARY KEY,
        title VARCHAR(100) NOT NULL DEFAULT 'Untitled Meeting',
        description TEXT,
        creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_private BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
        created_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP
      )
    `);

    // Meeting participants table
    await query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id SERIAL PRIMARY KEY,
        meeting_id VARCHAR(12) REFERENCES meetings(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        left_at TIMESTAMP,
        UNIQUE(meeting_id, user_id)
      )
    `);

    // Chat messages table
    await query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        meeting_id VARCHAR(12) REFERENCES meetings(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_creator_id ON meetings(creator_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_meeting_id ON chat_messages(meeting_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    `);

    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await createTables();
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { createTables };
