import { youtube_v3 } from '@googleapis/youtube'
import axios from 'axios'

export default async function getComments({
  apiKey,
  parentId,
  maxResults,
}: { apiKey: string } & Pick<youtube_v3.Params$Resource$Comments$List, 'parentId' | 'maxResults'>) {
  let allComments: youtube_v3.Schema$Comment[] = []
  let nextPageToken: any
  do {
    const searchParams = new URLSearchParams()
    if (apiKey) searchParams.append('key', apiKey)
    if (parentId) searchParams.append('parentId', parentId)
    if (nextPageToken) searchParams.append('pageToken', nextPageToken)
    if (maxResults) searchParams.append('maxResults', maxResults.toString())
    searchParams.append('part', 'snippet')

    const listCommentsResponse = await axios.get<youtube_v3.Schema$CommentListResponse>(
      `https://www.googleapis.com/youtube/v3/comments?${searchParams.toString()}`,
    )
    allComments.push(...(listCommentsResponse.data.items || []))

    nextPageToken = listCommentsResponse.data.nextPageToken
  } while (maxResults && allComments.length < maxResults && nextPageToken)

  return allComments
}
