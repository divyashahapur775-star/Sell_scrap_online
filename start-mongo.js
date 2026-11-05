const { spawn } = require('child_process')
const fs        = require('fs')
const path      = require('path')

const mongodPath = 'C:/Program Files/MongoDB/Server/8.3/bin/mongod.exe'
const dbPath     = 'C:/data/db'

// Make sure data dir exists
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true })
  console.log('Created data dir:', dbPath)
}

console.log('Starting MongoDB...')
const mongo = spawn(mongodPath, ['--dbpath', dbPath, '--port', '27017'], {
  stdio: 'pipe',
})

mongo.stdout.on('data', d => {
  const msg = d.toString()
  if (msg.includes('Waiting for connections') || msg.includes('waiting for connections')) {
    console.log('✅ MongoDB is ready on port 27017')
  }
  if (msg.includes('ERROR') || msg.includes('error')) {
    process.stdout.write(msg)
  }
})

mongo.stderr.on('data', d => process.stderr.write(d))
mongo.on('error', e => console.error('Failed to start MongoDB:', e.message))
mongo.on('close', code => console.log('MongoDB exited with code', code))

// Keep this process alive (mongod is a child)
process.on('SIGINT', () => { mongo.kill(); process.exit(0) })
