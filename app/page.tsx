'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import MobileFooter from './components/MobileFooter'

export default function Home() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    // Initialize theme early (before app.js loads) to prevent flash
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('measurement_vault_theme') || 'dark') as 'dark' | 'light'
      setThemeState(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)

      // Initialize Supabase client globally for app.js to use
      // Only create one instance to avoid multiple GoTrueClient warnings
      if (!(window as any).supabaseClient && !(window as any).supabaseInitInProgress) {
        (window as any).supabaseInitInProgress = true;
        (async () => {
          try {
            const { createClient } = await import('@supabase/supabase-js')
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            if (supabaseUrl && supabaseKey) {
              // Only create if it doesn't exist (prevent multiple instances)
              if (!(window as any).supabaseClient) {
                (window as any).supabaseClient = createClient(supabaseUrl, supabaseKey, {
                  auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                  }
                })
              console.log('Supabase client initialized successfully')
              }
            } else {
              console.error('Supabase environment variables not set:', {
                url: !!supabaseUrl,
                key: !!supabaseKey
              })
              console.error('Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
            }
          } catch (err) {
            console.error('Failed to initialize Supabase:', err)
          } finally {
            (window as any).supabaseInitInProgress = false;
          }
        })()
      } else if ((window as any).supabaseClient) {
        console.log('Supabase client already initialized')
      }

      // Register Service Worker for PWA
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
              console.log('[PWA] Service Worker registered successfully:', registration.scope)
            })
            .catch((error) => {
              console.warn('[PWA] Service Worker registration failed:', error)
            })
        })
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
      {/* Loading Screen - Shows until auth resolves */}
      <div id="app-loading-screen" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'inherit'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--bg-card)',
            borderTopColor: 'var(--accent-yellow)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <div>Loading...</div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Login Screen */}
      <div id="login-screen" className="screen auth-screen-wrapper" style={{ display: 'none' }}>
        {/* Top Image Header Section - 30vh */}
        <div className="auth-header-image"></div>
        
        {/* Bottom Auth Card Container - 70vh */}
        <div className="auth-card-container">
          <div className="auth-card-content">
            {/* App Logo */}
            <div className="auth-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
              </svg>
            </div>
            
            {/* App Name */}
            <h1 className="auth-app-name">Tailor's Vault</h1>
            
            {/* Auth Toggle Tabs */}
            <div className="auth-tabs">
              <button className="auth-tab active" data-tab="login" onClick={() => { const event = new Event('click'); document.getElementById('go-to-login-link')?.dispatchEvent(event); }}>
                Login
              </button>
              <button className="auth-tab" data-tab="signup" onClick={() => { const event = new Event('click'); document.getElementById('go-to-signup-link')?.dispatchEvent(event); }}>
                Create Account
              </button>
            </div>
            
            {/* Login Form */}
            <div className="auth-form-wrapper" id="login-form-wrapper">
              <form id="login-form">
                <div className="form-group">
                  <label htmlFor="login-email">Email <span className="required">*</span></label>
                  <input type="email" id="login-email" required autoComplete="email" placeholder="your@email.com" />
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">Password <span className="required">*</span></label>
                  <input type="password" id="login-password" required autoComplete="current-password" placeholder="Enter your password" />
                </div>

                <button type="submit" className="btn btn-primary btn-save" style={{ width: '100%', marginTop: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  Login
                </button>
              </form>
              <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <a href="#" id="forgot-password-link" style={{ color: 'var(--accent-yellow)', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot Password?
                </a>
              </p>
              <p style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <a href="#" id="go-to-signup-link" style={{ color: 'var(--accent-yellow)', textDecoration: 'none', fontWeight: 500 }}>
                  Create account
                </a>
              </p>
              <div id="login-error" style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', color: '#ef4444', fontSize: '14px', display: 'none' }}></div>
              
              {/* Forgot Password Form */}
              <div id="forgot-password-form" style={{ marginTop: '24px', display: 'none' }}>
                <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600 }}>Reset Password</h2>
                <p className="settings-info" style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form id="forgot-password-submit-form">
                  <div className="form-group">
                    <label htmlFor="forgot-password-email">Email <span className="required">*</span></label>
                    <input 
                      type="email" 
                      id="forgot-password-email" 
                      required 
                      autoComplete="email" 
                      placeholder="your@email.com"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-save" style={{ width: '100%', marginTop: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Send Reset Link
                  </button>
                </form>
                <button 
                  id="cancel-forgot-password-btn" 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  Cancel
                </button>
                <div id="forgot-password-error" className="form-error-message" style={{ display: 'none' }}></div>
                <div id="forgot-password-success" className="form-success-message" style={{ display: 'none' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Up Screen */}
      <div id="signup-screen" className="screen auth-screen-wrapper" style={{ display: 'none' }}>
        {/* Top Image Header Section - 30vh */}
        <div className="auth-header-image"></div>
        
        {/* Bottom Auth Card Container - 70vh */}
        <div className="auth-card-container">
          <div className="auth-card-content">
            {/* App Logo */}
            <div className="auth-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
              </svg>
            </div>
            
            {/* App Name */}
            <h1 className="auth-app-name">Tailor's Vault</h1>
            
            {/* Auth Toggle Tabs */}
            <div className="auth-tabs">
              <button className="auth-tab" data-tab="login" onClick={() => { const event = new Event('click'); document.getElementById('go-to-login-link')?.dispatchEvent(event); }}>
                Login
              </button>
              <button className="auth-tab active" data-tab="signup" onClick={() => { const event = new Event('click'); document.getElementById('go-to-signup-link')?.dispatchEvent(event); }}>
                Create Account
              </button>
            </div>
            
            {/* Signup Form */}
            <div className="auth-form-wrapper" id="signup-form-wrapper">
              <form id="signup-form">
                <div className="form-group">
                  <label htmlFor="signup-email">Email <span className="required">*</span></label>
                  <input type="email" id="signup-email" required autoComplete="email" placeholder="your@email.com" />
                </div>

                <div className="form-group">
                  <label htmlFor="signup-password">Password <span className="required">*</span></label>
                  <input type="password" id="signup-password" required autoComplete="new-password" placeholder="Create a password" />
                  <small className="form-helper-text">Minimum 6 characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="signup-confirm-password">Confirm Password <span className="required">*</span></label>
                  <input type="password" id="signup-confirm-password" required autoComplete="new-password" placeholder="Confirm your password" />
                </div>

                <button type="submit" className="btn btn-primary btn-save" style={{ width: '100%', marginTop: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  Create Account
                </button>
              </form>
              <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <a href="#" id="go-to-login-link" style={{ color: 'var(--accent-yellow)', textDecoration: 'none', fontWeight: 500 }}>
                  Login
                </a>
              </p>
              <div id="signup-error" style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', color: '#ef4444', fontSize: '14px', display: 'none' }}></div>
              <div id="signup-success" style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', color: '#10b981', fontSize: '14px', display: 'none' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Setup Screen */}
      <div id="business-setup-screen" className="screen" style={{ display: 'none' }}>
        <div className="business-setup-container">
          <div className="business-setup-wrapper">
            <div className="business-setup-logo">
              {/* Replace this SVG with your logo image: <img src="/logo.png" alt="Tailor's Vault Logo" /> */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="business-setup-title">Tailor's Vault</h1>
            <div className="business-setup-card">
              <p className="business-setup-description">Register your business to get started</p>
          <form id="business-setup-form">
            <div className="form-group">
              <label htmlFor="business-name">Business Name <span className="required">*</span></label>
              <input type="text" id="business-name" required autoComplete="off" placeholder="e.g., Elite Tailors" />
            </div>

            <div className="form-group">
                  <label htmlFor="business-email">Business Email <span className="optional">(Optional)</span></label>
                  <input type="email" id="business-email" autoComplete="off" placeholder="e.g., info@elitetailors.com" />
                  <small className="form-helper-text">Optional: For account recovery and multi-device access</small>
            </div>

            <div className="form-group">
              <label htmlFor="business-phone">Business Phone <span className="required">*</span></label>
              <input type="tel" id="business-phone" required autoComplete="off" placeholder="e.g., +234 800 000 0000" />
            </div>

                <button type="submit" className="btn btn-primary btn-save">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              Continue
            </button>
          </form>
            </div>
          </div>
        </div>
      </div>

      {/* Home Screen */}
      <div id="home-screen" className="screen" style={{ display: 'none' }}>
        <nav className="top-navbar">
          <div className="navbar-content">
            <h1 className="navbar-business-name" id="business-header-name">Tailors Vault</h1>
            <div className="navbar-actions">
              <button 
                id="theme-toggle-btn" 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button id="settings-btn" className="btn-settings" title="Settings" aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          {/* Dashboard Welcome Section */}
          <div className="dashboard-welcome">
            <h5 className="dashboard-greeting">Hi, <span id="dashboard-business-name">Tailors Vault</span> 👋</h5>
            <h3 className="dashboard-subtext">What are you measuring today?</h3>
          </div>

          {/* Dashboard Action Cards */}
          <div className="dashboard-action-grid">
            {/* Left Column - Primary Action (Large Card) */}
            <button id="new-measurement-btn" className="dashboard-action-card dashboard-action-card-primary">
              <div className="dashboard-card-top">
                <div className="dashboard-icon-container dashboard-icon-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <svg className="dashboard-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
              <div className="dashboard-card-bottom">
                <h4 className="dashboard-card-label">New Measurement</h4>
              </div>
            </button>

            {/* Right Column - Secondary Actions (Stacked Cards) */}
            <div className="dashboard-action-stack">
              <button id="search-measurements-btn" className="dashboard-action-card dashboard-action-card-secondary">
                <div className="dashboard-card-top">
                  <div className="dashboard-icon-container dashboard-icon-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  <svg className="dashboard-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
                <div className="dashboard-card-bottom">
                  <h4 className="dashboard-card-label">Search Measurement</h4>
                </div>
            </button>
              <button id="clients-btn" className="dashboard-action-card dashboard-action-card-secondary">
                <div className="dashboard-card-top">
                  <div className="dashboard-icon-container dashboard-icon-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <svg className="dashboard-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
                <div className="dashboard-card-bottom">
                  <h4 className="dashboard-card-label">Clients</h4>
                </div>
            </button>
            </div>
          </div>
          
          <div className="recent-section">
            <div className="recent-measurements-card">
              <div className="recent-measurements-header">
            <h3>Recent Measurements</h3>
                <div id="recent-measurements-control"></div>
              </div>
              <div id="recent-measurements" className="recent-measurements-list"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Screen */}
      <div id="settings-screen" className="screen" style={{ display: 'none' }}>
        <nav className="top-navbar">
          <div className="navbar-content">
            <button id="back-from-settings-btn" className="navbar-back-btn" title="Back" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="navbar-business-name">Tailors Vault</h1>
            <div className="navbar-actions">
              <button 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button className="btn-settings" title="Settings" aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="screen-header">
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
              <h3>Exports</h3>
              <p className="settings-info">
                Download measurements for reporting or backup. Uses your current business and clients.
              </p>
              <button 
                id="download-all-measurements-btn" 
                className="btn btn-secondary" 
                style={{ marginTop: '12px' }}
              >
                Download All Clients&apos; Measurements
              </button>
            </div>

            <div className="settings-section" style={{ marginTop: '40px' }}>
              <h3>Email Linking</h3>
              <p className="settings-info">Link your email to sync data across devices and enable account recovery.</p>
              <div id="email-linking-status" className="email-linking-status"></div>
              <div id="email-linking-form" className="email-linking-form" style={{ display: 'none' }}>
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label htmlFor="link-email-input">Email Address</label>
                  <input 
                    type="email" 
                    id="link-email-input" 
                    autoComplete="email" 
                    placeholder="your@email.com"
                    style={{ marginTop: '8px' }}
                  />
                </div>
                <button id="send-verification-btn" className="btn btn-primary" style={{ marginTop: '12px' }}>
                  Send Verification Link
                </button>
              </div>
              <div id="email-verification-pending" className="email-verification-pending" style={{ display: 'none' }}>
                <p className="settings-info" style={{ marginBottom: '12px' }}>
                  Verification email sent! Check your inbox and click the link to verify.
                </p>
                <button id="resend-verification-btn" className="btn btn-secondary" style={{ marginRight: '8px' }}>
                  Resend Email
                </button>
                <button id="cancel-verification-btn" className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>

            <div className="settings-section" style={{ marginTop: '40px' }}>
              <h3>Change Password</h3>
              <p className="settings-info">Update your account password to keep your account secure.</p>
              <form id="change-password-form" style={{ marginTop: '16px' }}>
                <div className="form-section-card">
                  <div className="form-section-content">
                    <div className="form-group">
                      <label htmlFor="current-password">Current Password <span className="required">*</span></label>
                      <input 
                        type="password" 
                        id="current-password" 
                        required 
                        autoComplete="current-password" 
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-password">New Password <span className="required">*</span></label>
                      <input 
                        type="password" 
                        id="new-password" 
                        required 
                        autoComplete="new-password" 
                        placeholder="Enter your new password"
                        minLength={6}
                      />
                      <small className="form-helper-text">Minimum 6 characters</small>
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirm-new-password">Confirm New Password <span className="required">*</span></label>
                      <input 
                        type="password" 
                        id="confirm-new-password" 
                        required 
                        autoComplete="new-password" 
                        placeholder="Confirm your new password"
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-save">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  Update Password
                </button>
              </form>
              <div id="change-password-error" className="form-error-message" style={{ display: 'none' }}></div>
              <div id="change-password-success" className="form-success-message" style={{ display: 'none' }}></div>
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
        <nav className="top-navbar">
          <div className="navbar-content">
            <button id="back-from-edit-business-btn" className="navbar-back-btn" title="Back" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="navbar-business-name">Tailors Vault</h1>
            <div className="navbar-actions">
              <button 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button className="btn-settings" title="Settings" aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="screen-header">
            <h2>Edit Business</h2>
          </div>
          
          <form id="edit-business-form">
            <div className="form-group">
              <label htmlFor="edit-business-name">Business Name <span className="required">*</span></label>
              <input type="text" id="edit-business-name" required autoComplete="off" />
            </div>

            <div className="form-group">
              <label htmlFor="edit-business-email">Business Email <span className="optional">(Optional)</span></label>
              <input type="email" id="edit-business-email" autoComplete="off" />
              <small className="form-helper-text">Optional: For account recovery and multi-device access</small>
            </div>

            <div className="form-group">
              <label htmlFor="edit-business-phone">Business Phone <span className="required">*</span></label>
              <input type="tel" id="edit-business-phone" required autoComplete="off" />
            </div>

            <button type="submit" className="btn btn-primary btn-save">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Save Changes
            </button>
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
              <label htmlFor="login-business-email">Business Email <span className="optional">(Optional)</span></label>
              <input type="email" id="login-business-email" autoComplete="off" />
              <small className="form-helper-text">Leave empty if you didn't set an email</small>
            </div>

            <div className="form-group">
              <label htmlFor="login-business-phone">Business Phone <span className="required">*</span></label>
              <input type="tel" id="login-business-phone" required autoComplete="off" />
            </div>

            <button type="submit" className="btn btn-primary btn-save">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Login
            </button>
          </form>
        </div>
      </div>

      {/* New Measurement Screen */}
      <div id="new-measurement-screen" className="screen">
        <nav className="top-navbar">
          <div className="navbar-content">
            <button id="back-from-new-btn" className="navbar-back-btn" title="Back" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="navbar-business-name">Tailors Vault</h1>
            <div className="navbar-actions">
              <button 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button className="btn-settings" title="Settings" aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="screen-header">
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

            <button type="submit" className="btn btn-primary btn-save">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Save Measurement
            </button>
          </form>
        </div>
      </div>

      {/* Search Screen */}
      <div id="search-screen" className="screen">
        <nav className="top-navbar">
          <div className="navbar-content">
            <button id="back-from-search-btn" className="navbar-back-btn" title="Back" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="navbar-business-name">Tailors Vault</h1>
            <div className="navbar-actions">
              <button 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button className="btn-settings" title="Settings" aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="screen-header">
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
        <nav className="top-navbar">
          <div className="navbar-content">
            <button id="back-from-clients-btn" className="navbar-back-btn" title="Back" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="navbar-business-name">Tailors Vault</h1>
            <div className="navbar-actions">
              <button 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button className="btn-settings" title="Settings" aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="screen-header">
            <h2 id="clients-count"></h2>
          </div>

          <div id="clients-list" className="clients-list"></div>
        </div>
      </div>

      {/* Client Details Screen */}
      <div id="client-details-screen" className="screen">
        <nav className="top-navbar">
          <div className="navbar-content">
            <button id="back-from-details-btn" className="navbar-back-btn" title="Back" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="navbar-business-name">Tailors Vault</h1>
            <div className="navbar-actions">
              <button 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button className="btn-settings" title="Settings" aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="screen-header client-details-header">
            <h2 id="client-details-name"></h2>
            <div className="client-menu-wrapper">
              <button id="client-menu-btn" className="btn-menu" aria-label="Client actions">⋮</button>
              <div id="client-menu-dropdown" className="menu-dropdown">
                <button id="edit-client-btn" className="menu-item">Edit Client</button>
                <button id="add-measurement-menu-btn" className="menu-item">Add Measurement</button>
                <button id="download-measurements-menu-btn" className="menu-item">Download Measurements</button>
                <button id="delete-client-btn" className="menu-item menu-item-danger">Delete Client</button>
              </div>
            </div>
          </div>

          <div id="client-details-content" className="client-details"></div>
          
          <button id="add-measurement-from-details-btn" className="btn btn-primary" style={{ marginTop: '16px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Measurement
          </button>
          
          <button 
            id="download-client-measurements-btn" 
            className="btn btn-secondary" 
            style={{ marginTop: '12px', width: '100%' }}
          >
            Download Measurements
          </button>
        </div>
      </div>

      {/* Edit Client Screen */}
      <div id="edit-client-screen" className="screen">
        <nav className="top-navbar">
          <div className="navbar-content">
            <button id="back-from-edit-client-btn" className="navbar-back-btn" title="Back" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="navbar-business-name">Tailors Vault</h1>
            <div className="navbar-actions">
              <button 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button className="btn-settings" title="Settings" aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="screen-header">
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

            <button type="submit" className="btn btn-primary btn-save">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Save Changes
            </button>
          </form>
        </div>
      </div>

      {/* Measurement Detail View Screen */}
      <div id="measurement-detail-screen" className="screen">
        <nav className="top-navbar">
          <div className="navbar-content">
            <button id="back-from-measurement-detail-btn" className="navbar-back-btn" title="Back" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="navbar-business-name">Tailors Vault</h1>
            <div className="navbar-actions">
              <button 
                className="btn-theme-toggle" 
                title="Toggle theme" 
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button className="btn-settings" title="Settings" aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="screen-header">
            <h2>Measurement Details</h2>
          </div>

          <button id="view-client-from-measurement-btn" className="btn btn-secondary" style={{ marginBottom: '24px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            View Client
          </button>

          <div id="measurement-detail-content" className="client-details"></div>
        </div>
      </div>

      <Script src="/indexeddb.js" strategy="beforeInteractive" />
      <Script src="/sync-manager.js" strategy="beforeInteractive" />
      <Script src="/reconciliation.js" strategy="beforeInteractive" />
      <Script src="/immediate-sync.js" strategy="beforeInteractive" />
      <Script src="/app.js" strategy="afterInteractive" />
      
      {/* Mobile Footer Navigation */}
      <MobileFooter />
    </>
  )
}

