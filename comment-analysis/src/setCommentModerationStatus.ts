import axios from 'axios'

export default async function setCommentModerationStatus({
  accessToken,
  commentIds,
  moderationStatus = 'rejected',
}: {
  commentIds: string[]
  accessToken?: string
  /** @default "rejected" */
  moderationStatus?: 'rejected'
}) {
  const searchParams = new URLSearchParams()
  searchParams.append('id', commentIds.join(','))
  searchParams.append('moderationStatus', moderationStatus)

  await axios.post(
    `https://www.googleapis.com/youtube/v3/comments/setModerationStatus?${searchParams.toString()}`,
    null,
    {
      headers: {
        // OAuth2 (required for comment moderation)
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
}
