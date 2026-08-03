import { NextFunction, Request, Response } from 'express'

type AsyncController<TArgs extends unknown[] = [Request, Response, NextFunction]> = (
  ...args: TArgs
) => Promise<unknown>

const asyncHandler = <TArgs extends unknown[]>(fn: AsyncController<TArgs>) => {
  return (...args: TArgs): void => {
    void Promise.resolve(fn(...args)).catch((error: unknown) => {
      const next = args[2] as NextFunction | undefined
      if (next) {
        next(error)
      }
    })
  }
}

export default asyncHandler
