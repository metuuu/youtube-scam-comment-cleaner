import { youtube_v3 } from '@googleapis/youtube'
import axios from 'axios'

export default async function getVideo({ apiKey, videoId }: { videoId: string; apiKey: string }) {
  const searchParams = new URLSearchParams()
  if (apiKey) searchParams.append('key', apiKey)
  if (videoId) searchParams.append('id', videoId)
  searchParams.append('part', 'snippet')

  const getVideoResponse = await axios.get<youtube_v3.Schema$VideoListResponse>(
    `https://www.googleapis.com/youtube/v3/videos?${searchParams.toString()}`,
  )

  const video = getVideoResponse.data.items![0]
  return video
}
