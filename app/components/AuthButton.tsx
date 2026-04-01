"use client";
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'

export default function AuthButton() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      setDropdownOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div style={{
        background: "#161B22",
        border: "1px solid #30363D",
        borderRadius: 6,
        padding: "6px 14px",
        fontSize: 13,
        color: "#8B949E"
      }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    // Show login/signup buttons for unauthenticated users
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Link 
          href="/auth/login"
          style={{
            background: "transparent",
            color: "#F0F6FC",
            border: "1px solid #30363D",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#30363D"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
          }}
        >
          Sign In
        </Link>
        <Link 
          href="/auth/signup"
          style={{
            background: "#238636",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2EA043"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#238636"
          }}
        >
          Sign Up
        </Link>
      </div>
    )
  }

  // Show user menu for authenticated users
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          background: "#161B22",
          color: "#F0F6FC",
          border: "1px solid #30363D",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#238636",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 600,
          color: "#FFFFFF"
        }}>
          {user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.email}
        </span>
        <span style={{ fontSize: 10, color: "#8B949E" }}>▼</span>
      </button>

      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setDropdownOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "#161B22",
              border: "1px solid #30363D",
              borderRadius: 8,
              minWidth: 200,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              zIndex: 1000,
            }}
          >
            {/* User Info */}
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid #30363D"
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#F0F6FC" }}>
                {user.email}
              </div>
              <div style={{ fontSize: 12, color: "#8B949E" }}>
                Authenticated
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ padding: "8px 0" }}>
              <Link
                href="/alerts"
                style={{
                  display: "block",
                  padding: "8px 16px",
                  color: "#F0F6FC",
                  textDecoration: "none",
                  fontSize: 14,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#30363D"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
                onClick={() => setDropdownOpen(false)}
              >
                🔔 Price Alerts
              </Link>
              <Link
                href="/portfolio"
                style={{
                  display: "block",
                  padding: "8px 16px",
                  color: "#F0F6FC",
                  textDecoration: "none",
                  fontSize: 14,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#30363D"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
                onClick={() => setDropdownOpen(false)}
              >
                📊 Portfolio
              </Link>
              <div style={{
                height: 1,
                background: "#30363D",
                margin: "8px 0"
              }} />
              <button
                onClick={handleSignOut}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 16px",
                  color: "#F85149",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F85149/10"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}