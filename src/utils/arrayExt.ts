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
}
