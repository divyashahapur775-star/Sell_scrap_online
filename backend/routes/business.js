const express             = require('express')
const router              = express.Router()
const BusinessProfile     = require('../models/BusinessProfile')
const User                = require('../models/User')
const { protect }         = require('../middleware/auth')
const { uploadDocument, getFileUrl } = require('../middleware/upload')
const { createNotification }         = require('../utils/notifications')
const { verifyBusiness }             = require('../utils/verificationService')

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/business/verify
// Validates business details, runs verification service, and if successful
// immediately sets verificationStatus to 'approved' so the user can access
// the marketplace without waiting for manual admin approval.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify', protect, uploadDocument, async (req, res) => {
  try {
    const {
      businessName, businessType, authorizedPerson,
      gstin, businessRegNo,
      address, city, state, pincode,
    } = req.body

    const documentUrl = getFileUrl(req.file)

    // ── Run the verification service ─────────────────────────────────────────
    const result = await verifyBusiness({
      businessName, businessType, authorizedPerson,
      gstin, businessRegNo, address, city, state,
    })

    if (!result.verified) {
      // Validation or API returned a failure — do NOT update status
      return res.status(400).json({
        success: false,
        status:  result.status,        // 'VERIFICATION_FAILED'
        message: result.reason || 'Verification failed. Please check your details and try again.',
      })
    }

    // ── Verification passed — save profile and mark as approved ──────────────
    const profile = await BusinessProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        businessName, businessType, authorizedPerson,
        gstin, businessRegNo, address, city, state, pincode,
        documentUrl,
        verifiedAt: new Date(),
        verificationProvider: result.provider || 'DEVELOPMENT_MODE',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    // Immediately set status to 'approved' — no manual admin step required
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        verificationStatus:   'approved',
        verificationSubmitted: true,
        businessProfile:       profile._id,
        businessName,
        businessType,
      },
      { new: true }
    )

    // Notify the user
    await createNotification(
      req.user._id,
      'verification',
      `Your business "${businessName}" has been verified successfully! You can now access all marketplace features.`,
    )

    // Return the updated user so the frontend can sync state immediately
    res.json({
      success: true,
      status:  'VERIFIED',
      message: 'Business verified successfully!',
      user:    updatedUser.toPublic(),
      profile,
    })

  } catch (err) {
    console.error('[POST /api/business/verify]', err)
    res.status(500).json({
      success: false,
      status:  'VERIFICATION_FAILED',
      message: 'Verification service unavailable. Please try again.',
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/business/profile
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile', protect, async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ user: req.user._id }).lean()
    res.json({ profile })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/business/profile
// ─────────────────────────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { businessName, businessType, address, city, state, pincode } = req.body
    const profile = await BusinessProfile.findOneAndUpdate(
      { user: req.user._id },
      { businessName, businessType, address, city, state, pincode },
      { new: true }
    )
    if (businessName) await User.findByIdAndUpdate(req.user._id, { businessName })
    res.json({ profile })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
