const { query, connectDB } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('Seeding database with sample data...');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        password_hash: hashedPassword
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password_hash: hashedPassword
      },
      {
        username: 'alice_wonder',
        email: 'alice@example.com',
        password_hash: hashedPassword
      }
    ];

    console.log('Creating sample users...');
    for (const user of users) {
      await query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
        [user.username, user.email, user.password_hash]
      );
    }

    // Create sample meetings
    const meetings = [
      {
        id: 'sample123',
        title: 'Team Standup Meeting',
        description: 'Daily standup for the development team',
        creator_id: 1,
        is_private: false
      },
      {
        id: 'private456',
        title: 'Private Client Call',
        description: 'Confidential discussion with client',
        creator_id: 2,
        is_private: true
      },
      {
        id: 'demo789',
        title: 'Product Demo',
        description: 'Demonstrating new features to stakeholders',
        creator_id: 1,
        is_private: false
      }
    ];

    console.log('Creating sample meetings...');
    for (const meeting of meetings) {
      await query(
        `INSERT INTO meetings (id, title, description, creator_id, is_private) 
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [meeting.id, meeting.title, meeting.description, meeting.creator_id, meeting.is_private]
      );
    }

    // Create sample chat messages
    const messages = [
      {
        meeting_id: 'sample123',
        user_id: 1,
        message: 'Good morning everyone! Ready to start our standup?',
        message_type: 'text'
      },
      {
        meeting_id: 'sample123',
        user_id: 2,
        message: 'Morning! I\'m ready.',
        message_type: 'text'
      },
      {
        meeting_id: 'sample123',
        user_id: 3,
        message: 'Good morning! Let\'s begin.',
        message_type: 'text'
      },
      {
        meeting_id: 'demo789',
        user_id: 1,
        message: 'Welcome to our product demo!',
        message_type: 'text'
      }
    ];

    console.log('Creating sample chat messages...');
    for (const message of messages) {
      await query(
        'INSERT INTO chat_messages (meeting_id, user_id, message, message_type) VALUES ($1, $2, $3, $4)',
        [message.meeting_id, message.user_id, message.message, message.message_type]
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Sample data created:');
    console.log('- 3 users (john@example.com, jane@example.com, alice@example.com)');
    console.log('- Password for all users: password123');
    console.log('- 3 sample meetings');
    console.log('- Sample chat messages');
    console.log('\n🔗 Sample meeting URLs:');
    console.log('- http://localhost:3000/meeting/sample123');
    console.log('- http://localhost:3000/meeting/demo789');
    console.log('- http://localhost:3000/meeting/private456 (private)');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await seedDatabase();
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { seedDatabase };
