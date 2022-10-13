import * as P from "parsimmon"

import { Option } from "../common"

module Utils {
  export function opt<T>(p: P.Parser<T>): P.Parser<Option<T>> {
    return P.alt(p, P.succeed(Option.mkNone()))
  }

  /** `many1Satisfy` from FParsec */
  export function takeWhile1(predicate: ((char: string) => boolean)) {
    return P.seqMap(
      P.test(predicate),
      P.takeWhile(predicate),
      ((first, rest) => first + rest)
    )
  }
}

export type Type =
  | ["Element"]
  | ["Category", { isInclude: boolean }]

export type Layer = {
  type: Type
  name: string
}

export const deserialize = (() => {
  const pgt = P.string("_x003e_") // '>'
  const pplus = P.string("_x002b_") // '+'
  const pspace = P.string("_x0020_") // ' '

  const pcategory =
    pgt
      .then(Utils.opt(pplus))
      .map(plus => ({ isInclude: Option.isSome(plus) }))

  const pname =
    P.alt(
      Utils.takeWhile1(c => c !== "_"),
      pspace.map(_ => " "),
      P.any
    )
      .many()
      .tie()

  const pstart: P.Parser<Layer> =
    Utils.opt(P.string("_"))
      .then(
        P.seqMap(
          Utils.opt(pcategory).trim(pspace.many()),
          pname,
          ((category, name) => {
            const x: Layer = {
              type: Option.reduce<{isInclude: boolean}, Type>(
                category,
                category => ["Category", category],
                () => ["Element"]
              ),
              name
            }

            return x
          })
        )
      )

  return (id: string) => pstart.tryParse(id)
})()
