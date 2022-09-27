import update from "immutability-helper"

import * as IdSerializator from "./idSerializator"
import * as UniversalParser from "./universalParser"

export type LayerContent = {
  svg: SVGGElement
  isHidden: boolean
  name: string
}
export module LayerContent {
  export function isHiddenBySvg(svg: SVGGElement) {
    const visibility = svg.getAttribute("visibility")
    if (visibility && visibility === "hidden") {
      return true
    }

    return false
  }

  export function isHidden(layerContent: LayerContent) {
    return layerContent.isHidden
  }

  export function setHidden(layerContent: LayerContent, isHidden: boolean): LayerContent {
    if (isHidden) {
      layerContent.svg.setAttribute("visibility", "hidden")
    } else {
      layerContent.svg.setAttribute("visibility", "")
    }
    return update(layerContent, { isHidden: { $set: isHidden } })
  }

  export function toggleVisible(layerContent: LayerContent): LayerContent {
    return setHidden(layerContent, !layerContent.isHidden)
  }
}

export type Element = {
  content: LayerContent
}
export module Element {
  export function isHidden(el: Element) {
    return LayerContent.isHidden(el.content)
  }

  export function toggleVisible(el: Element): Element {
    return update(el, {
      content: {
        $set: LayerContent.toggleVisible(el.content)
      }
    })
  }

  export function setHidden(el: Element, isHidden: boolean): Element {
    return update(el, {
      content: {
        $set: LayerContent.setHidden(el.content, isHidden)
      }
    })
  }
}

export type Category = {
  content: LayerContent
  isInclude: boolean
  elements: Element []
}
export module Category {
  export function isHidden(category: Category) {
    return LayerContent.isHidden(category.content)
  }

  export function isHiddenElement(category: Category, idx: number) {
    const el = category.elements[idx]
    if (el) {
      return LayerContent.isHidden(el.content)
    }
  }

  export function toggleVisible(category: Category): Category {
    return update(category, {
      content: {
        $set: LayerContent.toggleVisible(category.content)
      }
    })
  }

  export function toggleVisibleElement(category: Category, elementIdx: number): Category | undefined {
    const el = category.elements[elementIdx]
    if (el) {
      if (category.isInclude) {
        return update(category, {
          elements: {
            $set: category.elements.map((element, index) => {
              return Element.setHidden(element, index !== elementIdx)
            })
          }
        })
      } else {
        return update(category, {
          elements: {
            [elementIdx]: {
              $set: Element.toggleVisible(el)
            }
          }
        })
      }
    }
  }
}

export type Layer =
  | ["Element", Element]
  | ["Category", Category]
export module Layer {
  export function mkElement(element: Element): Layer {
    return ["Element", element]
  }

  export function mkCategory(category: Category): Layer {
    return ["Category", category]
  }
}

export type LayerList = Layer[]
export module LayerList {
  export type Pos =
    | ["Element", number]
    /** `[categoryIdx, elementIdx]` */
    | ["Category", [number, number]]
  export module Pos {
    export function mkElement(index: number): Pos {
      return ["Element", index]
    }

    export function mkCategory(categoryIndex: number, elementIndex: number): Pos {
      return ["Category", [categoryIndex, elementIndex]]
    }

    export function map<T>(
      pos: Pos,
      mappingCategory: (categoryIdx: number, elementIdx: number) => T,
      mappingElement: (idx: number) => T,
    ): T {
      switch (pos[0]) {
        case "Category": {
          const [categoryIdx, elementIdx] = pos[1]
          return mappingCategory(categoryIdx, elementIdx)
        }

        case "Element": {
          const idx = pos[1]
          return mappingElement(idx)
        }
      }
    }
  }

  export function toggleVisible(layers: LayerList, pos: Pos): LayerList | undefined {
    return Pos.map(
      pos,
      (categoryIdx, elementIdx) => {
        const layer = layers[categoryIdx]
        if (layer && layer[0] === "Category") {
          const res = Category.toggleVisibleElement(layer[1], elementIdx)
          if (res) {
            return update(layers, {
              [categoryIdx]: { $set: Layer.mkCategory(res) }
            })
          }
        }
      },
      idx => {
        const layer = layers[idx]
        if (layer && layer[0] === "Element") {
          const res = Element.toggleVisible(layer[1])
          return update(layers, {
            [idx]: { $set: Layer.mkElement(res) }
          })
        }
      }
    )
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
          x => ["Category", x] as Layer
        ),
        UniversalParser.map(
          pelement,
          x => ["Element", x] as Layer
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
