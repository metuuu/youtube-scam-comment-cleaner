import axios from 'axios'

export default async function hideComment({
  accessToken,
  commentIds,
}: {
  commentIds: string[]
  accessToken?: string
}) {
  const searchParams = new URLSearchParams()
  searchParams.append('id', commentIds.join(','))
  searchParams.append('moderationStatus', 'rejected')

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
