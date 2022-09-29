import * as IdSerializator from "./idSerializator"
import * as UniversalParser from "../utils/universalParser"
import { Element, Category, LayerContent, LayerList, Layer } from "../layerList"

type InputElement = [SVGGElement, IdSerializator.Layer]
type Parser<T> = UniversalParser.Parser<InputElement, T>

export const getLayers = (() => {
  const pelement: Parser<Element> =
    UniversalParser.testMap(([svg, layerProps]) => {
      if (layerProps.type[0] === "Element") {
        const el: Element = {
          content: {
            svg,
            isHidden: LayerContent.isHiddenBySvg(svg),
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
            isHidden: LayerContent.isHiddenBySvg(svg),
            name: layerProps.name
          },
          isInclude: layerProps.type[0] === "Category" ? layerProps.type[1].isInclude : false,
          elements
        }
        return category
      })
    )

  const players: Parser<LayerList> =
    UniversalParser.many(
      UniversalParser.alt(
        UniversalParser.map(
          pcategory,
          x => Layer.mkCategory(x)
        ),
        UniversalParser.map(
          pelement,
          x => Layer.mkElement(x)
        )
      )
    )

  const playersEof: Parser<LayerList> =
    UniversalParser.eof(players)

  return (svgs: SVGGElement[]) => {
    const rawLayers: InputElement[] =
      svgs.map(x => [x, IdSerializator.deserialize(x.id)])

    return UniversalParser.run(playersEof)(rawLayers)
  }
})()
