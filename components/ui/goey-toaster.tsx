"use client"

import { GooeyToaster as GoeyToasterPrimitive, gooeyToast } from "goey-toast"
import type { GooeyToasterProps } from "goey-toast"
import "goey-toast/styles.css"

export { gooeyToast as goeyToast }
export type { GooeyToasterProps as GoeyToasterProps }
export type {
  GooeyToastOptions as GoeyToastOptions,
  GooeyPromiseData as GoeyPromiseData,
  GooeyToastAction as GoeyToastAction,
  GooeyToastClassNames as GoeyToastClassNames,
  GooeyToastTimings as GoeyToastTimings,
} from "goey-toast"

function GoeyToaster(props: GooeyToasterProps) {
  return <GoeyToasterPrimitive position="bottom-right" {...props} />
}

export { GoeyToaster }
