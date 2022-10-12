import update from "immutability-helper"

import { ArrayExt } from "./utils/arrayExt"
import NodeExt from "./utils/nodeExt"

export type LayerId = string

export type Layer = {
  id: LayerId
  name: string
  isHidden: boolean
  svg: SVGGElement
}
export module Layer {
  export function isHiddenBySvg(svg: SVGGElement) {
    const visibility = svg.getAttribute("visibility")
    if (visibility && visibility === "hidden") {
      return true
    }

    return false
  }

  export function isHidden(layer: Layer): boolean {
    return layer.isHidden
  }

  export function setVisible(layer: Layer, isHidden: boolean): Layer {
    const svg = layer.svg
    if (isHidden) {
      svg.setAttribute("visibility", "hidden")
    } else {
      svg.setAttribute("visibility", "")
    }
    return update(layer, { isHidden: { $set: isHidden } })
  }

  export function toggleVisible(layerContent: Layer): Layer {
    return setVisible(layerContent, !layerContent.isHidden)
  }
}

export type LayerContainer = {
  id: LayerId
}
export module LayerContainer {
  export function isHidden(layerContainer: LayerContainer, root: Root) {
    const layer = root.layers.get(layerContainer.id)
    if (layer) {
      return Layer.isHidden(layer)
    }
  }

  export function setVisible(
    layerContainer: LayerContainer,
    root: Root,
    isHidden: boolean,
  ): Root | undefined {
    const layer = root.layers.get(layerContainer.id)
    if (layer) {
      return Root.updateLayers(
        root,
        layers => update(layers, {
          [layerContainer.id]: { $set: Layer.setVisible(layer, isHidden) }
        })
      )
    }
  }

  export function mapVisible(
    layerContainer: LayerContainer,
    root: Root,
    mapping: (isHidden: boolean) => boolean,
  ): Root | undefined {
    const layer = root.layers.get(layerContainer.id)
    if (layer) {
      return Root.updateLayers(
        root,
        layers => update(layers, {
          [layerContainer.id]: { $set: Layer.setVisible(layer, mapping(Layer.isHidden(layer))) }
        })
      )
    }
  }

  export function toggleVisible(
    layerContainer: LayerContainer,
    root: Root
  ): Root | undefined {
    return mapVisible(layerContainer, root, isHidden => !isHidden)
  }

  export function getName(
    layerContainer: LayerContainer,
    root: Root
  ): string | undefined {
    const res = root.layers.get(layerContainer.id)
    if (res) {
      return res.name
    }
  }
}

export type Category = {
  id: LayerId
  isInclude: boolean
  elements: LayerContainer []
}
export module Category {
  export function getName(
    category: Category,
    root: Root
  ): string | undefined {
    const res = root.layers.get(category.id)
    if (res) {
      return res.name
    }
  }

  export function isHiddenElement(category: Category, root: Root, idx: number) {
    const el = category.elements[idx]
    if (el) {
      return LayerContainer.isHidden(el, root)
    }
  }

  export function toggleVisibleElement(
    category: Category,
    root: Root,
    elementIdx: number,
  ): Root | undefined {
    const el = category.elements[elementIdx]
    if (el) {
      const toggleVisibleCurrent = (): Root => {
        const res = LayerContainer.toggleVisible(el, root)
        if (res) {
          return res
        }
        throw new Error(`Not found layer by "${el.id}" id`)
      }

      if (category.isInclude) {
        if (LayerContainer.isHidden(el, root)) {
          return ArrayExt.fold(
            category.elements,
            root,
            ((root, element, index) => {
              const res = LayerContainer.setVisible(element, root, index !== elementIdx)
              if (res) {
                return res
              }
              throw new Error(`Not found layer by "${element.id}" id`)
            })
          )
        } else {
          return toggleVisibleCurrent()
        }
      } else {
        return toggleVisibleCurrent()
      }
    }
  }
}

export type LayerOrCategory =
  | ["Element", LayerContainer]
  | ["Category", Category]
export module LayerOrCategory {
  export function mkElement(element: LayerContainer): LayerOrCategory {
    return ["Element", element]
  }

  export function mkCategory(category: Category): LayerOrCategory {
    return ["Category", category]
  }
}

export type LayersCatalog = LayerOrCategory[]
export module LayersCatalog {
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

  export function toggleVisible(
    layers: LayersCatalog,
    root: Root,
    pos: Pos,
  ): Root | undefined {
    return Pos.map(
      pos,
      (categoryIdx, elementIdx) => {
        const layer = layers[categoryIdx]
        if (layer && layer[0] === "Category") {
          const res = Category.toggleVisibleElement(layer[1], root, elementIdx)
          if (res) {
            return res
          }
        }
      },
      idx => {
        const layer = layers[idx]
        if (layer && layer[0] === "Element") {
          const res = LayerContainer.toggleVisible(layer[1], root)
          if (res) {
            return res
          }
        }
      }
    )
  }
}

export type LayersPosition = LayerId[]
export module LayersPosition {
  export function pickAndMove(root: Root, rootSvg: SVGElement, srcIndex: number, dstIndex: number): Root {
    const layersPosition = root.layersPosition
    const newRoot = update(root, {
      layersPosition: {
        $set: ArrayExt.pickAndMove(layersPosition, srcIndex, dstIndex)
      }
    })

    function getSvg(index: number): SVGGElement {
      const layerId = layersPosition[index]
      if (!layerId) {
        throw new Error(`not found ${index} in root.layerPosition`)
      }
      const layer = root.layers.get(layerId)
      if (!layer) {
        throw new Error(`not found ${layerId} in root.layers`)
      }
      return layer.svg
    }

    NodeExt.pickAndMove(rootSvg, getSvg(srcIndex), getSvg(dstIndex))

    return newRoot
  }
}

export type Root = {
  layers: Map<LayerId, Layer>
  layersPosition: LayersPosition
  layersCatalog: LayersCatalog
}
export module Root {
  export function updateLayers(root: Root, updating: (layers: Map<LayerId, Layer>) => Map<LayerId, Layer>) {
    return update(root, { layers: { $apply: updating } })
  }
}
