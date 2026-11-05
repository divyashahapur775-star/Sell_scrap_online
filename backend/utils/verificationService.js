/**
 * verificationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised business verification logic.
 *
 * CURRENT MODE: DEVELOPMENT
 *   Validates fields locally. Does NOT call any external government or
 *   business verification API. This is clearly a development-only flow and
 *   must never be presented to users as official verification.
 *
 * TO INTEGRATE A REAL VERIFICATION API (next stage):
 *   1. Set VERIFICATION_PROVIDER=<provider_name> in backend/.env
 *   2. Set VERIFICATION_API_KEY=<key> in backend/.env
 *   3. Implement the provider's logic in the switch-case below.
 *   4. Remove the DEV_MODE fallback or restrict it to NODE_ENV=test.
 *
 * Supported future providers (add cases as needed):
 *   - "signzy"    → Signzy Business Verification API
 *   - "karza"     → Karza Data Labs API
 *   - "razorpay"  → Razorpay Route KYC
 *   - "sandbox"   → Provider sandbox/test mode
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PROVIDER = process.env.VERIFICATION_PROVIDER || 'dev'

/**
 * Validate that required fields are present and well-formed.
 * Returns { valid: Boolean, error: String|null }
 */
function validateFields({ businessName, businessType, authorizedPerson, gstin, businessRegNo, address, city, state }) {
  if (!businessName || businessName.trim().length < 2) {
    return { valid: false, error: 'Business name is required (minimum 2 characters).' }
  }
  if (!businessType) {
    return { valid: false, error: 'Business type is required.' }
  }
  if (!authorizedPerson || authorizedPerson.trim().length < 2) {
    return { valid: false, error: 'Authorized person\'s name is required.' }
  }
  if (!gstin && !businessRegNo) {
    return { valid: false, error: 'Please provide a GSTIN or a business registration number.' }
  }
  if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase())) {
    return { valid: false, error: 'GSTIN format is invalid. Expected format: 22AAAAA0000A1Z5' }
  }
  if (!address || address.trim().length < 5) {
    return { valid: false, error: 'Business address is required.' }
  }
  if (!city || city.trim().length < 2) {
    return { valid: false, error: 'City is required.' }
  }
  if (!state || state.trim().length < 2) {
    return { valid: false, error: 'State is required.' }
  }
  return { valid: true, error: null }
}

/**
 * Development-mode verification.
 * Performs field validation only. NOT a real verification.
 */
async function verifyDev(data) {
  console.log('[VerificationService] ⚠  DEVELOPMENT MODE — not a real business verification')

  const fieldCheck = validateFields(data)
  if (!fieldCheck.valid) {
    return { verified: false, status: 'VERIFICATION_FAILED', reason: fieldCheck.error }
  }

  // In dev mode: if all required fields pass local validation → approve
  return {
    verified: true,
    status:   'VERIFIED',
    provider: 'DEVELOPMENT_MODE',
    note:     'Auto-approved in development mode. Replace with a real provider for production.',
    verifiedAt: new Date().toISOString(),
  }
}

/**
 * Signzy verification stub.
 * Replace the body of this function with actual Signzy API calls.
 */
async function verifySignzy(data) {
  const apiKey = process.env.VERIFICATION_API_KEY
  if (!apiKey) {
    throw new Error('VERIFICATION_API_KEY is not set in environment variables.')
  }
  // TODO: implement Signzy API call
  // const response = await axios.post('https://api.signzy.com/verify', { ... }, { headers: { Authorization: apiKey } })
  throw new Error('Signzy integration not yet implemented. Set VERIFICATION_PROVIDER=dev or implement this function.')
}

/**
 * Karza verification stub.
 */
async function verifyKarza(data) {
  const apiKey = process.env.VERIFICATION_API_KEY
  if (!apiKey) {
    throw new Error('VERIFICATION_API_KEY is not set in environment variables.')
  }
  // TODO: implement Karza API call
  throw new Error('Karza integration not yet implemented. Set VERIFICATION_PROVIDER=dev or implement this function.')
}

/**
 * Main verification entry point.
 * Call this from the business route.
 *
 * Returns:
 *   { verified: Boolean, status: String, reason?: String, provider?: String }
 *
 * Status values:
 *   VERIFIED            — verification passed
 *   VERIFICATION_FAILED — validation or API returned negative result
 *   VERIFICATION_PENDING — async provider (poll later)
 */
async function verifyBusiness(data) {
  // Always run field validation first regardless of provider
  const fieldCheck = validateFields(data)
  if (!fieldCheck.valid) {
    return { verified: false, status: 'VERIFICATION_FAILED', reason: fieldCheck.error }
  }

  switch (PROVIDER.toLowerCase()) {
    case 'dev':
    case 'development':
      return await verifyDev(data)

    case 'signzy':
      return await verifySignzy(data)

    case 'karza':
      return await verifyKarza(data)

    default:
      console.warn(`[VerificationService] Unknown provider: ${PROVIDER}. Falling back to dev mode.`)
      return await verifyDev(data)
  }
}

module.exports = { verifyBusiness, validateFields }
