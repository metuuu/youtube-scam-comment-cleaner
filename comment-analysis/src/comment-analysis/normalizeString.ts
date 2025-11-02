import Counterparts from './Counterparts'
import getSpecialCharacterRegExp from './getSpecialCharacterRegExp'
import removeAccentsAndDiacriticsFunc from './removeAccentsAndDiacritics'

export type NormalizeOptions = {
  removeNumbers?: boolean
  /** @default true */
  convertCounterparts?: boolean
  /** @default true */
  removeAccentsAndDiacritics?: boolean
  /** @default true */
  removeSpecialCharacters?: boolean
  whitelistedSpecialCharacters?: string[]
  /** @default true */
  removeWhitespace?: boolean
  /** @default true */
  makeLowercase?: boolean
}

/**
 * Remove all kind of special characters,
 *
 * `convertCounterParts` is always executed first.
 */
export default function normalizeString(str: string, options?: NormalizeOptions) {
  const {
    removeNumbers,
    convertCounterparts = true,
    makeLowercase = true,
    removeAccentsAndDiacritics = true,
    removeSpecialCharacters = true,
    whitelistedSpecialCharacters,
    removeWhitespace = true,
  } = options || {}
  let normalized = str
  if (convertCounterparts)
    normalized = [...normalized]
      .map((char) => String((Counterparts as any)[char]?.counterpart ?? char).toLowerCase())
      .join('')
  if (removeAccentsAndDiacritics) normalized = removeAccentsAndDiacriticsFunc(normalized)
  if (removeSpecialCharacters)
    normalized = normalized.replace(
      getSpecialCharacterRegExp({ allowedCharacters: whitelistedSpecialCharacters }),
      '',
    )
  if (removeWhitespace) normalized = normalized.replace(/ /gm, '')
  if (removeNumbers) normalized = normalized.replace(/[0-9]/gm, '')
  if (makeLowercase) normalized = normalized.toLowerCase()
  return normalized
}

// .replace(new RegExp(`[${Object.keys(NumberCounterparts)}]`, 'g'), '0') // Replace special character numbers with regular numbers (It doesn't matter what numbers there are so we just replace all special numbers with 0)
