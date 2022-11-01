import update from "immutability-helper"
import { ArrayExt } from "@fering-org/functional-helper"

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

  export function pickAndMoveElement(
    category: Category,
    srcIndex: number,
    dstIndex: number,
  ): Category {
    return update(category, {
      elements: {
        $apply: (elements: LayerContainer[]) => ArrayExt.pickAndMove(elements, srcIndex, dstIndex)
      }
    })
  }

  export function insertElement(
    category: Category,
    element: LayerContainer,
    index: number
  ): Category {
    return update(category, {
      elements: {
        $apply: (elements: LayerContainer[]) =>
          index < elements.length - 1 ?
            ArrayExt.insertBefore(elements, element, index)
          : ArrayExt.insertAfter(elements, element, index)
      }
    })
  }

  export function removeElement(
    category: Category,
    index: number,
  ): Category {
    return update(category, {
      elements: {
        $apply: (elements: LayerContainer[]) => ArrayExt.remove(elements, index)
      }
    })
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
    | ["Category", number]
    /** `[categoryIdx, elementIdx]` */
    | ["CategoryElement", [number, number]]
  export module Pos {
    export function mkElement(index: number): Pos {
      return ["Element", index]
    }

    export function mkCategory(categoryIndex: number): Pos {
      return ["Category", categoryIndex]
    }

    export function mkCategoryElement(categoryIndex: number, elementIndex: number): Pos {
      return ["CategoryElement", [categoryIndex, elementIndex]]
    }

    export function isElementOrCategory(pos: Pos) {
      return pos[0] === "Category" || pos[0] === "Element"
    }

    export function getElementOrCategory(pos: Pos) {
      if (pos[0] === "Category" || pos[0] === "Element") {
        return pos[1]
      }
      throw new Error(`expected Category or Element but ${pos[0]}`)
    }

    export function getCategoryElement(pos: Pos) {
      if (pos[0] === "CategoryElement") {
        return pos[1]
      }
      throw new Error(`expected Category but ${pos[0]}`)
    }

    export function map<T>(
      pos: Pos,
      mappingElement: (idx: number) => T,
      mappingCategory: (categoryIdx: number) => T,
      mappingCategoryElement: (categoryIdx: number, elementIdx: number) => T,
    ): T {
      switch (pos[0]) {
        case "CategoryElement": {
          const [categoryIdx, elementIdx] = pos[1]
          return mappingCategoryElement(categoryIdx, elementIdx)
        }

        case "Element": {
          const idx = pos[1]
          return mappingElement(idx)
        }

        case "Category": {
          const idx = pos[1]
          return mappingCategory(idx)
        }
      }
    }

    export function isEqual(pos1: Pos, pos2: Pos): boolean {
      if (pos1[0] === "Element" && pos2[0] === "Element") {
        return pos1[1] === pos2[1]
      } else if (pos1[0] === "Category" && pos2[0] === "Category") {
        return pos1[1] === pos2[1]
      } else if (pos1[0] === "CategoryElement" && pos2[0] === "CategoryElement") {
        const [pos1Category, pos1Element] = pos1[1]
        const [pos2Category, pos2Element] = pos2[1]
        return pos1Category === pos2Category && pos1Element === pos2Element
      }
      return false
    }
  }

  export function toggleVisible(
    layers: LayersCatalog,
    root: Root,
    pos: Pos,
  ): Root | undefined {
    return Pos.map(
      pos,
      idx => {
        const layer = layers[idx]
        if (layer && layer[0] === "Element") {
          const res = LayerContainer.toggleVisible(layer[1], root)
          if (res) {
            return res
          }
        }
      },
      categoryIdx => {
        throw new Error("the visibility of the category cannot be changed")
      },
      (categoryIdx, elementIdx) => {
        const layer = layers[categoryIdx]
        if (layer && layer[0] === "Category") {
          const res = Category.toggleVisibleElement(layer[1], root, elementIdx)
          if (res) {
            return res
          }
        }
      },
    )
  }

  export function getCategory(layersCatalog: LayersCatalog, index: number) {
    const res = layersCatalog[index]
    if (res[0] === "Category") {
      return res[1]
    }
    throw new Error(`expected Category but ${res[0]}`)
  }

  export function pickAndMove(
    root: Root,
    srcPos: Pos,
    dstPos: Pos,
  ): Root {
    if (Pos.isElementOrCategory(srcPos) && Pos.isElementOrCategory(dstPos)) {
      const srcIndex = Pos.getElementOrCategory(srcPos)
      const dstIndex = Pos.getElementOrCategory(dstPos)

      return update(root, {
        layersCatalog: {
          $apply: (layersCatalog: LayersCatalog) => ArrayExt.pickAndMove(layersCatalog, srcIndex, dstIndex)
        }
      })
    } else {
      const [srcCategoryIndex, srcElementIndex] = Pos.getCategoryElement(srcPos)
      const [dstCategoryIndex, dstElementIndex] = Pos.getCategoryElement(dstPos)
      if (srcCategoryIndex === dstCategoryIndex) {
        return update(root, {
          layersCatalog: {
            $apply: (layersCatalog: LayersCatalog) => {
              const srcCategory = getCategory(layersCatalog, srcCategoryIndex)
              return update(layersCatalog, {
                [srcCategoryIndex]: {
                  $set: LayerOrCategory.mkCategory(
                    Category.pickAndMoveElement(srcCategory, srcElementIndex, dstElementIndex)
                  )
                }
              })
            }
          }
        })
      } else {
        return update(root, {
          layersCatalog: {
            $apply: (layersCatalog: LayersCatalog) => {
              const srcCategory = getCategory(layersCatalog, srcCategoryIndex)
              const dstCategory = getCategory(layersCatalog, dstCategoryIndex)
              const srcElement = srcCategory.elements[srcElementIndex]
              return update(layersCatalog, {
                [srcCategoryIndex]: {
                  $set: LayerOrCategory.mkCategory(
                    Category.removeElement(srcCategory, srcElementIndex)
                  )
                },
                [dstCategoryIndex]: {
                  $set: LayerOrCategory.mkCategory(
                    Category.insertElement(dstCategory, srcElement, dstElementIndex)
                  )
                },
              })
            }
          }
        })
      }
    }
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
