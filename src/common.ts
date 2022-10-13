export type WithTarget<Event, Target> = Event & { currentTarget: Target }

export type Deferrer<T> =
  | ["HasNotStartedYet"]
  | ["InProgress"]
  | ["Resolved", T]

export type Result<Ok, Error> = ["Ok", Ok] | ["Error", Error]
export module Result {
  export function mkOk<Ok, Error>(v: Ok): Result<Ok, Error> {
    return ["Ok", v]
  }

  export function mkError<Ok, Error>(v: Error): Result<Ok, Error> {
    return ["Error", v]
  }

  export function reduce<Ok, Error, T>(
    res: Result<Ok,Error>,
    okReduction: (v: Ok) => T,
    errorReduction: (v: Error) => T
  ): T {
    switch (res[0]) {
      case "Ok":
        return okReduction(res[1])

      case "Error":
        return errorReduction(res[1])
    }
  }
}

export type Option<T> = T | undefined
export module Option {
  export function mkSome<T>(v: T): Option<T> {
    return v
  }

  export function mkNone<T>(): Option<T> {
    return undefined
  }

  export function reduce<T, U>(
    option: Option<T>,
    someReduction: (v: T) => U,
    noneReduction: () => U,
  ): U {
    if (option === undefined) {
      return noneReduction()
    } else {
      return someReduction(option)
    }
  }

  export function isSome<T>(option: Option<T>): boolean {
    return option !== undefined
  }
}

export type Choice<T, U> =
  | ["Choice1Of2", T]
  | ["Choice2Of2", U]
export module Choice {
  export function mkChoice1Of2<T, U>(x: T): Choice<T, U> {
    return ["Choice1Of2", x]
  }

  export function mkChoice2Of2<T, U>(x: U): Choice<T, U> {
    return ["Choice2Of2", x]
  }

  export function reduce<T, U, V>(
    choice: Choice<T, U>,
    choice1Of2Reduce: (x: T) => V,
    choice2Of2Reduce: (x: U) => V,
  ): V {
    switch (choice[0]) {
      case "Choice1Of2":
        return choice1Of2Reduce(choice[1])
      case "Choice2Of2":
        return choice2Of2Reduce(choice[1])
    }
  }
}

export type Pair<T, U> = [T, U]
export module Pair {
  export function mk<T, U>(x: T, y: U): Pair<T, U> {
    return [x, y]
  }

  export function reduce<T, U, V>(
    pair: Pair<T, U>,
    reduce: (x: T, y: U) => V,
  ): V {
    const [x, y] = pair
    return reduce(x, y)
  }

  export function fst<T, U>(pair: Pair<T, U>): T {
    return pair[0]
  }

  export function snd<T, U>(pair: Pair<T, U>): U {
    return pair[1]
  }
}

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
