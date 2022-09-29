import {describe, expect, test} from '@jest/globals'

import * as P from "./universalParser"

describe("LayerList.getLayers", () => {
  test("test", () => {
    const input = [1, 2, 3]

    const pfirst = P.test<number>(x => x === 1)

    const p = pfirst

    const exp: P.Result<number> = P.Result.mkSuccess(1, 1)

    const act: P.Result<number> = P.run(p)(input)

    expect(act).toStrictEqual(exp)
  })
  test("alt", () => {
    const input = [1, 2, 3]

    const pfirst = P.test<number>(x => x === 1)
    const psecond = P.test<number>(x => x === 2)
    const pthird = P.test<number>(x => x === 3)

    const all =
      P.alt(
        P.alt(
          pthird,
          psecond,
        ),
        pfirst
      )

    const p =
      P.pipe2(
        all,
        all,
        (x1, x2) => [x1, x2] as [number, number]
      )

    const exp: P.Result<[number, number]> = P.Result.mkSuccess(2, [1, 2])

    const act: P.Result<[number, number]> = P.run(p)(input)

    expect(act).toStrictEqual(exp)
  })
  test("many1", () => {
    const input = [2, 4, 8, 1, 3, 5]

    const pfirst = P.test<number>(x => x === 2)
    const pevens = P.test<number>(x => x % 2 === 0)

    const p =
      P.pipe2(
        P.map(pfirst, x => x.toString()),
        P.many(pevens),
        (first, odds) => ([first, odds] as [string, number[]])
      )
    const exp: P.Result<[string, number[]]> = P.Result.mkSuccess(3, ["2", [4, 8]])

    const act: P.Result<[string, number[]]> = P.run(p)(input)

    expect(act).toStrictEqual(exp)
  })
  test("many alt", () => {
    const input = [2, 4, 8, 1, 3, 5, 10, 12]
    const pevens = P.test<number>(x => x % 2 === 0)
    const podds = P.test<number>(x => x % 2 !== 0)

    const p =
      P.pipe2(
        P.many(pevens),
        P.many(podds),
        (evens, odds) => [evens, odds]
      )

    const exp: P.Result<number[][]> = P.Result.mkSuccess(6, [[2, 4, 8], [1, 3, 5]])

    const act: P.Result<number[][]> = P.run(p)(input)

    expect(act).toStrictEqual(exp)
  })
  test("many1", () => {
    const input = [2, 4, 8, 1, 3, 5, 10, 12]
    const pevens = P.test<number>(x => x % 2 === 0)
    const podds = P.test<number>(x => x % 2 !== 0)

    const p =
      P.many(
        P.alt(
          P.many1(pevens),
          P.many1(podds),
        )
      )

    const exp: P.Result<number[][]> = P.Result.mkSuccess(8, [[2, 4, 8], [1, 3, 5], [10, 12]])

    const act: P.Result<number[][]> = P.run(p)(input)

    expect(act).toStrictEqual(exp)
  })
  test("eof fail", () => {
    const input = [2, 4, 8, 9]
    const pevens = P.test<number>(x => x % 2 === 0)

    const p =
      P.eof(
        P.many(pevens)
      )

    const exp: P.Result<number[]> = P.Result.mkError()

    const act: P.Result<number[]> = P.run(p)(input)

    expect(act).toStrictEqual(exp)
  })
  test("eof success", () => {
    const input = [2, 4, 8]
    const pevens = P.test<number>(x => x % 2 === 0)

    const p =
      P.eof(
        P.many(pevens)
      )

    const exp: P.Result<number[]> = P.Result.mkSuccess(3, [2, 4, 8])

    const act: P.Result<number[]> = P.run(p)(input)

    expect(act).toStrictEqual(exp)
  })
})
