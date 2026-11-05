// Starts MongoDB service with elevation prompt
const { execSync } = require('child_process')

try {
  console.log('Attempting to start MongoDB service...')
  const result = execSync(
    'powershell -Command "Start-Process -FilePath \'net\' -ArgumentList \'start MongoDB\' -Verb RunAs -Wait"',
    { stdio: 'pipe', timeout: 15000 }
  ).toString()
  console.log('Result:', result)
} catch (err) {
  const msg = err.stdout ? err.stdout.toString() : err.message
  if (msg.includes('already been started') || msg.includes('already running')) {
    console.log('✅ MongoDB service is already running!')
  } else {
    console.log('Output:', msg)
    console.log('Stderr:', err.stderr ? err.stderr.toString() : '')
  }
}

// Verify connection
setTimeout(() => {
  const mongoose = require('./backend/node_modules/mongoose')
  mongoose.connect('mongodb://127.0.0.1:27017/scrapbazaar', { serverSelectionTimeoutMS: 3000 })
    .then(() => {
      console.log('✅ MongoDB is now reachable! You can start the backend.')
      process.exit(0)
    })
    .catch(e => {
      console.log('❌ Still not reachable:', e.message)
      console.log('\nPlease manually run as Administrator:')
      console.log('  net start MongoDB')
      process.exit(1)
    })
}, 3000)
