import { youtube_v3 } from '@googleapis/youtube'
import axios from 'axios'

export default async function getChannel({
  apiKey,
  channelId,
}: {
  channelId: string
  apiKey: string
}) {
  const searchParams = new URLSearchParams()
  if (apiKey) searchParams.append('key', apiKey)
  if (channelId) searchParams.append('id', channelId)
  searchParams.append('part', 'snippet')

  const getChannelResponse = await axios.get<youtube_v3.Schema$ChannelListResponse>(
    `https://www.googleapis.com/youtube/v3/channels?${searchParams.toString()}`,
  )

  const channel = getChannelResponse.data.items![0]
  return channel
}
