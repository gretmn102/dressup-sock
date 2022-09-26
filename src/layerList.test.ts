import {describe, expect, test} from '@jest/globals'
import { JSDOM } from "jsdom"

import * as LayerList from "./layerList"

export type LayerContent = {
  name: string
}
export module LayerContent {
  export function ofLayer(x: LayerList.LayerContent): LayerContent {
    return {
      name: x.name
    }
  }
}

export type Element = {
  content: LayerContent
}
export module Element {
  export function ofLayer(x: LayerList.Element): Element {
    return {
      content: LayerContent.ofLayer(x.content)
    }
  }
}

export type Category = {
  content: LayerContent
  elements: Element []
}
export module Category {
  export function ofLayer(x: LayerList.Category): Category {
    return {
      content: LayerContent.ofLayer(x.content),
      elements: x.elements.map(x => Element.ofLayer(x))
    }
  }
}

export type Layer =
  | ["Element", Element]
  | ["Category", Category]
export module Layer {
  export function ofLayer(x: LayerList.Layer): Layer {
    switch (x[0]) {
      case "Element":
        return ["Element", Element.ofLayer(x[1])]
      case "Category":
        return ["Category", Category.ofLayer(x[1])]
    }
  }
}

function getSvgsFromJSDOM(jsdom: JSDOM): SVGGElement[]  {
  const svg = jsdom.window.document

  let rawLayers: SVGGElement[] = Array()
  for (const g of svg.getElementsByTagName("g")) {
    if (g.hasAttribute("id")) {
      rawLayers.push(g)
    }
  }

  return rawLayers
}

function getSvgsFromString(rawSvg: string): SVGGElement[] {
  const jsdom = new JSDOM(rawSvg, { contentType: "image/svg+xml" })

  return getSvgsFromJSDOM(jsdom)

}

async function getSvgsFromFile(path: string): Promise<SVGGElement[]> {
  const jsdom = await JSDOM.fromFile(path, { contentType: "image/svg+xml" })

  return getSvgsFromJSDOM(jsdom)
}

describe("LayerList.getLayers", () => {
  test("sample", async () => {
    // const rawLayers = await getSvgsFromFile("./public/sample.svg")
    const sample =
      [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">",
        "<svg>",
        " <g id=\"мохровая_x0020_штука\">",
        " </g>",
        " <g id=\"__x003e__x0020_туловище\">",
        " </g>",
        " <g id=\"носок_x0020_раскрас\">",
        " </g>",
        " <g id=\"носок_x0020_1\" visibility=\"hidden\">",
        " </g>",
        "</svg>",
      ].join("\n")

    const rawLayers = getSvgsFromString(sample)

    const exp: Layer[] = [
      [
        "Element",
        {
          "content": {
            "name": "мохровая штука"
          }
        }
      ],
      [
        "Category",
        {
          "content": {
            "name": "туловище"
          },
          "elements": [
            {
              "content": {
                "name": "носок раскрас"
              }
            },
            {
              "content": {
                "name": "носок 1"
              }
            }
          ]
        }
      ]
    ]

    const act = (() => {
      const res = LayerList.getLayers(rawLayers)
      if (res[0] === "Success") {
        const [_, xs] = res[1]
        const ys = xs.map((x) => Layer.ofLayer(x))
        return ys
      }

      return res
    })()

    expect(act).toStrictEqual(exp)
  })
})
