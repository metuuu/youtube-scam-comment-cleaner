export default function getSpecialCharacterRegExp(props?: {
  allowedCharacters?: string[]
  flags?: string
}) {
  const { allowedCharacters = [], flags = 'gm' } = props || {}
  return new RegExp(`[^ A-Za-z0-9${allowedCharacters?.map((s) => `\\${s}`).join('')}]`, flags)
}
