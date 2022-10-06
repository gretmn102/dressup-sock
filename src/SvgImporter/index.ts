import * as IdSerializator from "./idSerializator"
import * as UniversalParser from "../utils/universalParser"
import { LayerContainer, Category, LayersCatalog, LayerOrCategory, type Root, type LayerId, Layer } from "../document"
import { Result } from "../common"

type Token = [SVGGElement, IdSerializator.Layer]
type Parser<T> = UniversalParser.Parser<Token, T>

export const getLayers = (() => {
  const pelement: Parser<LayerContainer> =
    UniversalParser.testMap(([svg, layerProps]) => {
      if (layerProps.type[0] === "Element") {
        const el: LayerContainer = {
          id: svg.id
        }
        return el
      }
    })

  const pelements: Parser<LayerContainer[]> =
    UniversalParser.many(pelement)

  const pcategory: Parser<Category> =
    UniversalParser.pipe2(
      UniversalParser.test(x => x[1].type[0] === "Category"),
      pelements,
      ((first, elements) => {
        const [svg, layerProps] = first
        const category: Category = {
          id: svg.id,
          isInclude: layerProps.type[0] === "Category" ? layerProps.type[1].isInclude : false,
          elements
        }
        return category
      })
    )

  const players: Parser<LayersCatalog> =
    UniversalParser.many(
      UniversalParser.alt(
        UniversalParser.map(
          pcategory,
          x => LayerOrCategory.mkCategory(x)
        ),
        UniversalParser.map(
          pelement,
          x => LayerOrCategory.mkElement(x)
        )
      )
    )

  const playersEof: Parser<LayersCatalog> =
    UniversalParser.eof(players)

  const run = UniversalParser.run(playersEof)

  return (rawLayers: Token[]) => {
    return run(rawLayers)
  }
})()

export function importSvg(svg: Document): Result<Root, string> {
  const layers = (() => {
    const layers: Token[] = Array()
    for (const g of svg.getElementsByTagName("g")) {
      if (g.hasAttribute("id")) {
        layers.push([g, IdSerializator.deserialize(g.id)])
      }
    }
    return layers.reverse()
  })()

  return UniversalParser.Result.reduce(
    getLayers(layers),
    ([_, layersCatalog]) => {
      const dicLayers = new Map<LayerId, Layer>()
      for (const [svg, x] of layers) {
        const layer: Layer = {
          id: svg.id,
          name: x.name,
          isHidden: Layer.isHiddenBySvg(svg),
          svg: svg,
        }
        dicLayers.set(svg.id, layer)
      }

      return Result.mkOk({
        layers: dicLayers,
        layersPosition: layers.map(([svg, _]) => svg.id),
        layersCatalog: layersCatalog,
      })
    },
    () => Result.mkError("Error"),
    () => Result.mkError("Eof"),
  )
}
