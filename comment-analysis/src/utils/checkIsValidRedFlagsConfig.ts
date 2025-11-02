import { youtube_v3 } from '@googleapis/youtube'
import analyzeComment from '../comment-analysis/analyzeComment'

const checkIsValidRedFlagsConfig = async (config: any) => {
  try {
    if (!config?.name || !config?.flags || !Array.isArray(config.flags)) return false
    const channel: youtube_v3.Schema$Channel = {
      kind: 'youtube#channel',
      etag: 'CHANNEL_ETAG',
      id: 'CHANNEL_ID',
      snippet: {
        title: 'Name',
        description: 'Description',
      },
    }
    const comment: youtube_v3.Schema$Comment = {
      kind: 'youtube#comment',
      etag: 'COMMENT_ETAG',
      id: 'COMMENT_ID',
      snippet: {
        channelId: 'CHANNEL_ID',
        videoId: 'VIDEO_ID',
        textDisplay: 'Comment Text Display',
        textOriginal: 'Comment Text Original',
        authorDisplayName: '@AuthorDisplayName',
        authorProfileImageUrl: 'CHANNEL_PROFILE_IMAGE_URL',
        authorChannelUrl: 'CHANNEL_URL',
        authorChannelId: {
          value: 'AUTHOR_CHANNEL_ID',
        },
        canRate: true,
        viewerRating: 'none',
        likeCount: 0,
        publishedAt: '2000-01-01T00:00:00Z',
        updatedAt: '2000-01-01T00:00:00Z',
      },
    }
    await analyzeComment({ channel, comment, redFlags: config.flags })
    return true
  } catch (error) {
    console.error('Invalid red flags configuration', error)
    return false
  }
}

export default checkIsValidRedFlagsConfig
