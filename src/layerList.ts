import * as IdSerializator from "./idSerializator"
import * as UniversalParser from "./universalParser"

export type LayerContent = {
  svg: SVGGElement
  name: string
}

export type Element = {
  content: LayerContent
}

export type Category = {
  content: LayerContent
  elements: Element []
}

export type Layer =
  | ["Element", Element]
  | ["Category", Category]

export module Layer {
  export function isHidden(layer: Layer) {
    const layerContent = layer[1].content
    const visibility = layerContent.svg.getAttribute("visibility")
    if (visibility && visibility === "hidden") {
      return true
    }

    return false
  }

  export function toggleVisible(layer: Layer) {
    const layerContent = layer[1].content
    if (isHidden(layer)) {
      layerContent.svg.setAttribute("visibility", "")
    } else {
      layerContent.svg.setAttribute("visibility", "hidden")
    }
  }
}

type InputElement = [SVGGElement, IdSerializator.Layer]
type Parser<T> = UniversalParser.Parser<InputElement, T>

export const getLayers = (() => {
  const pelement: Parser<Element> =
    UniversalParser.testMap(([svg, layerProps]) => {
      if (layerProps.type[0] === "Element") {
        const el: Element = {
          content: {
            svg,
            name: layerProps.name
          }
        }
        return el
      }
    })

  const pelements: Parser<Element[]> =
    UniversalParser.many(pelement)

  const pcategory: Parser<Category> =
    UniversalParser.pipe2(
      UniversalParser.test(x => x[1].type[0] === "Category"),
      pelements,
      ((first, elements) => {
        const [svg, layerProps] = first
        const category: Category = {
          content: {
            svg,
            name: layerProps.name
          },
          elements
        }
        return category
      })
    )

  const players: Parser<Layer[]> =
    UniversalParser.many(
      UniversalParser.alt(
        UniversalParser.map(
          pcategory,
          x => ["Category", x] as Layer
        ),
        UniversalParser.map(
          pelement,
          x => ["Element", x] as Layer
        )
      )
    )

  const playersEof: Parser<Layer[]> =
    UniversalParser.eof(players)

  return (svgs: SVGGElement[]) => {
    const rawLayers: InputElement[] =
      svgs.map(x => [x, IdSerializator.deserialize(x.id)])

    return UniversalParser.run(playersEof)(rawLayers)
  }
})()
