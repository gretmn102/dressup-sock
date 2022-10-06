import {describe, expect, test} from '@jest/globals'
import { JSDOM } from "jsdom"

import type * as Document from "../document"
import * as SvgImporter from "."
import { Result } from '../common'

export type Layer = {
  id: string
  name: string
  isHidden: boolean
}
export module Layer {
  export function ofLayer(x: Document.Layer): Layer {
    return {
      id: x.id,
      name: x.name,
      isHidden: x.isHidden,
    }
  }
}

export type Root = {
  layers: Map<Document.LayerId, Layer>
  layersPosition: Document.LayersPosition
  layersCatalog: Document.LayersCatalog
}
export module Root {
  export function ofLayer(x: Document.Root): Root {
    const layers = new Map<Document.LayerId, Layer>()
    for (const [id, layer] of x.layers) {
      layers.set(id, Layer.ofLayer(layer))
    }
    return {
      layers: layers,
      layersPosition: x.layersPosition,
      layersCatalog: x.layersCatalog,
    }
  }
}

function getSvgsFromString(rawSvg: string) {
  const jsdom = new JSDOM(rawSvg, { contentType: "image/svg+xml" })

  return SvgImporter.importSvg(jsdom.window.document)
}

async function getSvgsFromFile(path: string) {
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

    const exp: Root = {
      "layers": new Map([
        [
          "эелемент_x0020_вне_x0020_категории",
          {
            "id": "эелемент_x0020_вне_x0020_категории",
            "name": "эелемент вне категории",
            "isHidden": false,
          }
        ],
        [
          "__x003e__x002b__x0020_категория_x0020_с_x0020_включениями",
          {
            "id": "__x003e__x002b__x0020_категория_x0020_с_x0020_включениями",
            "name": "категория с включениями",
            "isHidden": false,
          }
        ],
        [
          "носок_x0020_1",
          {
            "id": "носок_x0020_1",
            "name": "носок 1",
            "isHidden": true,
          }
        ],
        [
          "носок_x0020_раскрас",
          {
            "id": "носок_x0020_раскрас",
            "name": "носок раскрас",
            "isHidden": false,
          }
        ],
        [
          "__x003e__x0020_туловище",
          {
            "id": "__x003e__x0020_туловище",
            "name": "туловище",
            "isHidden": false,
          }
        ],
        [
          "мохровая_x0020_штука",
          {
            "id": "мохровая_x0020_штука",
            "name": "мохровая штука",
            "isHidden": false,
          }
        ]
      ]),
      "layersPosition": [
        "эелемент_x0020_вне_x0020_категории",
        "__x003e__x002b__x0020_категория_x0020_с_x0020_включениями",
        "носок_x0020_1",
        "носок_x0020_раскрас",
        "__x003e__x0020_туловище",
        "мохровая_x0020_штука"
      ],
      "layersCatalog": [
        [
          "Element",
          {
            "id": "эелемент_x0020_вне_x0020_категории"
          }
        ],
        [
          "Category",
          {
            "id": "__x003e__x002b__x0020_категория_x0020_с_x0020_включениями",
            "isInclude": true,
            "elements": [
              {
                "id": "носок_x0020_1"
              },
              {
                "id": "носок_x0020_раскрас"
              }
            ]
          }
        ],
        [
          "Category",
          {
            "id": "__x003e__x0020_туловище",
            "isInclude": false,
            "elements": [
              {
                "id": "мохровая_x0020_штука"
              }
            ]
          }
        ]
      ]
    }

    const act = Result.reduce(
      getSvgsFromString(sample),
      root => Result.mkOk(Root.ofLayer(root)),
      Result.mkError
    )

    expect(act).toStrictEqual(Result.mkOk(exp))
  })
})
