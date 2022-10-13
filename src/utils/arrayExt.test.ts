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

describe("ArrayExt.pickAndMove", () => {
  test("[0, 1, 2, 3, 4, 5], 1, 3", () => {
    const act = ArrayExt.pickAndMove([0, 1, 2, 3, 4, 5], 1, 3)
    const exp = [0, 2, 3, 1, 4, 5]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 1, 3", () => {
    const act = ArrayExt.pickAndMove([0, 1, 2, 3], 1, 3)
    const exp = [0, 2, 3, 1]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 1, 2", () => {
    const act = ArrayExt.pickAndMove([0, 1, 2, 3], 1, 2)
    const exp = [0, 2, 1, 3]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 0, 3", () => {
    const act = ArrayExt.pickAndMove([0, 1, 2, 3], 0, 3)
    const exp = [1, 2, 3, 0]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3, 4, 5], 3, 1", () => {
    const act = ArrayExt.pickAndMove([0, 1, 2, 3, 4, 5], 3, 1)
    const exp = [0, 3, 1, 2, 4, 5]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 2, 1", () => {
    const act = ArrayExt.pickAndMove([0, 1, 2, 3], 2, 1)
    const exp = [0, 2, 1, 3]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 2, 0", () => {
    const act = ArrayExt.pickAndMove([0, 1, 2, 3], 2, 0)
    const exp = [2, 0, 1, 3]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 3, 0", () => {
    const act = ArrayExt.pickAndMove([0, 1, 2, 3], 3, 0)
    const exp = [3, 0, 1, 2]
    expect(act).toStrictEqual(exp)
  })
})

describe("ArrayExt.swap", () => {
  test("[0, 1, 2, 3], 1, 3", () => {
    const act = ArrayExt.swap([0, 1, 2, 3], 1, 3)
    const exp = [0, 3, 2, 1]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 2, 0", () => {
    const act = ArrayExt.swap([0, 1, 2, 3], 2, 0)
    const exp = [2, 1, 0, 3]
    expect(act).toStrictEqual(exp)
  })
})

describe("ArrayExt.insert", () => {
  test("[0, 1, 2, 3], -1, 0", () => {
    const act = ArrayExt.insert([0, 1, 2, 3], -1, 0)
    const exp = [-1, 0, 1, 2, 3]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], -1, 3", () => {
    const act = ArrayExt.insert([0, 1, 2, 3], -1, 3)
    const exp = [0, 1, 2, -1, 3]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], -1, 2", () => {
    const act = ArrayExt.insert([0, 1, 2, 3], -1, 2)
    const exp = [0, 1, -1, 2, 3]
    expect(act).toStrictEqual(exp)
  })
})

describe("ArrayExt.remove", () => {
  test("[0, 1, 2, 3], 0", () => {
    const act = ArrayExt.remove([0, 1, 2, 3], 0)
    const exp = [1, 2, 3]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 3", () => {
    const act = ArrayExt.remove([0, 1, 2, 3], 3)
    const exp = [0, 1, 2]
    expect(act).toStrictEqual(exp)
  })
  test("[0, 1, 2, 3], 2", () => {
    const act = ArrayExt.remove([0, 1, 2, 3], 2)
    const exp = [0, 1, 3]
    expect(act).toStrictEqual(exp)
  })
})
