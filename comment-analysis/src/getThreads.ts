import { youtube_v3 } from '@googleapis/youtube'
import axios from 'axios'

export default async function getThreads({
  videoId,
  order,
  apiKey,
  maxResults,
}: { apiKey: string; order?: 'time' | 'relevance' } & Pick<
  youtube_v3.Params$Resource$Commentthreads$List,
  'videoId' | 'maxResults'
>) {
  let allThreads: youtube_v3.Schema$CommentThread[] = []
  let nextPageToken: any
  do {
    const searchParams = new URLSearchParams()
    if (apiKey) searchParams.append('key', apiKey)
    if (videoId) searchParams.append('videoId', videoId)
    if (nextPageToken) searchParams.append('pageToken', nextPageToken)
    if (maxResults) searchParams.append('maxResults', maxResults.toString())
    if (order) searchParams.append('order', order)
    // searchParams.append('moderationStatus', 'likelySpam')
    searchParams.append('part', 'snippet')

    const listCommentThreadsResponse = await axios.get<youtube_v3.Schema$CommentThreadListResponse>(
      `https://www.googleapis.com/youtube/v3/commentThreads?${searchParams.toString()}`,
    )

    if (listCommentThreadsResponse.data.items)
      allThreads.push(...listCommentThreadsResponse.data.items)
    nextPageToken = listCommentThreadsResponse.data.nextPageToken
  } while (maxResults && allThreads.length < maxResults && nextPageToken)

  return allThreads
}
