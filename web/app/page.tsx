'use client'
import FlexColumn from '@/components/FlexColumn'
import FlexRow from '@/components/FlexRow'
import analyze, { Comment } from '@metuuu/filter-youtube-comments'
import {
  RedFlagConfigTemplates,
  RedFlagsConfig,
} from '@metuuu/filter-youtube-comments/src/comment-analysis/RedFlags'
import {
  Alert,
  Avatar,
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import CommentList from './components/CommentList'
import RedFlagConfigSection from './components/RedFlagConfigSection'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import styles from './page.module.css'
import { errorToMessage } from './utils/error-utils'

const DEFAULT_RED_FLAG_CONFIG = RedFlagConfigTemplates.CryptoBots

export default function Home() {
  'use memo'
  const {
    user,
    isAuthenticated,
    isConfigured,
    login,
    logout,
    isLoading: isSigningIn,
    error: authError,
    clientId,
    updateClientId,
  } = useGoogleAuth()

  const [redFlagConfig, setRedFlagConfig] = useState<RedFlagsConfig>(() => {
    // Try to load from localStorage on initial mount
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('redFlagsConfig')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (
            parsed &&
            typeof parsed === 'object' &&
            'name' in parsed &&
            'flags' in parsed &&
            Array.isArray(parsed.flags)
          ) {
            return { name: parsed.name, flags: parsed.flags }
          } else if (Array.isArray(parsed)) {
            // Legacy format: just an array of flags
            return { name: 'Default', flags: parsed }
          }
        } catch (err) {
          console.error('Failed to load red flag config from localStorage:', err)
          console.log('Falling back to default config')
        }
      }
    }
    return DEFAULT_RED_FLAG_CONFIG
  })
  const [videoId, setVideoId] = useState('')
  const [youtubeApiKey, setYouTubeApiKey] = useState(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<any>()
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [commentQueryOrder, setCommentQueryOrder] = useState<'time' | 'relevance'>('relevance')
  const [maxTopLevelComments, setMaxTopLevelComments] = useState<number | undefined>(500)
  const [maxCommentsInThread, setMaxCommentsInThread] = useState<number | undefined>(100)

  const [comments, setComments] = useState<Comment[]>()

  const onAnalyzeClicked = () => {
    setAnalysisError(undefined)
    setIsAnalyzing(true)

    const authParams = user?.accessToken
      ? { youtubeAccessToken: user.accessToken }
      : { youtubeApiKey }

    analyze({
      ...authParams,
      youtubeVideoId: videoId,
      redFlags: redFlagConfig.flags,
      redFlagWeightThreshold: 1,
      commentQueryOrder,
      maxTopLevelComments,
      maxCommentsInThread,
    } as any)
      .then((result) => {
        const analyzedComments = Object.values<Comment[]>(result).flatMap((o) => o)
        if (!analyzedComments.length) throw new Error('No comments found with red flags')
        setComments(analyzedComments)
        setIsAnalyzed(true)
      })
      .catch((err) => setAnalysisError(err))
      .finally(() => setIsAnalyzing(false))
  }

  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
        maxHeight: '100vh',
        flexDirection: 'column',
        backgroundColor: '#111',
      }}>
      {!isAnalyzed && (
        <FlexColumn justifyContent="center" style={{ height: '100%' }}>
          <Card
            elevation={2}
            style={{
              padding: 32,
              maxWidth: 512,
              width: '100%',
              marginBottom: 64,
              justifySelf: 'center',
            }}>
            <FlexColumn gap={16}>
              <Typography variant="h4" color="primary" style={{ marginBottom: 16 }}>
                YouTube scam comment cleaner
              </Typography>

              {/* Authentication Section */}
              <FlexColumn gap={16}>
                <Typography variant="h6" color="textPrimary">
                  Authentication
                </Typography>
                <Alert severity="info">
                  Authenticate via API key or sign in with Google. If you want to be able to remove
                  comments from your videos, you must sign in with Google.
                </Alert>

                {!isAuthenticated && (
                  <TextField
                    className={styles.passwordInput}
                    label="YouTube API Key"
                    variant="outlined"
                    color="secondary"
                    value={youtubeApiKey}
                    onChange={(e) => setYouTubeApiKey(e.target.value)}
                    autoComplete="off"
                  />
                )}

                <TextField
                  className={styles.passwordInput}
                  label="Google OAuth Client ID (For sign in with Google)"
                  variant="outlined"
                  color="secondary"
                  value={clientId}
                  onChange={(e) => updateClientId(e.target.value.trim())}
                  autoComplete="off"
                />

                {isConfigured && (
                  <FlexColumn gap={8}>
                    {!isAuthenticated ? (
                      <>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={login}
                          disabled={isSigningIn}>
                          {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                        </Button>
                      </>
                    ) : (
                      <FlexRow
                        gap={8}
                        style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                        <FlexRow gap={8} style={{ alignItems: 'center' }}>
                          <Avatar
                            src={user?.picture}
                            alt={user?.name}
                            sx={{ width: 32, height: 32 }}
                          />
                          <Typography variant="body2" color="textSecondary">
                            {user?.email}
                          </Typography>
                        </FlexRow>
                        <Button size="small" variant="outlined" color="secondary" onClick={logout}>
                          Sign out
                        </Button>
                      </FlexRow>
                    )}
                    {authError && <Alert severity="error">{authError}</Alert>}
                  </FlexColumn>
                )}
              </FlexColumn>

              {/* Video Section */}
              <FlexColumn gap={16} style={{ marginTop: 16 }}>
                <Typography variant="h6" color="textPrimary">
                  Video
                </Typography>
                <TextField
                  label="YouTube Video ID"
                  variant="outlined"
                  color="secondary"
                  value={videoId}
                  type="text"
                  autoComplete="off"
                  required
                  onChange={(e) => setVideoId(e.target.value.trim())}
                />

                <FormControl color="secondary">
                  <InputLabel>Comment query order</InputLabel>
                  <Select
                    value={commentQueryOrder}
                    label="Comment query order"
                    onChange={(e) => setCommentQueryOrder(e.target.value as any)}>
                    <MenuItem value="relevance">Relevance</MenuItem>
                    <MenuItem value="time">Time</MenuItem>
                  </Select>
                </FormControl>
                <FlexRow justifyContent="space-between" gap={16}>
                  <TextField
                    fullWidth
                    label="Max comments"
                    variant="outlined"
                    color="secondary"
                    value={maxTopLevelComments}
                    type="number"
                    onChange={(e) =>
                      setMaxTopLevelComments(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                  />
                  <TextField
                    fullWidth
                    label="Max comments per thread"
                    variant="outlined"
                    color="secondary"
                    value={maxCommentsInThread}
                    type="number"
                    onChange={(e) =>
                      setMaxCommentsInThread(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                  />
                </FlexRow>
              </FlexColumn>

              {/* Red Flags Configuration Section */}
              <FlexColumn gap={16} style={{ marginTop: 16 }}>
                <Typography variant="h6" color="textPrimary">
                  Red Flags Configuration
                </Typography>
                <RedFlagConfigSection
                  redFlagConfig={redFlagConfig}
                  setRedFlagConfig={setRedFlagConfig}
                  isAnalyzing={isAnalyzing}
                  defaultConfig={DEFAULT_RED_FLAG_CONFIG}
                />
              </FlexColumn>

              <FlexColumn gap={16} style={{ marginTop: 16 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={isAnalyzing || (!isAuthenticated && !youtubeApiKey) || !videoId}
                  onClick={() => onAnalyzeClicked()}>
                  Analyze comments
                </Button>
                {analysisError && <Alert severity="error">{errorToMessage(analysisError)}</Alert>}
              </FlexColumn>
            </FlexColumn>
          </Card>
        </FlexColumn>
      )}

      {isAnalyzed && (
        <FlexColumn
          gap={32}
          style={{
            maxWidth: 1024,
            width: '100%',
            paddingTop: 32,
            overflow: 'hidden',
          }}>
          {/* <FlexRow>
          <Typography variant="h4" color="textPrimary">
            Comments
          </Typography>
          <Typography variant="h5" color="textPrimary" style={{ alignSelf: 'center' }}>
            &nbsp;({comments.length})
          </Typography>
        </FlexRow> */}

          <CommentList
            comments={comments!}
            accessToken={user?.accessToken}
            isAuthenticated={isAuthenticated}
          />
        </FlexColumn>
      )}
    </main>
  )
}
