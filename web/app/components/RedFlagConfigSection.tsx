import FlexColumn from '@/components/FlexColumn'
import FlexRow from '@/components/FlexRow'
import {
  ContainsWithOptions,
  RedFlag,
  RedFlagsConfig,
} from '@metuuu/filter-youtube-comments/src/comment-analysis/RedFlags'
import checkIsValidRedFlagsConfig from '@metuuu/filter-youtube-comments/src/utils/checkIsValidRedFlagsConfig'
import { Alert, Button, Typography } from '@mui/material'
import { useState } from 'react'
import { errorToMessage } from '../utils/error-utils'

interface RedFlagConfigSectionProps {
  redFlagConfig: RedFlagsConfig
  setRedFlagConfig: (config: RedFlagsConfig) => void
  isAnalyzing: boolean
  defaultConfig: RedFlagsConfig
}

export default function RedFlagConfigSection({
  redFlagConfig,
  setRedFlagConfig,
  isAnalyzing,
  defaultConfig,
}: RedFlagConfigSectionProps) {
  const [configError, setConfigError] = useState<any>()
  const onViewConfigurationClicked = () => {
    if ((RegExp.prototype as any).toJSON === undefined) {
      // TODO: Is there a better way for converting RegExp to JSON and back to RegExp?
      Object.defineProperty(RegExp.prototype, 'toJSON', {
        value: function () {
          return `RegExp${this.toString()}`
        },
      })
    }
    const blob = new Blob([JSON.stringify(redFlagConfig, undefined, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const onLoadConfigurationClicked = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        let text = await file.text()
        const config: RedFlagsConfig = JSON.parse(text)

        // Convert all RegExp contains keys back to JavaScript RegExp instances
        // TODO: Is there a better way for converting RegExp to JSON and back to RegExp?
        const convertStringToRegExpIfNeeded = (value: string) => {
          if (value.startsWith('RegExp/')) {
            const flags = value.split('/').reverse()[0]
            return new RegExp(value.replace(/^RegExp\/(.*)\/.*/, '$1'), flags)
          }
          return value
        }
        const convertContainsStringToRegExp = (
          contains: RedFlag['contains'],
        ): RedFlag['contains'] => {
          if (contains instanceof RegExp) return contains
          if (typeof contains === 'string') {
            return convertStringToRegExpIfNeeded(contains)
          } else if (Array.isArray(contains)) {
            return contains.map(convertContainsStringToRegExp) as ContainsWithOptions[]
          } else if ('value' in contains) {
            if (typeof contains.value === 'string') {
              contains.value = convertStringToRegExpIfNeeded(contains.value)
            } else if (Array.isArray(contains.value)) {
              contains.value = contains.value.map((v) =>
                typeof v === 'string' ? convertStringToRegExpIfNeeded(v) : v,
              )
            }
            return contains
          }
          return contains
        }
        config.flags.forEach((flag) => {
          flag.contains = convertContainsStringToRegExp(flag.contains)
        })

        const isValid = await checkIsValidRedFlagsConfig(config)
        if (!isValid) {
          input.value = ''
          setConfigError(new Error('Invalid Red Flags Configuration file provided'))
          return
        }
        setRedFlagConfig(config)
        localStorage.setItem('redFlagsConfig', JSON.stringify(config))
        setConfigError(undefined)
      } catch (err) {
        setConfigError(new Error(`Failed to load configuration: ${errorToMessage(err)}`))
      }
    }
    input.click()
  }

  const onResetConfigurationClicked = () => {
    setRedFlagConfig(defaultConfig)
    localStorage.removeItem('redFlagsConfig')
    setConfigError(undefined)
  }

  return (
    <FlexColumn style={{ marginTop: 16 }}>
      <Typography variant="h6" color="primary">
        Red flags configuration &quot;{redFlagConfig.name}&quot;
      </Typography>
      <FlexRow gap={8} style={{ marginTop: 8 }}>
        <Button
          variant="outlined"
          fullWidth
          disabled={isAnalyzing}
          color="secondary"
          onClick={() => onViewConfigurationClicked()}>
          View config
        </Button>
        <Button
          variant="outlined"
          fullWidth
          disabled={isAnalyzing}
          color="secondary"
          onClick={() => onLoadConfigurationClicked()}>
          Load config
        </Button>
        {redFlagConfig !== defaultConfig && (
          <Button
            variant="outlined"
            fullWidth
            disabled={isAnalyzing}
            color="secondary"
            onClick={() => onResetConfigurationClicked()}>
            Reset
          </Button>
        )}
      </FlexRow>

      {configError && (
        <Alert severity="error" style={{ marginTop: 8 }} onClose={() => setConfigError(undefined)}>
          {errorToMessage(configError)}
        </Alert>
      )}
    </FlexColumn>
  )
}
