import { NormalizeOptions } from './normalizeString'

export type ContainsWithOptions =
  | { value: string | RegExp; weight?: number }
  | {
      value: (string | RegExp)[]
      /** If not set, defaults to all. */
      minNumberOfOccurrences?: number
      weight?: number
    }
  | {
      specialCharacters: true
      allowedCharacters?: string[]
      weight?: number
    }
  | {
      /** Percentage of at least how similar the "toCheck" and "value" should be (0 - 1). */
      similarity: number
      value: string
      weight?: number
    }

export type RedFlag = {
  id: string
  name: string
  // TODO: Add min/max length comment filters
  toCheck?: ('authorName' | 'comment')[]
  contains: string | RegExp | ContainsWithOptions | ContainsWithOptions[]

  /**
   * If the input should be processed before comparison.
   * @default true
   */
  preprocessing?:
    | boolean
    | NormalizeOptions
    | {
        authorName?: boolean | NormalizeOptions
        comment?: boolean | NormalizeOptions
      }

  /** Added weight if any of the contains matches. */
  weight?: number
  /** If not set, defaults to 1 */
  minNumberOfOccurrences?: number
  /** Maximum amount of weight this red flag can cumulate (when "contains" is an array with multiple values and weights). */
  maxWeight?: number
}

// const RedFlagTemplates = {
const RedFlagTemplates: Record<string, RedFlag> = {
  makeshiftCryptocurrencyName: {
    id: 'makeshift-crypto-name',
    name: 'Makeshift crypto currency name',
    weight: 4,
    toCheck: ['comment'],
    preprocessing: { makeLowercase: false, removeWhitespace: false },
    contains: /[A-Z$£€₿]{2,3}[0-9]{2,3}[A-Z$£€₿]{1,2}/,
  },
  reachMeOut: {
    id: 'reach-me-out',
    name: 'Reach me out',
    minNumberOfOccurrences: 2,
    weight: 6,
    contains: [
      {
        value: ['whatsap', 'signal', 'telegram', 'pinned'],
        minNumberOfOccurrences: 1,
      },
      {
        value: ['reach', 'me', 'out'],
        minNumberOfOccurrences: 2,
      },
    ],
  },
  containsBotEscapeCharacter: {
    id: 'bot-escape-character',
    name: 'Bot escape character',
    weight: 2,
    contains: { value: "\\'s" },
    preprocessing: false,
  },
  containsMoneySymbols: {
    id: 'money-symbols',
    name: 'Contains money symbols',
    weight: 2,
    contains: {
      value: [
        '$',
        '€',
        '£',
        '¥',
        '₣',
        '₹',
        '₿',
        '🏦',
        '💵',
        '💶',
        '💷',
        '💴',
        '📈',
        '💰',
        '🪙',
        '📉',
        '💳',
        '💱',
        '🫰',
        '💲',
        '💸',
        '🤑',
        '👛',
        '🎰',
        '🚀',
      ],
      minNumberOfOccurrences: 1,
    },
    preprocessing: false,
  },
  containsPhoneNumber: {
    id: 'phone-number',
    name: 'Contains phone number',
    weight: 3,
    contains: /\+\d{7}/,
    preprocessing: { whitelistedSpecialCharacters: ['+'] },
  },
  profileNameContainsUncommonSpecialCharacters: {
    id: 'profile-name-uncommon-special-characters',
    name: 'Profile name contains uncommon special characters',
    weight: 1,
    toCheck: ['authorName'],
    contains: {
      specialCharacters: true as const,
      allowedCharacters: ['@', "'", '"', '-', '_', '’', ',', '?', '!', ':', '.', '(', ')', '/'],
    },
    preprocessing: false,
  },
  commentContainsUncommonSpecialCharacters: {
    id: 'comment-uncommon-special-characters',
    name: 'Contains uncommon special characters',
    weight: 1,
    toCheck: ['comment'],
    contains: {
      specialCharacters: true as const,
      allowedCharacters: ['@', "'", '"', '-', '_', '’', ',', '?', '!', ':', '.', '(', ')', '/'],
    },
    preprocessing: false,
  },
  similarProfileName: {
    id: 'similar-profile-name',
    name: 'Has similar profile name',
    weight: 5,
    toCheck: ['authorName'],
    contains: {
      similarity: 0.8,
      value: '{{channelName}}',
    },
  },
  investmentGuruPromotion: {
    id: 'investment-guru-promotion',
    name: 'Investment guru promotion',
    weight: 6,
    minNumberOfOccurrences: 2,
    toCheck: ['comment'],
    contains: [
      {
        value: ['thank', 'changing', 'life', 'helping', 'achieve', 'recover', 'money'],
        minNumberOfOccurrences: 3,
      },
      {
        value: ['thank', 'daily', 'profits'],
        minNumberOfOccurrences: 3,
      },
      {
        value: ['thank', 'weekly', 'profits'],
        minNumberOfOccurrences: 3,
      },
      {
        value: ['thank', 'monthly', 'profits'],
        minNumberOfOccurrences: 3,
      },
      {
        value: ['taught', 'invest', 'trade', 'insight', 'signal'],
        minNumberOfOccurrences: 2,
      },
      {
        value: ['strategy', 'successful', 'profits', 'earnings'],
        minNumberOfOccurrences: 2,
      },
      {
        value: ['skeptical', 'decide', 'try', 'returns'],
        minNumberOfOccurrences: 3,
      },
    ],
  },
}

// const _typescriptRedFlagTemplatesCheck: Record<keyof typeof RedFlagTemplates, RedFlag> = RedFlagTemplates

export default RedFlagTemplates
