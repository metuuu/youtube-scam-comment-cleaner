import axios from 'axios'

export default async function hideComment({
  apiKey,
  commentId,
}: {
  commentId: string
  apiKey: string
}) {
  const searchParams = new URLSearchParams()
  if (apiKey) searchParams.append('key', apiKey)
  searchParams.append('id', commentId)
  searchParams.append('moderationStatus', 'rejected')

  await axios.post(
    `https://www.googleapis.com/youtube/v3/comments/setModerationStatus?${searchParams.toString()}`,
  )
}
