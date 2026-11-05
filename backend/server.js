require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const rateLimit = require('express-rate-limit')
const mongoose  = require('mongoose')
const path      = require('path')
const cron      = require('node-cron')

const authRoutes         = require('./routes/auth')
const materialRoutes     = require('./routes/materials')
const bidRoutes          = require('./routes/bids')
const auctionRoutes      = require('./routes/auctions')
const transactionRoutes  = require('./routes/transactions')
const notificationRoutes = require('./routes/notifications')
const businessRoutes     = require('./routes/business')
const adminRoutes        = require('./routes/admin')
const buyerRoutes        = require('./routes/buyer')
const sellerRoutes       = require('./routes/seller')

const { closeExpiredAuctions } = require('./utils/auctionJobs')
const { seedAdmin }            = require('./utils/seedAdmin')

const app  = express()
const PORT = process.env.PORT || 5003

/* ─── Middleware ─── */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: (o, cb) => cb(null, true), credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

/* ─── Routes ─── */
app.use('/api/auth',          authRoutes)
app.use('/api/materials',     materialRoutes)
app.use('/api/bids',          bidRoutes)
app.use('/api/auctions',      auctionRoutes)
app.use('/api/transactions',  transactionRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/business',      businessRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/buyer',         buyerRoutes)
app.use('/api/seller',        sellerRoutes)

app.get('/api/health', (req, res) => res.json({
  status : 'ok',
  db     : mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  time   : new Date().toISOString(),
}))

app.use((req, res) => res.status(404).json({ message: 'Route not found' }))
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

/* ─── Connect to MongoDB ─── */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scrapbazaar'

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    const host = mongoose.connection.host
    console.log(`\n✅ MongoDB connected  →  ${host}`)
    return true
  } catch (err) {
    console.log('\n' + '═'.repeat(58))
    console.log('  ❌  MongoDB not reachable')
    console.log('═'.repeat(58))
    console.log(`\n  Tried: ${uri}`)
    console.log('\n  MongoDB is installed (service found) but STOPPED.')
    console.log('\n  Fix — do ONE of these:')
    console.log('\n  A) Double-click:  start-mongodb-service.bat')
    console.log('     (runs as admin, starts the service)')
    console.log('\n  B) Open Command Prompt as Administrator and run:')
    console.log('     net start MongoDB')
    console.log('\n  C) Open Services (Win+R → services.msc)')
    console.log('     Find "MongoDB Server" → right-click → Start')
    console.log('\n  Then restart this backend.')
    console.log('═'.repeat(58) + '\n')
    return false
  }
}

async function main() {
  const dbOk = await connectDB()

  if (dbOk) {
    await seedAdmin()
    cron.schedule('* * * * *', async () => {
      try { await closeExpiredAuctions() }
      catch (e) { console.error('Cron error:', e.message) }
    })
    console.log('\n  Default admin credentials:')
    console.log(`  Email:    ${process.env.ADMIN_EMAIL    || 'admin@scrapbazaar.in'}`)
    console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}\n`)
  }

  app.listen(PORT, () => {
    console.log(`🚀 ScrapBazaar API  →  http://localhost:${PORT}`)
    console.log(`   DB status  : ${dbOk ? '✅ Connected' : '❌ NOT connected — start MongoDB first'}`)
    console.log(`   Health URL : http://localhost:${PORT}/api/health\n`)
  })
}

main().catch(console.error)
