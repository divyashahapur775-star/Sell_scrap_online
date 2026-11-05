const mongoose = require('mongoose')

const businessProfileSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName:  { type: String, required: true, trim: true },
  businessType:  { type: String, required: true },
  authorizedPerson: { type: String, required: true },
  gstin:         { type: String, trim: true },
  businessRegNo: { type: String, trim: true },
  address:       { type: String },
  city:          { type: String },
  state:         { type: String },
  pincode:       { type: String },
  documentUrl:   { type: String },
  documentPublicId: { type: String },

  // Verification metadata
  verifiedAt:           { type: Date },
  verificationProvider: { type: String, default: 'DEVELOPMENT_MODE' },
}, { timestamps: true })

module.exports = mongoose.model('BusinessProfile', businessProfileSchema)
