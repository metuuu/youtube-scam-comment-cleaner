import React, { ElementType, PropsWithChildren } from 'react'

const Absolute = <TAs extends ElementType = 'div'>(
  props: PropsWithChildren<
    {
      as?: TAs
      ref?: React.LegacyRef<HTMLDivElement>
      position?: 'left' | 'right' | 'top' | 'bottom'
      style?: React.CSSProperties
    } & React.ComponentPropsWithoutRef<TAs> // Add props of the `as` element
  >,
) => {
  const { as: Component = 'div', ref, position, style, ...restProps } = props

  return (
    <Component
      ref={ref}
      style={{
        position: 'absolute',
        ...(position !== 'left' && { right: 0 }),
        ...(position !== 'right' && { left: 0 }),
        ...(position !== 'top' && { bottom: 0 }),
        ...(position !== 'bottom' && { top: 0 }),
        ...style,
      }}
      {...restProps} // Pass down the rest of the props to the `Component`
    />
  )
}

export default Absolute
