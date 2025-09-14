#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up MeZoom Video Conferencing Application...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js 16 or higher.');
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
  console.error('❌ npm is not installed. Please install npm.');
  process.exit(1);
}

// Create .env files if they don't exist
const serverEnvPath = path.join(__dirname, 'server', '.env');
const clientEnvPath = path.join(__dirname, 'client', '.env');

if (!fs.existsSync(serverEnvPath)) {
  console.log('📝 Creating server/.env file...');
  const serverEnvContent = `PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mezoom
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000`;
  
  fs.writeFileSync(serverEnvPath, serverEnvContent);
  console.log('✅ server/.env created');
} else {
  console.log('✅ server/.env already exists');
}

if (!fs.existsSync(clientEnvPath)) {
  console.log('📝 Creating client/.env file...');
  const clientEnvContent = `REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000`;
  
  fs.writeFileSync(clientEnvPath, clientEnvContent);
  console.log('✅ client/.env created');
} else {
  console.log('✅ client/.env already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });
  
  console.log('Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('✅ All dependencies installed successfully!');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Set up your PostgreSQL database:');
console.log('   - Install PostgreSQL if you haven\'t already');
console.log('   - Create a database named "mezoom"');
console.log('   - Update server/.env with your database credentials');
console.log('\n2. Set up the database schema:');
console.log('   cd server && npm run db:setup');
console.log('\n3. (Optional) Seed the database with sample data:');
console.log('   cd server && npm run db:seed');
console.log('\n4. Start the application:');
console.log('   npm run dev');
console.log('\n5. Open your browser and go to:');
console.log('   http://localhost:3000');
console.log('\n🔧 Configuration:');
console.log('- Server runs on: http://localhost:5000');
console.log('- Client runs on: http://localhost:3000');
console.log('- Database: PostgreSQL (configure in server/.env)');
console.log('\n📚 For more information, see README.md');
console.log('\nHappy video conferencing! 🎥');
