/* eslint-disable react-hooks/refs */
import FlexRow from '@/components/FlexRow'
import areArraysEqual from '@/utils/areArraysEqual'
import sumByProperty from '@/utils/sumByProperty'
import { Checkbox, Chip, FormControlLabel, Slider, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Comment } from '../input/comments'

const useFilters = ({
  comments,
  selectedComments,
}: {
  comments: Comment[]
  selectedComments: Set<string>
}) => {
  'use memo'

  // Toggle visibility
  const [toggleFilterValues, setToggleFilterValues] = useState<Record<string, boolean>>({
    threads: true,
    threadComments: true,
    individual: true,
    unselected: true,
  })
  const toggleFilters: Record<string, string> = {
    individual: 'Individual comments',
    threads: 'Threads',
    threadComments: 'Thread comments',
    unselected: 'Unselected',
  }
  const toggleVisibilityList = (
    <>
      <FlexRow gap={8}>
        <Typography variant="body1" color="textPrimary" fontWeight="bold" whiteSpace="nowrap">
          Toggle visibility
        </Typography>
        <FlexRow gap={6} wrap>
          {Object.entries(toggleFilters).map(([id, name]) => (
            <Chip
              key={id}
              variant={toggleFilterValues[id] ? 'filled' : 'outlined'}
              label={name}
              size="small"
              onClick={() =>
                setToggleFilterValues({ ...toggleFilterValues, [id]: !toggleFilterValues[id] })
              }
            />
          ))}
        </FlexRow>
      </FlexRow>
    </>
  )
  // red flag toggles
  const [visibilityAffectsWeight, setVisibilityAffectsWeight] = useState(true)
  const redFlagFilters: Record<string, string> = {}
  const redFlags = Array.from(new Set(comments.flatMap((c) => c.redFlags)))
  for (const { id, name } of redFlags) {
    redFlagFilters[id] = name
    if (!(id in toggleFilterValues))
      setToggleFilterValues((current) => ({ ...current, [id]: true }))
  }
  const toggleRedFlagsList = (
    <div>
      <FlexRow style={{ marginBottom: -4 }}>
        <Typography variant="body1" color="textPrimary" fontWeight="bold">
          Toggle red flags
        </Typography>

        <FormControlLabel
          labelPlacement="start"
          style={{ marginTop: -5 }}
          label={
            <Typography color="textSecondary" variant="caption">
              Only visibility (keep weight)
            </Typography>
          }
          control={
            <Checkbox
              size="small"
              onChange={() => setVisibilityAffectsWeight(!visibilityAffectsWeight)}
              checked={!visibilityAffectsWeight}
            />
          }
        />
      </FlexRow>
      <FlexRow gap={6} wrap>
        {Object.entries(redFlagFilters).map(([id, name]) => (
          <Chip
            key={id}
            variant={toggleFilterValues[id] ? 'filled' : 'outlined'}
            label={name}
            size="small"
            onClick={() =>
              setToggleFilterValues({ ...toggleFilterValues, [id]: !toggleFilterValues[id] })
            }
          />
        ))}
      </FlexRow>
    </div>
  )

  // Min weight slider
  const countDecimals = (value: number) =>
    value % 1 != 0 ? value.toString().split('.')[1].length : 0
  let decimals = 0
  let min = Infinity
  let max = 0
  comments.forEach((c) => {
    const totalWeight = sumByProperty(c.redFlags, 'weight')
    if (min > totalWeight) min = totalWeight
    if (max < totalWeight) max = totalWeight
    const cDecimals = countDecimals(totalWeight)
    if (decimals < cDecimals) decimals = cDecimals
  })
  const step = 1 / (Math.pow(10, decimals) || 1)

  const [minWeight, setMinWeight] = useState(min)
  useEffect(() => {
    if (minWeight > max) setMinWeight(max)
    else setMinWeight(min)
  }, [min, max])

  const minWeightSlider = (
    <div>
      <Typography variant="body1" color="textPrimary" fontWeight="bold">
        Min weight
      </Typography>
      <div style={{ paddingLeft: 12, paddingRight: 12 }}>
        <Slider
          min={min}
          max={max}
          onChange={(_, val) => setMinWeight(val as number)}
          step={step}
          marks={[
            // { value: min, label: min },
            { value: minWeight, label: minWeight },
            // { value: max, label: max },
          ]}
        />
      </div>
    </div>
  )

  // Filter
  // Using use memo here prevents rerender loop
  let filteredComments = useMemo(() => {
    return comments.filter(({ parentId, redFlags, isCommentThread }) => {
      if (!toggleFilterValues.individual && !isCommentThread && !parentId) return false
      if (!toggleFilterValues.threads && isCommentThread) return false
      if (!toggleFilterValues.threadComments && parentId) return false
      if (!redFlags.find(({ id }) => toggleFilterValues[id] === true)) return false
      return sumByProperty(redFlags, 'weight') >= minWeight
    })
  }, [comments, minWeight, toggleFilterValues])

  // filtering optimization / rerender loop issue fix for unselected toggle filter
  const refFilteredCommentsB = useRef<Comment[] | undefined>(undefined)
  const filteredCommentsB = filteredComments.filter(
    ({ id }) => toggleFilterValues.unselected || selectedComments.has(id),
  )
  if (filteredCommentsB.length < filteredComments.length) {
    // eslint-disable-next-line react-compiler/react-compiler
    if (!areArraysEqual(filteredCommentsB, refFilteredCommentsB.current)) {
      filteredComments = filteredCommentsB
      // eslint-disable-next-line react-compiler/react-compiler
      refFilteredCommentsB.current = filteredCommentsB
    } else filteredComments = refFilteredCommentsB.current!
  }

  // Sorting
  // eslint-disable-next-line react-compiler/react-compiler
  const sortedAndFilteredComments = filteredComments.sort((a, b) => {
    const aWeight = sumByProperty(
      a.redFlags.filter(({ id }) => toggleFilterValues[id]),
      'weight',
    )
    const bWeight = sumByProperty(
      b.redFlags.filter(({ id }) => toggleFilterValues[id]),
      'weight',
    )
    return aWeight > bWeight ? -1 : 1
  })

  return {
    filteredComments: sortedAndFilteredComments,
    disabledRedFlags: visibilityAffectsWeight
      ? redFlags.map(({ id }) => id).filter((id) => !toggleFilterValues[id])
      : [],
    components: { minWeightSlider, toggleVisibilityList, toggleRedFlagsList },
  }
}
export default useFilters
