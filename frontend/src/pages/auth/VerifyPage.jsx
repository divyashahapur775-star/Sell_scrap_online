import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { businessAPI } from '../../services/api'
import { Upload, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import './AuthPages.css'

export default function VerifyPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [loading,  setLoading]  = useState(false)
  const [docFile,  setDocFile]  = useState(null)
  const [verified, setVerified] = useState(false)   // local success state for animation
  const [form,     setForm]     = useState({
    businessName:     user?.businessName || '',
    businessType:     user?.businessType || '',
    authorizedPerson: user?.name         || '',
    gstin:            '',
    businessRegNo:    '',
    address:          '',
    city:             '',
    state:            '',
    pincode:          '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // ── Already verified → straight to dashboard ────────────────────
  if (user?.verificationStatus === 'approved' && !verified) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-primary)', padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <CheckCircle2 size={64} style={{ color: 'var(--brand-primary)', margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: 8 }}>Business Already Verified</h2>
          <p style={{ marginBottom: 24 }}>
            Your business is verified. You can access all marketplace features.
          </p>
          <button className="btn btn-primary" onClick={() => navigate(`/${user.role}/overview`)}>
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Success animation screen ────────────────────────────────────
  if (verified) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-primary)', padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480, animation: 'fadeInUp 0.5s ease' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'var(--green-100)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <CheckCircle2 size={48} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <h2 style={{ marginBottom: 10, color: 'var(--text-primary)' }}>
            Business Verified Successfully!
          </h2>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            Redirecting you to your {user?.role} dashboard...
          </p>
          <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} />
        </div>
      </div>
    )
  }

  // ── Rejected state ───────────────────────────────────────────────
  if (user?.verificationStatus === 'rejected') {
    // Allow re-submission — fall through to the form below
    // but show a banner
  }

  // ── Main form ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (docFile) fd.append('document', docFile)

      const res = await businessAPI.submitVerification(fd)

      if (res.data.success && res.data.status === 'VERIFIED') {
        // ✅ Verified — sync local state immediately then redirect
        updateUser({
          verificationStatus:   'approved',
          verificationSubmitted: true,
          businessName:          form.businessName,
          businessType:          form.businessType,
        })
        setVerified(true)
        toast.success('Business verified successfully!')

        // Redirect after brief success screen
        setTimeout(() => {
          navigate(`/${user.role}/overview`, { replace: true })
        }, 2000)
      } else {
        toast.error(res.data.message || 'Verification failed. Please check your details.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification service unavailable. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page verify-page">
      {/* ── Left panel ─────────────────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="logo-mark" style={{ width: 52, height: 52, fontSize: '1rem' }}>SB</div>
          <div>
            <div className="logo-name">ScrapBazaar</div>
            <div className="logo-tagline">Business Verification</div>
          </div>
        </div>

        <div className="auth-hero-text">
          <h2>Verify your business and start trading instantly.</h2>
          <p>
            Fill in your business details and click <strong>"Verify Business"</strong>.
            Verified users get immediate access to all marketplace features.
          </p>
        </div>

        <div className="verify-steps">
          <div className="verify-step done">
            <CheckCircle2 size={16} /> Account created
          </div>
          <div className="verify-step active">
            <AlertCircle size={16} /> Verify business details
          </div>
          <div className="verify-step">
            <ShieldCheck size={16} /> Access marketplace
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
          GSTIN is not mandatory. A business registration number is accepted as an alternative.
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-card" style={{ maxWidth: 600 }}>
          <h2 className="auth-title">Business Verification</h2>
          <p className="auth-subtitle">
            Enter your business details below. Verification is instant.
          </p>

          {/* Rejected banner */}
          {user?.verificationStatus === 'rejected' && (
            <div style={{
              background: '#FEE2E2', border: '1px solid #FECACA',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20,
            }}>
              <XCircle size={18} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ color: '#991B1B', fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>
                  Previous verification was not successful
                </p>
                <p style={{ color: '#B91C1C', fontSize: '0.825rem' }}>
                  {user?.rejectionReason || 'Please review your details and resubmit.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Business Name + Type */}
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g., Sharma Metals Pvt Ltd"
                  value={form.businessName}
                  onChange={set('businessName')}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Business Type *</label>
                <select className="form-input" value={form.businessType} onChange={set('businessType')} required>
                  <option value="">Select type</option>
                  <option value="proprietorship">Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="private_limited">Private Limited</option>
                  <option value="public_limited">Public Limited</option>
                  <option value="llp">LLP</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Authorized person */}
            <div className="form-group">
              <label className="form-label">Authorized Person's Name *</label>
              <input
                className="form-input"
                placeholder="Full name of owner / director"
                value={form.authorizedPerson}
                onChange={set('authorizedPerson')}
                required
              />
            </div>

            {/* GSTIN / Reg No */}
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">
                  GSTIN <span className="form-hint" style={{ display: 'inline' }}>(optional)</span>
                </label>
                <input
                  className="form-input"
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  value={form.gstin}
                  onChange={set('gstin')}
                  maxLength={15}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Business Reg. No. <span className="form-hint" style={{ display: 'inline' }}>(if no GSTIN)</span>
                </label>
                <input
                  className="form-input"
                  placeholder="Registration number"
                  value={form.businessRegNo}
                  onChange={set('businessRegNo')}
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">Business Address *</label>
              <input
                className="form-input"
                placeholder="Street / Area / Building"
                value={form.address}
                onChange={set('address')}
                required
              />
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input className="form-input" placeholder="e.g., Mumbai" value={form.city} onChange={set('city')} required />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input className="form-input" placeholder="e.g., Maharashtra" value={form.state} onChange={set('state')} required />
              </div>
            </div>

            {/* Document upload (optional in dev mode) */}
            <div className="form-group">
              <label className="form-label">
                Business Document <span className="form-hint" style={{ display: 'inline' }}>(optional — GSTIN certificate, registration, etc.)</span>
              </label>
              <div
                className={`file-drop-zone ${docFile ? 'has-file' : ''}`}
                onClick={() => document.getElementById('docInput').click()}
              >
                {docFile ? (
                  <div className="file-selected">
                    <CheckCircle2 size={20} style={{ color: 'var(--brand-primary)' }} />
                    <span>{docFile.name}</span>
                    <button
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); setDocFile(null) }}
                      style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <Upload size={24} />
                    <p>Click to upload GSTIN certificate, registration or any valid document</p>
                    <span>PDF, JPG or PNG — Max 5MB</span>
                  </div>
                )}
                <input
                  id="docInput"
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setDocFile(e.target.files[0])}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <><div className="spinner" style={{ borderTopColor: 'white' }} /> Verifying...</>
              ) : (
                <><ShieldCheck size={18} /> Verify Business</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
