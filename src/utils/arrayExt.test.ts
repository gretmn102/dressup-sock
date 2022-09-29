import {describe, expect, test} from '@jest/globals'

import { ArrayExt } from './arrayExt'

describe("ArrayExt.takeWhile", () => {
  test("[], 0, 0, x => x", () => {
    const exp = undefined

    let act = ArrayExt.takeWhile([], 0, 0, x => x)

    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 1, 1, x => x", () => {
    const exp = [2, [1]]

    let act = ArrayExt.takeWhile([0, 1, 2, 3], 1, 1, x => x)

    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 1, 2, x => x", () => {
    const exp = [3, [1, 2]]

    let act = ArrayExt.takeWhile([0, 1, 2, 3], 1, 2, x => x)

    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 1, undefined, x => x", () => {
    const exp = [4, [1, 2, 3]]

    let act = ArrayExt.takeWhile([0, 1, 2, 3], 1, undefined, x => x)

    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 1, undefined, _ => undefined", () => {
    const exp = undefined

    let act = ArrayExt.takeWhile([0, 1, 2, 3], 1, undefined, _ => undefined)

    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3, 4], 1, undefined, x => x < 3 ? x : undefined", () => {
    const exp = [3, [1, 2]]

    let act = ArrayExt.takeWhile([0, 1, 2, 3, 4], 1, undefined, x => x < 3 ? x : undefined)

    expect(act).toStrictEqual(exp)
  })
})
