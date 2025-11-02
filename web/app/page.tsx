'use client'
import FlexColumn from '@/components/FlexColumn'
import FlexRow from '@/components/FlexRow'
import analyze, { Comment } from '@metuuu/filter-youtube-comments'
import RedFlagTemplates, {
  RedFlag,
} from '@metuuu/filter-youtube-comments/src/comment-analysis/RedFlags'
import {
  Alert,
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
import styles from './page.module.css'
import { errorToMessage } from './utils/error-utils'

export default function Home() {
  'use memo'
  const isApiKeyPreconfigured = !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

  const [redFlags, setRedFlags] = useState<RedFlag[]>(Object.values(RedFlagTemplates))
  const [videoId, setVideoId] = useState('')
  const [youtubeApiKey, setYouTubeApiKey] = useState(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<any>()
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [commentQueryOrder, setCommentQueryOrder] = useState<'time' | 'relevance'>('relevance')
  const [maxTopLevelComments, setMaxTopLevelComments] = useState<number | undefined>(500)
  const [maxCommentsInThread, setMaxCommentsInThread] = useState<number | undefined>(100)

  const [comments, setComments] = useState<Comment[]>()

  const onViewConfigurationClicked = () => {
    Object.defineProperty(RegExp.prototype, 'toJSON', {
      value: RegExp.prototype.toString,
    })
    const blob = new Blob([JSON.stringify(redFlags, undefined, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const onAnalyzeClicked = () => {
    if (!videoId) return setAnalysisError(new Error('Please provide a YouTube Video ID'))
    if (!youtubeApiKey) return setAnalysisError(new Error('Please provide a YouTube API Key'))
    setAnalysisError(undefined)
    setIsAnalyzing(true)
    analyze({
      youtubeApiKey,
      youtubeVideoId: videoId,
      redFlags,
      redFlagWeightThreshold: 1,
      commentQueryOrder,
      maxTopLevelComments,
      maxCommentsInThread,
    })
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

              {/* <Typography variant="body1">
                Please provide the YouTube video ID
                {!isApiKeyPreconfigured && ' and API key'}.
              </Typography> */}

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
              {!isApiKeyPreconfigured && (
                <TextField
                  className={styles.passwordInput}
                  label="YouTube API Key"
                  variant="outlined"
                  color="secondary"
                  value={youtubeApiKey}
                  required
                  onChange={(e) => setYouTubeApiKey(e.target.value)}
                  autoComplete="off"
                />
              )}

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

              <FlexColumn>
                {analysisError && <Alert severity="error">{errorToMessage(analysisError)}</Alert>}
                <Button
                  variant="outlined"
                  style={{ marginTop: 16 }}
                  disabled={isAnalyzing}
                  color="secondary"
                  onClick={() => onViewConfigurationClicked()}>
                  View red flags configuration
                </Button>
                <Button
                  variant="contained"
                  style={{ marginTop: 16 }}
                  color="secondary"
                  disabled={isAnalyzing}
                  onClick={() => onAnalyzeClicked()}>
                  Analyze comments
                </Button>
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

          <CommentList comments={comments!} apiKey={youtubeApiKey} />
        </FlexColumn>
      )}
    </main>
  )
}
