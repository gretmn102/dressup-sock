import { Option, Pair } from "@fering-org/functional-helper"

export type WithTarget<Event, Target> = Event & { currentTarget: Target }

export type Deferrer<T> =
  | ["HasNotStartedYet"]
  | ["InProgress"]
  | ["Resolved", T]

import * as Document from "./document"

export type CategoriesPage = {
  selected: Option<Document.LayersCatalog.Pos>
}
export module CategoriesPage {
  export function create(): CategoriesPage {
    return {
      selected: Option.mkNone()
    }
  }

  export function changePosition(
    categoriesPage: CategoriesPage,
    root: Document.Root,
    index: Document.LayersCatalog.Pos,
  ): Pair<CategoriesPage, Option<Document.Root>> {
    return Option.reduce(
      categoriesPage.selected,
      srcIndex => {
        const newRoot = Document.LayersCatalog.pickAndMove(root, srcIndex, index)
        return Pair.mk({ selected: Option.mkNone() }, Option.mkSome(newRoot))
      },
      () => {
        return Pair.mk({ selected: Option.mkSome(index) }, Option.mkNone())
      }
    )
  }

  export function isSelected(
    categoriesPage: CategoriesPage,
    pos: Document.LayersCatalog.Pos,
  ): boolean {
    return Option.reduce(
      categoriesPage.selected,
      lastPos => Document.LayersCatalog.Pos.isEqual(lastPos, pos),
      () => false
    )
  }
}

export type LayersPositionPage = Option<number>
export module LayersPositionPage {
  export function create(): LayersPositionPage { return Option.mkNone() }

  export function changeLayerPosition(
    layersPositionPage: LayersPositionPage,
    root: Document.Root,
    svg: SVGElement,
    index: number,
  ): Pair<LayersPositionPage, Option<Document.Root>> {
    return Option.reduce(
      layersPositionPage,
      srcIndex => {
        if (srcIndex === index) {
          return Pair.mk(Option.mkNone(), Option.mkNone())
        } else {
          const newRoot = Document.LayersPosition.pickAndMove(root, svg, srcIndex, index)
          return Pair.mk(Option.mkNone(), Option.mkSome(newRoot))
        }
      },
      () => Pair.mk(Option.mkSome(index), Option.mkNone())
    )
  }

  export function isSelected(layersPositionPage: LayersPositionPage, index: number) {
    return Option.reduce(
      layersPositionPage,
      lastIndex => lastIndex === index,
      () => false
    )
  }
}

export type Page =
  | ["Categories", CategoriesPage]
  | ["LayersPosition", LayersPositionPage]
export module Page {
  export function mkCategories(categoriesPage: CategoriesPage): Page {
    return ["Categories", categoriesPage]
  }

  export function mkCategoriesEmpty(): Page {
    return ["Categories", CategoriesPage.create()]
  }

  export function mkLayersPosition(layersPositionPage: LayersPositionPage): Page {
    return ["LayersPosition", layersPositionPage]
  }

  export function mkLayersPositionEmpty(): Page {
    return ["LayersPosition", LayersPositionPage.create()]
  }

  export function updateLayersPosition(
    page: Page,
    update: (layersPositions: LayersPositionPage) => LayersPositionPage
  ): Page {
    if (page[0] === "LayersPosition") {
      return ["LayersPosition", update(page[1])]
    } else {
      throw new Error(`expected LayersPosition but ${page[0]}`)
    }
  }
}
