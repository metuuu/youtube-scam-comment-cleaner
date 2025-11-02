import { youtube_v3 } from '@googleapis/youtube'
import axios from 'axios'

export default async function getVideo({
  videoId,
  ...auth
}: ({ apiKey: string } | { accessToken: string }) & { videoId: string }) {
  const searchParams = new URLSearchParams()
  if ('apiKey' in auth && auth.apiKey) searchParams.append('key', auth.apiKey)
  if (videoId) searchParams.append('id', videoId)
  searchParams.append('part', 'snippet')

  const getVideoResponse = await axios.get<youtube_v3.Schema$VideoListResponse>(
    `https://www.googleapis.com/youtube/v3/videos?${searchParams.toString()}`,
    {
      headers:
        'accessToken' in auth && auth.accessToken
          ? { Authorization: `Bearer ${auth.accessToken}` }
          : undefined,
    },
  )

  const video = getVideoResponse.data.items![0]
  return video
}
