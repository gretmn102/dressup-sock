import { describe, expect, test } from '@jest/globals'
import { JSDOM } from "jsdom"

import NodeExt from "./nodeExt"

function getAllGs(svgRoot: SVGElement): [number, SVGGElement][] {
  const gs = new Array<[number, SVGGElement]>()
  const childNodes = svgRoot.childNodes
  for (let index = 0; index < childNodes.length; index++) {
    const child = childNodes[index];
    if (child.ELEMENT_NODE === 1) {
      const x = child as Element
      if (x.tagName === "g" && x.hasAttribute("id")) {
        gs.push([index, x as SVGGElement])
      }
    }
  }
  return gs
}

const rawSvg = [
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
  "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">",
  "<svg>",
  " <g id=\"0\">",
  " </g>",
  " <g id=\"1\">",
  " </g>",
  " <g id=\"2\">",
  " </g>",
  " <g id=\"3\">",
  " </g>",
  " <g id=\"4\">",
  " </g>",
  " <g id=\"5\">",
  " </g>",
  "</svg>",
].join("\n")

describe("LayersPosition.svgPickAndMove", () => {
  function createTest(srcIndex: number, dstIndex: number): string[] {
    const jsdom = new JSDOM(rawSvg, { contentType: "image/svg+xml" })

    const svgRoot = jsdom.window.document.documentElement as unknown as SVGElement

    function toIndexId(gs: [number, SVGGElement][]): [number, string][] {
      return gs.map(([index, svg]) => [index, svg.id])
    }

    const xs = getAllGs(svgRoot)

    // console.log(JSON.stringify(toIndexId(xs), undefined, 2))
    // console.log(toIndexId(getAllGs(svgRoot)).map(([_, id]) => id), undefined, 2)

    const [srcIndex2, srcSvg] = xs[srcIndex]
    const [dstIndex2, dstSvg] = xs[dstIndex]
    NodeExt.pickAndMoveByIndex(svgRoot, srcIndex2, dstIndex2)
    // console.log(`${srcSvg.id}, ${dstSvg.id}`)

    return toIndexId(getAllGs(svgRoot)).map(([_, id]) => id)
  }

  test("1, 3", async () => {
    const act = createTest(1, 3)

    const exp = [
      "0",
      "2",
      "3",
      "1",
      "4",
      "5",
    ]

    expect(act).toStrictEqual(exp)
  })
  test("0, 5", async () => {
    const act = createTest(0, 5)

    const exp = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "0",
    ]

    expect(act).toStrictEqual(exp)
  })

  test("3, 1", async () => {
    const act = createTest(3, 1)

    const exp = [
      "0",
      "3",
      "1",
      "2",
      "4",
      "5",
    ]

    expect(act).toStrictEqual(exp)
  })
  test("5, 0", async () => {
    const act = createTest(5, 0)

    const exp = [
      "5",
      "0",
      "1",
      "2",
      "3",
      "4",
    ]

    expect(act).toStrictEqual(exp)
  })
})

describe("LayersPosition.svgPickAndMoveBySvg", () => {
  function createTest(srcIndex: number, dstIndex: number): string[] {
    const jsdom = new JSDOM(rawSvg, { contentType: "image/svg+xml" })

    const svgRoot = jsdom.window.document.documentElement as unknown as SVGElement

    function toIndexId(gs: [number, SVGGElement][]): [number, string][] {
      return gs.map(([index, svg]) => [index, svg.id])
    }

    const xs = getAllGs(svgRoot)

    // console.log(JSON.stringify(toIndexId(xs), undefined, 2))
    // console.log(toIndexId(getAllGs(svgRoot)).map(([_, id]) => id), undefined, 2)

    const [srcIndex2, srcSvg] = xs[srcIndex]
    const [dstIndex2, dstSvg] = xs[dstIndex]
    NodeExt.pickAndMove(svgRoot, srcSvg, dstSvg)
    // console.log(`${srcSvg.id}, ${dstSvg.id}`)

    return toIndexId(getAllGs(svgRoot)).map(([_, id]) => id)
  }

  test("5, 0", async () => {
    const act = createTest(5, 0)

    const exp = [
      "5",
      "0",
      "1",
      "2",
      "3",
      "4",
    ]

    expect(act).toStrictEqual(exp)
  })
})
