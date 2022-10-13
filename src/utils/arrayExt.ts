export module ArrayExt {
  export function takeWhile<T, U>(
    inputArray: T[],
    startIndex: number,
    endIndex: number | undefined,
    mapping: ((curr: T, index: number) => U | undefined)
  ): [number, U[]] | undefined {
    const inputArraylength = endIndex ? endIndex + 1 : inputArray.length
    const resultArray = new Array(inputArraylength - startIndex)

    let index = startIndex
    for (; index < inputArraylength; index++) {
      const element = mapping(inputArray[index], index)
      if (element) {
        resultArray[index - startIndex] = element

      } else {
        // trim array
        resultArray.length = index - startIndex

        break
      }
    }

    if (resultArray.length > 0) {
      return [index, resultArray]
    }
  }

  /** aka `reduce<U>(callbackfn: (previousValue: U, currentValue: never, currentIndex: number, array: never[]) => U, initialValue: U): U` */
  export function fold<T, U>(arr: T[], state: U, folding: (state: U, element: T, index: number) => U): U {
    let newState = state
    for (let index = 0; index < arr.length; index++) {
      const element = arr[index]
      newState = folding(newState, element, index)
    }
    return newState
  }

  export function swap<T>(arr: T[], srcIndex: number, dstIndex: number): T[] {
    if (!(0 <= srcIndex && srcIndex < arr.length)) {
      throw new Error("The srcIndex was outside the range of elements in the list.")
    }
    if (!(0 <= dstIndex && dstIndex < arr.length)) {
      throw new Error("The dstIndex was outside the range of elements in the list.")
    }

    if (srcIndex === dstIndex) {
      return new Array(...arr)
    }

    const newArray = new Array(arr.length)

    const apply = (srcIndex: number, dstIndex: number) => {
      for (let i = 0; i < srcIndex; i++) {
        newArray[i] = arr[i]
      }
      newArray[srcIndex] = arr[dstIndex]
      for (let i = srcIndex + 1; i < dstIndex; i++) {
        newArray[i] = arr[i]
      }
      newArray[dstIndex] = arr[srcIndex]
      for (let i = dstIndex + 1; i < arr.length; i++) {
        newArray[i] = arr[i]
      }
    }

    if (srcIndex < dstIndex) {
      apply(srcIndex, dstIndex)
    } else {
      apply(dstIndex, srcIndex)
    }

    return newArray
  }

  export function pickAndMove<T>(arr: T[], srcIndex: number, dstIndex: number): T[] {
    if (!(0 <= srcIndex && srcIndex < arr.length)) {
      throw new Error("The srcIndex was outside the range of elements in the list.")
    }
    if (!(0 <= dstIndex && dstIndex < arr.length)) {
      throw new Error("The dstIndex was outside the range of elements in the list.")
    }

    if (srcIndex === dstIndex) {
      return new Array(...arr)
    }

    const newArray = new Array(arr.length)

    if (srcIndex < dstIndex) {
      for (let i = 0; i < srcIndex; i++) {
        newArray[i] = arr[i]
      }
      for (let i = srcIndex + 1; i <= dstIndex; i++) {
        newArray[i - 1] = arr[i]
      }
      newArray[dstIndex] = arr[srcIndex]
      for (let i = dstIndex + 1; i < arr.length; i++) {
        newArray[i] = arr[i]
      }
    } else {
      for (let i = 0; i < dstIndex; i++) {
        newArray[i] = arr[i]
      }
      newArray[dstIndex] = arr[srcIndex]
      for (let i = dstIndex; i < srcIndex; i++) {
        newArray[i + 1] = arr[i]
      }
      for (let i = srcIndex + 1; i < arr.length; i++) {
        newArray[i] = arr[i]
      }
    }

    return newArray
  }

  export function insert<T>(arr: T[], item: T, at: number): T[] {
    if (!(0 <= at && at < arr.length)) {
      throw new Error("The srcIndex was outside the range of elements in the list.")
    }

    const newArray = new Array<T>(arr.length + 1)
    for (let index = 0; index < at; index++) {
      newArray[index] = arr[index]
    }
    newArray[at] = item
    for (let index = at; index < arr.length; index++) {
      newArray[index + 1] = arr[index]
    }

    return newArray
  }

  export function remove<T>(arr: T[], at: number): T[] {
    if (!(0 <= at && at < arr.length)) {
      throw new Error("The srcIndex was outside the range of elements in the list.")
    }

    const newArray = new Array<T>(arr.length - 1)
    for (let index = 0; index < at; index++) {
      newArray[index] = arr[index]
    }
    for (let index = at + 1; index < arr.length; index++) {
      newArray[index - 1] = arr[index]
    }

    return newArray
  }
}
