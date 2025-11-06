import AlertDialog from '@/components/AlertDialog'
import FlexColumn from '@/components/FlexColumn'
import FlexRow from '@/components/FlexRow'
import PromptDialog from '@/components/PromptDialog'
import { Comment } from '@metuuu/comment-analysis'
import setCommentModerationStatus from '@metuuu/filter-youtube-comments/src/setCommentModerationStatus'
import { IosShare } from '@mui/icons-material'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  List,
  Typography,
} from '@mui/material'
import { useWindowSize } from '@uidotdev/usehooks'
import React, { useEffect, useRef, useState } from 'react'
import useFilters from '../hooks/useFilters'
import { errorToMessage } from '../utils/error-utils'
import CommentListItem from './CommentListItem'

const CommentList = ({
  apiKey,
  comments,
  accessToken,
  isAuthenticated,
}: {
  apiKey: string
  comments: Comment[]
  accessToken?: string
  isAuthenticated: boolean
}) => {
  'use memo'
  // Selection
  const [hiddenComments, setHiddenComments] = useState<Set<string>>(new Set())
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set())
  const handleSelectionToggle = (commentId: string) => {
    setSelectedComments((selected) => {
      const updated = new Set(selected)
      if (updated.has(commentId)) updated.delete(commentId)
      else updated.add(commentId)
      return updated
    })
  }

  const size = useWindowSize()

  // Whitelisting
  const [whitelistedComments, setWhitelistedComments] = useState<Set<string>>(new Set())
  const handleWhitelist = () => {
    const newWhitelisted = new Set(selectedComments)
    whitelistedComments.forEach((id) => newWhitelisted.add(id))
    setWhitelistedComments(newWhitelisted)
    setSelectedComments(new Set())
  }

  // Filtering
  const preFilteredComments = comments.filter(
    ({ id }) => !hiddenComments?.has(id) && !whitelistedComments?.has(id),
  )
  const { filteredComments, disabledRedFlags, components } = useFilters({
    comments: preFilteredComments,
    selectedComments,
  })
  const filteredCommentIds = filteredComments.map(({ id }) => id)

  // Select/Deselect all
  const areAllSelected = selectedComments.size === filteredComments.length
  const toggleSelectAll = () => {
    if (selectedComments.size > 0) setSelectedComments(new Set())
    else setSelectedComments(new Set(filteredComments.map(({ id }) => id)))
  }

  // Deselection on filtering
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedComments(
      new Set(
        Array.from(selectedComments).filter((commentId) => filteredCommentIds.includes(commentId)),
      ),
    )
  }, [filteredCommentIds])

  // Deletion
  const [isModerateCommentsPromptOpen, setIsModerateCommentsPromptOpen] = useState(false)
  const [isHidingComments, setIsHidingComments] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isInvalidAuthAlertOpen, setIsInvalidAuthAlertOpen] = useState(false)

  const handleBanSelectedComments = () => {
    setIsHidingComments(true)
    const commentIdsToModerate = Array.from(selectedComments)

    setCommentModerationStatus({ accessToken, commentIds: commentIdsToModerate })
      .then(() => {
        setHiddenComments((comments) => {
          const updated = new Set(comments)
          commentIdsToModerate.forEach((id) => updated.add(id))
          return updated
        })
        setSelectedComments((comments) => {
          const updated = new Set(comments)
          commentIdsToModerate.forEach((id) => updated.delete(id))
          return updated
        })
      })
      .catch((err) => {
        console.error('Failed to moderate comments', err)
        setErrorMessage(`Failed to ban the comments: ${errorToMessage(err)}`)
      })
      .finally(() => {
        setIsHidingComments(false)
        setIsModerateCommentsPromptOpen(false)
      })
  }

  // Exporting
  const refExportBtnAnchor = useRef<HTMLAnchorElement>(null)
  const onExportSelectedClicked = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          filteredComments
            .filter(({ id }) => selectedComments.has(id))
            // Add disabled property to disabled red flags
            .map((c) => {
              const updated: Comment = { ...c }
              updated.redFlags = updated.redFlags.map((rf) => {
                if (!disabledRedFlags.includes(rf.id)) return rf
                return { ...rf, disabled: true }
              })
              return updated.textOriginal
            }),
          undefined,
          2,
        ),
      )
    refExportBtnAnchor.current?.setAttribute('href', dataStr)
    refExportBtnAnchor.current?.setAttribute('download', 'filtered-comments.json')
    refExportBtnAnchor.current?.click()
  }

  // Render
  return (
    <FlexColumn style={{ overflow: 'hidden' }}>
      <a ref={refExportBtnAnchor} style={{ display: 'none' }} />

      <PromptDialog
        open={isModerateCommentsPromptOpen}
        onClose={() => setIsModerateCommentsPromptOpen(false)}
        variant="destructive"
        title={`Are you sure you want ban "${selectedComments.size}" selected comments by setting moderation status to "rejected" for them? The selected comments won't be visible under your video after this.`}
        proceedButtonText="Ban the comments"
        loading={isHidingComments}
        onProceed={() => handleBanSelectedComments()}
      />
      <AlertDialog
        open={!!errorMessage}
        title="Error"
        text={errorMessage}
        onClose={() => setErrorMessage(undefined)}
      />
      <AlertDialog
        open={isInvalidAuthAlertOpen}
        title="Authentication Required"
        text="You must sign in with Google to moderate comments. Please sign in with Google Account to enable this feature."
        onClose={() => setIsInvalidAuthAlertOpen(false)}
      />

      <Container disableGutters={(size.width || 0) > 1024 + 24}>
        <FlexRow>
          {/* Min weight slider */}
          <Container disableGutters style={{ paddingRight: 36 }}>
            {components.minWeightSlider}
          </Container>

          {/* Action buttons */}
          <FlexRow style={{ marginBottom: (size.width || 0) > 800 ? 0 : 8 }}>
            <FlexRow gap={12}>
              <FlexColumn gap={4}>
                <Button
                  style={{ minHeight: 36 }}
                  variant="contained"
                  color="secondary"
                  disabled={!selectedComments.size}
                  onClick={handleWhitelist}>
                  <Typography variant="body2" fontWeight="bold" style={{ whiteSpace: 'nowrap' }}>
                    Whitelist selected
                  </Typography>
                </Button>
                <Typography color="textPrimary" variant="caption">
                  {whitelistedComments.size} whitelisted
                </Typography>
              </FlexColumn>

              <FlexColumn gap={12}>
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={!selectedComments.size}
                  onClick={() => onExportSelectedClicked()}>
                  <IosShare style={{ paddingRight: 4 }} />
                  <Typography variant="body2" fontWeight="bold" style={{ whiteSpace: 'nowrap' }}>
                    Export selected
                  </Typography>
                </Button>
                <Button
                  variant="contained"
                  disabled={!selectedComments.size}
                  onClick={() => {
                    if (!isAuthenticated || !accessToken) setIsInvalidAuthAlertOpen(true)
                    else setIsModerateCommentsPromptOpen(true)
                  }}>
                  <DeleteIcon style={{ paddingRight: 4 }} />
                  <Typography variant="body2" fontWeight="bold" style={{ whiteSpace: 'nowrap' }}>
                    Ban selected
                  </Typography>
                </Button>
              </FlexColumn>
            </FlexRow>
          </FlexRow>
        </FlexRow>

        {/* Toggle filters */}
        <FlexColumn gap={4}>
          {components.toggleVisibilityList}
          {components.toggleRedFlagsList}
        </FlexColumn>

        {/* Comments count & Select all */}
        <FlexRow
          style={{
            paddingRight: (size.width || 0) > 1024 + 24 ? 66 : 66 - 24,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Typography color="textPrimary" fontWeight="bold">
            {filteredComments.length === preFilteredComments.length
              ? `Comments: ${filteredComments.length}`
              : `Comments: ${filteredComments.length} (${preFilteredComments.length})`}
          </Typography>
          <div>
            <FormControlLabel
              labelPlacement="start"
              disabled={!filteredComments.length}
              label={
                <Typography color="textPrimary" fontWeight="bold">
                  {(!filteredComments.length && 'No comments') ||
                    (areAllSelected && 'Selected all') ||
                    (selectedComments.size > 0 && `Selected (${selectedComments.size})`) ||
                    'Select all'}
                </Typography>
              }
              control={
                <Checkbox
                  onChange={toggleSelectAll}
                  checked={areAllSelected}
                  indeterminate={!areAllSelected && selectedComments.size > 0}
                />
              }
            />
          </div>
        </FlexRow>
      </Container>

      {/* Comment list */}
      <List
        style={{
          flex: 1,
          overflowY: 'scroll',
          marginBottom: (size.width || 0) > 1024 ? 32 : 0,
        }}
        disablePadding>
        {filteredComments.map((comment, i) => (
          <React.Fragment key={comment.id}>
            <CommentListItem
              comment={comment}
              disabledRedFlags={disabledRedFlags}
              selected={selectedComments.has(comment.id)}
              onChange={() => handleSelectionToggle(comment.id)}
            />
            {i + 1 < filteredComments.length && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </FlexColumn>
  )
}
export default CommentList
