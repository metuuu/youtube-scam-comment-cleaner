import { youtube_v3 } from '@googleapis/youtube'
import { CommentRedFlag } from '../..'
import getSpecialCharacterRegExp from './getSpecialCharacterRegExp'
import normalizeString, { NormalizeOptions } from './normalizeString'
import { ContainsWithOptions, RedFlag } from './RedFlags'
import removeAccentsAndDiacritics from './removeAccentsAndDiacritics'
import stringSimilarity from './stringSimilarity'

export default async function analyzeComment({ channel, comment, redFlags }: { channel: youtube_v3.Schema$Channel, comment: youtube_v3.Schema$Comment, redFlags: RedFlag[] }) {
  const commentSnippet = comment!.snippet!
  const channelSnippet = channel!.snippet!

  // Ignore channel author comments
  if (commentSnippet!.authorChannelId!.value === channel.id) return { comment, redFlags: [], totalRedFlagWeight: 0 }

  let triggeredRedFlags: CommentRedFlag[] = []
  let totalTriggeredRedFlagWeight = 0

  const channelDetails = {
    title: channelSnippet.title!,
    normalizedTitle: normalizeString(channelSnippet.title!),
  }

  const commentAuthor = {
    channelId: commentSnippet.authorChannelId!,
    channelUrl: commentSnippet.authorChannelUrl!,
    displayName: commentSnippet.authorDisplayName!,
    displayNameNormalized: normalizeString(commentSnippet.authorDisplayName!),
    displayNameWithoutAccentsAndDiacritics: removeAccentsAndDiacritics(commentSnippet.authorDisplayName!),
  }

  const handleRedFlagObjectCheck = (redFlag: RedFlag) => {
    const { toCheck, weight, minNumberOfOccurrences, contains, maxWeight, preprocessing } = redFlag
    let numberOfOccurrences = 0
    let additionalWeight = (weight || 0)
    const results: (boolean | { additionalWeight: number })[] = []


    for (const check of toCheck || ['authorName', 'comment']) {
      let input = check === 'authorName' ? commentAuthor.displayName : commentSnippet.textOriginal!

      if (check === 'comment') {
        // This is a special case handling. YouTube comments with @ reply contain "&ZeroWidthSpace;" before the @ symbol. We want to remove this because this doesn't show up to user and confuses red flags checker.
        input = input.replace("^\u200B", "")
      }

      let preprocessingToUse: NormalizeOptions | boolean = false
      if (preprocessing !== false) preprocessingToUse = true
      if (typeof preprocessing === 'object') preprocessingToUse = (preprocessing as any)[check]

      const preprocessedInput = preprocessingToUse
        ? normalizeString(input, preprocessingToUse === true ? undefined : preprocessingToUse)
        : input

      const foundResults = handleContains(preprocessedInput, contains)
      if (Array.isArray(foundResults)) results.push(...foundResults)
      else results.push(foundResults)
    }

    // Results
    results.map((r) => {
      // TODO: Should "numberOfOccurrences" and "additionalWeight" be multiplied by "toCheck" hits

      // Boolean result
      if (r === false) return
      numberOfOccurrences += 1
      if (r === true) return { additionalWeight }

      // Object result
      additionalWeight += r.additionalWeight
    })

    // Min number of occurrences check
    if (numberOfOccurrences < (minNumberOfOccurrences ?? 1)) return false

    // Reduce weight if it exceeds max weight
    if (maxWeight != null && additionalWeight > maxWeight) additionalWeight = maxWeight

    // Return the additional weight
    return { additionalWeight }
  }

  const handleContains = (input: string, contains: RedFlag['contains']) => {
    if (Array.isArray(contains)) {
      const successResults = contains.map((c) => handleContainsWithOptions(input, c)).filter((r) => r !== false)
      if (successResults.length === 0) return false
      return successResults
    }
    else if (typeof contains === 'string' || contains instanceof RegExp) {
      return handleContainsRegExp(input, contains)
    }
    else if (contains instanceof Object) {
      return handleContainsWithOptions(input, contains)
    }
    else throw new Error(`Unsupported check "${contains}"`)
  }

  const handleContainsRegExp = (input: string, value: string | RegExp) => {
    return (value instanceof RegExp)
    ? !!input.match(value)
    : input.includes(replaceTemplatesInValue(value))
  }

  const handleContainsWithOptions = (input: string, contains: ContainsWithOptions): false | { additionalWeight: number } => {
    let additionalWeight = (contains.weight || 0)

    if ('similarity' in contains) {
      const { similarity: minSimilarity, value } = contains
      if (minSimilarity > stringSimilarity.compareTwoStrings(input, replaceTemplatesInValue(value))) return false
      return { additionalWeight }
    }
    if ('specialCharacters' in contains) {
      const { allowedCharacters } = contains
      if (!handleContainsRegExp(input, getSpecialCharacterRegExp({ allowedCharacters }))) return false
      return { additionalWeight }
    }
    else if (Array.isArray(contains.value)) {
      const minNumberOfOccurrences = (('minNumberOfOccurrences' in contains) ? contains.minNumberOfOccurrences : 1) ?? 1
      let numberOfOccurrences = 0
      for (const value of contains.value) {
        if (handleContainsRegExp(input, value)) numberOfOccurrences += 1
        if (numberOfOccurrences >= minNumberOfOccurrences) break
      }
      if (numberOfOccurrences < minNumberOfOccurrences) return false
      return { additionalWeight }
    }
    else {
      if (!handleContainsRegExp(input, contains.value)) return false
      return { additionalWeight }
    }
  }

  const replaceTemplatesInValue = (value: string) => {
    let replacedTemplatesValue = value
    value.replace(/\{\{channelName\}\}/gm, channelDetails.title)
    value.replace(/\{\{normalizedChannelName\}\}/gm, channelDetails.normalizedTitle)
    return replacedTemplatesValue
  }

  for (const redFlag of redFlags) {
    // console.log(`Checking for red flag "${redFlag.name}"`)
    const result = handleRedFlagObjectCheck(redFlag)
    if (result !== false) {
      totalTriggeredRedFlagWeight += result.additionalWeight
      triggeredRedFlags.push({
        id: redFlag.id,
        name: redFlag.name,
        weight: result.additionalWeight,
      })
    }
  }

  return {
    comment,
    redFlags: triggeredRedFlags,
    totalRedFlagWeight: totalTriggeredRedFlagWeight
  }
}
