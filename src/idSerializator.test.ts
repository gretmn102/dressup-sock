import {describe, expect, test} from '@jest/globals'

import type { Layer } from './idSerializator'
import { deserialize } from './idSerializator'

describe("deserializeTests", () => {
  test("__x003e__x002b__x0020_лапы", () => {
    const sample = "__x003e__x002b__x0020_лапы"
    const exp: Layer = {
      type: ["Category", { isInclude: true }],
      name: "лапы"
    }

    let act = deserialize(sample)

    expect(act).toStrictEqual(exp)
  })

  test("__x003e__x0020_лапы", () => {
    const sample = "__x003e__x0020_лапы"
    const exp: Layer = {
      type: ["Category", { isInclude: false }],
      name: "лапы"
    }

    let act = deserialize(sample)

    expect(act).toStrictEqual(exp)
  })

  test("лапы_x0020_и_x0020_хвост", () => {
    const sample = "лапы_x0020_и_x0020_хвост"
    const exp: Layer = {
      type: ["Element"],
      name: "лапы и хвост"
    }

    let act = deserialize(sample)

    expect(act).toStrictEqual(exp)
  })

  test("_3D-очки", () => {
    const sample = "_3D-очки"
    const exp: Layer = {
      type: ["Element"],
      name: "3D-очки"
    }

    let act = deserialize(sample)

    expect(act).toStrictEqual(exp)
  })
})
