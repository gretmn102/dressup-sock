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
}
