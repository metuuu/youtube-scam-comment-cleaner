import { youtube_v3 } from '@googleapis/youtube'
import axios from 'axios'

export default async function getChannel({
  channelId,
  ...auth
}: ({ apiKey: string } | { accessToken: string }) & { channelId: string }) {
  const searchParams = new URLSearchParams()
  if ('apiKey' in auth && auth.apiKey) searchParams.append('key', auth.apiKey)
  if (channelId) searchParams.append('id', channelId)
  searchParams.append('part', 'snippet')

  const getChannelResponse = await axios.get<youtube_v3.Schema$ChannelListResponse>(
    `https://www.googleapis.com/youtube/v3/channels?${searchParams.toString()}`,
    {
      headers:
        'accessToken' in auth && auth.accessToken
          ? { Authorization: `Bearer ${auth.accessToken}` }
          : undefined,
    },
  )

  const channel = getChannelResponse.data.items![0]
  return channel
}
