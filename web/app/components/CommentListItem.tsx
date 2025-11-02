'use client'
import Absolute from '@/components/Absolute'
import FlexColumn from '@/components/FlexColumn'
import FlexRow from '@/components/FlexRow'
import { Info, InfoOutlined } from '@mui/icons-material'
import {
  Avatar,
  Checkbox,
  Chip,
  Divider,
  ListItem,
  ListItemButton,
  Typography,
} from '@mui/material'
import { useHover } from '@uidotdev/usehooks'
import { formatDistance } from 'date-fns'
import { useState } from 'react'
import { Comment } from '../input/comments'
import sumByProperty from '@/utils/sumByProperty'

const CommentListItem = (props: {
  comment: Comment
  disabledRedFlags: string[]
  onChange: () => void
  selected: boolean
}) => {
  const { disabledRedFlags, selected, onChange } = props
  const { redFlags, ...comment } = props.comment
  const enabledRedFlags = redFlags.filter(({ id }) => !disabledRedFlags.includes(id))
  const totalRedFlagWeight = sumByProperty(enabledRedFlags, 'weight')

  const [isLockedOpen, setIsLockedOpen] = useState(false)
  const [refHover, isHovering] = useHover()

  return (
    <ListItem
      style={{ padding: 0 }}
      disablePadding
      disableGutters
      onClick={onChange}
      secondaryAction={
        <FlexRow gap={24}>
          <Checkbox edge="end" checked={selected} style={{ marginRight: 48 }} />
        </FlexRow>
      }>
      <ListItemButton>
        {/* Left total red flag weight number */}
        <Absolute
          as={FlexRow}
          position="left"
          justifyContent="center"
          alignItems="center"
          style={{
            zIndex: 1,
            width: 36,
          }}>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {totalRedFlagWeight}
          </Typography>
          <Divider absolute orientation="vertical" />
        </Absolute>

        <FlexColumn style={{ marginLeft: 36 }}>
          <FlexRow gap={12} justifyContent="space-between" alignItems="center">
            <FlexRow gap={24} justifyContent="space-between" alignItems="center">
              {/* Avatar */}
              <Avatar alt="Author profile image" src={comment.authorProfileImageUrl} />

              <FlexColumn justifyContent="center" style={{ marginRight: 48 }}>
                <FlexColumn justifyContent="center">
                  {/* Channel name and date */}
                  <FlexRow gap={4}>
                    <Typography variant="caption" color="textSecondary">
                      {/* eslint-disable-next-line react-hooks/purity */}
                      {comment.authorDisplayName} · {formatDistance(comment.updatedAt, Date.now())}{' '}
                      ago
                    </Typography>
                  </FlexRow>
                  {/* Comment */}
                  <Typography variant="body2" color="textPrimary">
                    {comment.textOriginal}
                  </Typography>
                  <FlexRow gap={4} style={{ marginTop: 4 }}>
                    {!!comment.likeCount && (
                      <Chip
                        label={`${comment.likeCount} likes`}
                        style={{ fontSize: 12 }}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {comment.isCommentThread && (
                      <Chip
                        label={`Thread · ${comment.numOfReplies} replies`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {comment.parentId && (
                      <Chip label="Thread comment" size="small" variant="outlined" />
                    )}
                  </FlexRow>
                  {/* Additional details on hover */}
                  {(isLockedOpen || isHovering) && (
                    <FlexColumn>
                      {/* <Typography variant="subtitle2" color="textPrimary">
                        <b>
                          Red flags {enabledRedFlags.length} pcs - total weight: {totalRedFlagWeight}
                        </b>
                      </Typography> */}
                      <FlexRow gap={4} wrap style={{ marginTop: 4 }}>
                        {redFlags.map(({ id, name }) => (
                          <Chip
                            key={id}
                            label={name}
                            disabled={disabledRedFlags.includes(id)}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </FlexRow>
                    </FlexColumn>
                  )}
                </FlexColumn>
              </FlexColumn>

              {/* Additional details hover area */}
              <Absolute
                as={FlexRow}
                ref={refHover}
                justifyContent="center"
                alignItems="center"
                position="right"
                style={{
                  zIndex: 1,
                  width: 42,
                  backgroundColor: '#1b1b1b',
                  borderLeft: '1px solid #333',
                  borderRight: '1px solid #333',
                }}
                // onClick={(e) => {
                //   e.stopPropagation()
                //   setIsLockedOpen(!isLockedOpen)
                // }}
              >
                {isLockedOpen ? <Info color="secondary" /> : <InfoOutlined color="secondary" />}
              </Absolute>
            </FlexRow>

            {/* <FlexColumn gap={6}>
        <Button
          style={{ width: 160, minWidth: 160, maxHeight: 64 }}
          variant="contained"
          color="error">
          Delete
          <DeleteIcon />
        </Button>
        <Button
          style={{ width: 160, minWidth: 160, maxHeight: 64 }}
          variant="contained">
          Whitelist
        </Button>
      </FlexColumn> */}
          </FlexRow>
        </FlexColumn>
      </ListItemButton>
    </ListItem>
  )
}
export default CommentListItem
