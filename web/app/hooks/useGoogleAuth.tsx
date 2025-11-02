'use client'
import { useEffect, useState } from 'react'

interface GoogleAuthUser {
  name: string
  email: string
  picture: string
  accessToken: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token: string; error?: string }) => void
          }) => {
            requestAccessToken: () => void
          }
          revoke: (token: string, callback: () => void) => void
        }
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: {
              credential: string
              select_by?: string
              clientId?: string
            }) => void
          }) => void
          prompt: () => void
        }
      }
    }
  }
}

export function useGoogleAuth() {
  const [user, setUser] = useState<GoogleAuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string>('')

  useEffect(() => {
    // Load stored user and client ID from localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('googleUser')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          console.error('Failed to parse stored user', e)
        }
      }

      const storedClientId = localStorage.getItem('googleClientId')
      if (storedClientId) {
        setClientId(storedClientId)
      }
    }
  }, [])

  const login = async () => {
    if (!clientId) {
      setError('Google Client ID not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Load Google Identity Services library
      if (!window.google) {
        await loadGoogleScript()
      }

      // Initialize token client for OAuth2
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:
          'https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response) => {
          if (response.error) {
            setError(response.error)
            setIsLoading(false)
            return
          }

          try {
            // Get user info
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            })

            if (!userInfoResponse.ok) {
              throw new Error('Failed to fetch user info')
            }

            const userInfo = await userInfoResponse.json()

            const googleUser: GoogleAuthUser = {
              name: userInfo.name,
              email: userInfo.email,
              picture: userInfo.picture,
              accessToken: response.access_token,
            }

            setUser(googleUser)
            localStorage.setItem('googleUser', JSON.stringify(googleUser))
            setIsLoading(false)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get user info')
            setIsLoading(false)
          }
        },
      })

      // Request access token
      tokenClient.requestAccessToken()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Google Sign-In')
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (user?.accessToken && window.google) {
      window.google.accounts.oauth2.revoke(user.accessToken, () => {
        console.log('Token revoked')
      })
    }
    setUser(null)
    localStorage.removeItem('googleUser')
  }

  const updateClientId = (newClientId: string) => {
    setClientId(newClientId)
    if (typeof window !== 'undefined') {
      if (newClientId) {
        localStorage.setItem('googleClientId', newClientId)
      } else {
        localStorage.removeItem('googleClientId')
      }
    }
  }

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    clientId,
    updateClientId,
    isAuthenticated: !!user,
    isConfigured: !!clientId,
  }
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}
