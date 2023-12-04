require('dotenv').config()

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Make npx jest use .env.local for tests
  setupFiles: ['dotenv/config'],
}
