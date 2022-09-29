import {describe, expect, test} from '@jest/globals'
import { JSDOM } from "jsdom"

import type * as P from '../utils/universalParser'
import type * as LayerList from "../layerList"
import * as SvgImporter from "."

export type LayerContent = {
  name: string
  isHidden: boolean
}
export module LayerContent {
  export function ofLayer(x: LayerList.LayerContent): LayerContent {
    return {
      name: x.name,
      isHidden: x.isHidden
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
  isInclude: boolean
}
export module Category {
  export function ofLayer(x: LayerList.Category): Category {
    return {
      content: LayerContent.ofLayer(x.content),
      elements: x.elements.map(x => Element.ofLayer(x)),
      isInclude: x.isInclude,
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

function getSvgsFromString(rawSvg: string): P.Result<LayerList.LayerList> {
  const jsdom = new JSDOM(rawSvg, { contentType: "image/svg+xml" })

  return SvgImporter.importSvg(jsdom.window.document)

}

async function getSvgsFromFile(path: string): Promise<P.Result<LayerList.LayerList>> {
  const jsdom = await JSDOM.fromFile(path, { contentType: "image/svg+xml" })

  return SvgImporter.importSvg(jsdom.window.document)
}

describe("LayerList.getLayers", () => {
  test("sample", async () => {
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
        " <g id=\"__x003e__x002b__x0020_категория_x0020_с_x0020_включениями\">",
        " </g>",
        " <g id=\"эелемент_x0020_вне_x0020_категории\">",
        " </g>",
        "</svg>",
      ].join("\n")

    const exp: Layer[] = [
      [
        "Element",
        {
          "content": {
            "isHidden": false,
            "name": "эелемент вне категории"
          }
        }
      ],
      [
        "Category",
        {
          "content": {
            "isHidden": false,
            "name": "категория с включениями"
          },
          "isInclude": true,
          "elements": [
            {
              "content": {
                "isHidden": true,
                "name": "носок 1"
              }
            },
            {
              "content": {
                "isHidden": false,
                "name": "носок раскрас"
              }
            }
          ]
        }
      ],
      [
        "Category",
        {
          "content": {
            "isHidden": false,
            "name": "туловище"
          },
          "isInclude": false,
          "elements": [
            {
              "content": {
                "isHidden": false,
                "name": "мохровая штука"
              }
            }
          ]
        }
      ]
    ]

    const act = (() => {
      const res = getSvgsFromString(sample)
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
