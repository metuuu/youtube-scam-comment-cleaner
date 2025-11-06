import { RedFlag, RedFlagTemplates } from '../src/comment-analysis/RedFlags'

const redFlagInputs = Object.values(RedFlagTemplates) as RedFlag[]
// const redFlagInputs = [RedFlagTemplates.makeshiftCryptocurrencyName, RedFlagTemplates.containsMoneySymbols] as RedFlag[]

export default redFlagInputs
