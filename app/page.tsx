'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export default function Home() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    // Initialize theme early (before app.js loads) to prevent flash
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('measurement_vault_theme') || 'dark') as 'dark' | 'light'
      setThemeState(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)

      // Initialize Supabase client globally for app.js to use
      if (!(window as any).supabaseClient) {
        (async () => {
          try {
            const { createClient } = await import('@supabase/supabase-js')
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            if (supabaseUrl && supabaseKey) {
              (window as any).supabaseClient = createClient(supabaseUrl, supabaseKey)
              console.log('Supabase client initialized successfully')
            } else {
              console.error('Supabase environment variables not set:', {
                url: !!supabaseUrl,
                key: !!supabaseKey
              })
              console.error('Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
            }
          } catch (err) {
            console.error('Failed to initialize Supabase:', err)
          }
        })()
      } else {
        console.log('Supabase client already initialized')
      }
    }
  }, [])

  const toggleTheme = () => {
    if (typeof window !== 'undefined') {
      const newTheme = theme === 'dark' ? 'light' : 'dark'
      setThemeState(newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
      localStorage.setItem('measurement_vault_theme', newTheme)
      
      // Also trigger the app.js function if it exists
      if (typeof (window as any).setTheme === 'function') {
        (window as any).setTheme(newTheme)
      }
    }
  }

  return (
    <>
      {/* Business Setup Screen */}
      <div id="business-setup-screen" className="screen">
        <div className="container">
          <h1>Welcome to<br />Measurement Vault</h1>
          <p className="setup-subtitle">Set up your business to get started</p>
          
          <form id="business-setup-form">
            <div className="form-group">
              <label htmlFor="business-name">Business Name <span className="required">*</span></label>
              <input type="text" id="business-name" required autoComplete="off" placeholder="e.g., Elite Tailors" />
            </div>

            <div className="form-group">
              <label htmlFor="business-email">Business Email <span className="required">*</span></label>
              <input type="email" id="business-email" required autoComplete="off" placeholder="e.g., info@elitetailors.com" />
            </div>

            <div className="form-group">
              <label htmlFor="business-phone">Business Phone <span className="required">*</span></label>
              <input type="tel" id="business-phone" required autoComplete="off" placeholder="e.g., +234 800 000 0000" />
            </div>

            <button type="submit" className="btn btn-primary btn-save">Continue</button>
          </form>
        </div>
      </div>

      {/* Home Screen */}
      <div id="home-screen" className="screen">
        <div className="container">
          <div className="home-header">
            <h1 id="business-header-name">Measurement Vault</h1>
            <div className="header-actions">
              <button 
                id="theme-toggle-btn" 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>
              <button id="settings-btn" className="btn-settings" title="Settings" aria-label="Settings">⚙</button>
            </div>
          </div>
          <div className="action-buttons">
            <button id="new-measurement-btn" className="btn btn-primary">
              New Measurement
            </button>
            <button id="search-measurements-btn" className="btn btn-secondary">
              Search Measurements
            </button>
            <button id="clients-btn" className="btn btn-secondary">
              Clients
            </button>
          </div>
          
          <div className="recent-section">
            <h3>Recent Measurements</h3>
            <div id="recent-measurements" className="recent-list"></div>
          </div>
        </div>
      </div>

      {/* Settings Screen */}
      <div id="settings-screen" className="screen">
        <div className="container">
          <div className="screen-header">
            <button id="back-from-settings-btn" className="btn-back">← Back</button>
            <h2>Settings</h2>
          </div>

          <div className="settings-content">
            <div className="settings-section">
              <h3>Business Info</h3>
              <div id="business-info-display" className="business-info"></div>
              <button id="edit-business-btn" className="btn btn-secondary" style={{ marginTop: '16px' }}>
                Edit Business
              </button>
            </div>

            <div className="settings-section" style={{ marginTop: '40px' }}>
              <h3>Session</h3>
              <p className="settings-info">Log out without deleting your data.</p>
              <button id="logout-btn" className="btn btn-secondary">
                Logout
              </button>
            </div>

            <div className="settings-section" style={{ marginTop: '40px' }}>
              <h3>Danger Zone</h3>
              <p className="settings-warning">This will permanently delete all your data including clients and measurements.</p>
              <button id="reset-business-btn" className="btn btn-delete">
                Reset Business
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Business Screen */}
      <div id="edit-business-screen" className="screen">
        <div className="container">
          <div className="screen-header">
            <button id="back-from-edit-business-btn" className="btn-back">← Back</button>
            <h2>Edit Business</h2>
          </div>
          
          <form id="edit-business-form">
            <div className="form-group">
              <label htmlFor="edit-business-name">Business Name <span className="required">*</span></label>
              <input type="text" id="edit-business-name" required autoComplete="off" />
            </div>

            <div className="form-group">
              <label htmlFor="edit-business-email">Business Email <span className="required">*</span></label>
              <input type="email" id="edit-business-email" required autoComplete="off" />
            </div>

            <div className="form-group">
              <label htmlFor="edit-business-phone">Business Phone <span className="required">*</span></label>
              <input type="tel" id="edit-business-phone" required autoComplete="off" />
            </div>

            <button type="submit" className="btn btn-primary btn-save">Save Changes</button>
          </form>
        </div>
      </div>

      {/* Business Login Screen */}
      <div id="business-login-screen" className="screen">
        <div className="container">
          <h1>Welcome Back</h1>
          <p className="setup-subtitle">Enter your business details to continue</p>
          
          <form id="business-login-form">
            <div className="form-group">
              <label htmlFor="login-business-name">Business Name <span className="required">*</span></label>
              <input type="text" id="login-business-name" required autoComplete="off" />
            </div>

            <div className="form-group">
              <label htmlFor="login-business-email">Business Email <span className="required">*</span></label>
              <input type="email" id="login-business-email" required autoComplete="off" />
            </div>

            <div className="form-group">
              <label htmlFor="login-business-phone">Business Phone <span className="required">*</span></label>
              <input type="tel" id="login-business-phone" required autoComplete="off" />
            </div>

            <button type="submit" className="btn btn-primary btn-save">Login</button>
          </form>
        </div>
      </div>

      {/* New Measurement Screen */}
      <div id="new-measurement-screen" className="screen">
        <div className="container">
          <div className="screen-header">
            <button id="back-from-new-btn" className="btn-back">← Back</button>
            <h2>New Measurement</h2>
          </div>
          
          <form id="measurement-form" className="measurement-form-container">
            <div className="form-section-card">
              <h3 className="form-section-title">Client</h3>
              <div className="form-section-content">
                <div className="form-group">
                  <label htmlFor="client-name">Client Name <span className="required">*</span></label>
                  <input type="text" id="client-name" required autoComplete="off" />
                </div>

                <div className="form-group">
                  <label htmlFor="phone-number">Phone Number</label>
                  <input type="tel" id="phone-number" autoComplete="off" />
                </div>

                <div className="form-group">
                  <label htmlFor="client-sex">Sex <span className="required">*</span></label>
                  <select id="client-sex" required>
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section-card">
              <h3 className="form-section-title">Garment</h3>
              <div className="form-section-content">
                <div className="form-group">
                  <label htmlFor="garment-type">Garment Type</label>
                  <select id="garment-type">
                    <option value="">Select garment type</option>
                  </select>
                </div>

                <div className="form-group" id="custom-garment-group" style={{ display: 'none' }}>
                  <label htmlFor="custom-garment-name">Custom Garment Name <span className="required">*</span></label>
                  <input type="text" id="custom-garment-name" autoComplete="off" placeholder="e.g., Agbada, Jacket, etc." />
                </div>
              </div>
            </div>

            <div className="measurements-section">
              <h3 className="measurements-section-title">Measurements</h3>
              <div className="measurements-grid">
              <div className="form-group">
                <label htmlFor="shoulder">Shoulder</label>
                <input type="number" id="shoulder" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="chest">Chest</label>
                <input type="number" id="chest" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="waist">Waist</label>
                <input type="number" id="waist" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="sleeve">Sleeve</label>
                <input type="number" id="sleeve" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="length">Length</label>
                <input type="number" id="length" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="neck">Neck</label>
                <input type="number" id="neck" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="hip">Hip</label>
                <input type="number" id="hip" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="inseam">Inseam</label>
                <input type="number" id="inseam" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="thigh">Thigh</label>
                <input type="number" id="thigh" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="seat">Seat</label>
                <input type="number" id="seat" step="0.1" min="0" placeholder="0.0" autoComplete="off" />
              </div>

              {/* Custom fields will be inserted here inline */}
              <div id="custom-fields-container"></div>

              {/* Add Custom Field Button (hidden by default, shown after garment type selection) */}
              <div className="form-group add-custom-field-wrapper" id="add-custom-field-wrapper" style={{ display: 'none' }}>
                <button type="button" id="add-custom-field-btn" className="btn-add-field-inline">+ Add Measurement Field</button>
              </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes / Remarks</label>
              <textarea id="notes" rows={3} autoComplete="off"></textarea>
            </div>

            <button type="submit" className="btn btn-primary btn-save">Save Measurement</button>
          </form>
        </div>
      </div>

      {/* Search Screen */}
      <div id="search-screen" className="screen">
        <div className="container">
          <div className="screen-header">
            <button id="back-from-search-btn" className="btn-back">← Back</button>
            <h2>Search Measurements</h2>
          </div>

          <div className="search-box">
            <input type="text" id="search-input" placeholder="Search by name or phone number..." autoComplete="off" />
          </div>

          <div id="search-results" className="search-results"></div>
        </div>
      </div>

      {/* Clients Screen */}
      <div id="clients-screen" className="screen">
        <div className="container">
          <div className="screen-header">
            <button id="back-from-clients-btn" className="btn-back">← Back</button>
            <h2 id="clients-count"></h2>
          </div>

          <div id="clients-list" className="clients-list"></div>
        </div>
      </div>

      {/* Client Details Screen */}
      <div id="client-details-screen" className="screen">
        <div className="container">
          <div className="screen-header client-details-header">
            <button id="back-from-details-btn" className="btn-back">← Back</button>
            <h2 id="client-details-name"></h2>
            <div className="client-menu-wrapper">
              <button id="client-menu-btn" className="btn-menu" aria-label="Client actions">⋮</button>
              <div id="client-menu-dropdown" className="menu-dropdown">
                <button id="edit-client-btn" className="menu-item">Edit Client</button>
                <button id="delete-client-btn" className="menu-item menu-item-danger">Delete Client</button>
              </div>
            </div>
          </div>

          <div id="client-details-content" className="client-details"></div>
          
          <button id="add-measurement-from-details-btn" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Add Measurement
          </button>
        </div>
      </div>

      {/* Edit Client Screen */}
      <div id="edit-client-screen" className="screen">
        <div className="container">
          <div className="screen-header">
            <button id="back-from-edit-client-btn" className="btn-back">← Back</button>
            <h2>Edit Client</h2>
          </div>
          
          <form id="edit-client-form">
            <div className="form-group">
              <label htmlFor="edit-client-name">Client Name <span className="required">*</span></label>
              <input type="text" id="edit-client-name" required autoComplete="off" />
            </div>

            <div className="form-group">
              <label htmlFor="edit-client-phone">Phone Number</label>
              <input type="tel" id="edit-client-phone" autoComplete="off" />
            </div>

            <div className="form-group">
              <label htmlFor="edit-client-sex">Sex <span className="required">*</span></label>
              <select id="edit-client-sex" required>
                <option value="">Select sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-save">Save Changes</button>
          </form>
        </div>
      </div>

      {/* Measurement Detail View Screen */}
      <div id="measurement-detail-screen" className="screen">
        <div className="container">
          <div className="screen-header">
            <button id="back-from-measurement-detail-btn" className="btn-back">← Back</button>
            <h2>Measurement Details</h2>
          </div>

          <button id="view-client-from-measurement-btn" className="btn btn-secondary" style={{ marginBottom: '24px' }}>
            View Client
          </button>

          <div id="measurement-detail-content" className="client-details"></div>
        </div>
      </div>

      <Script src="/app.js" strategy="afterInteractive" />
    </>
  )
}

