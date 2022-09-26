export type Result<T> =
  | ["Success", [number, T]]
  | ["Eof"]
  | ["Error"]

export module Result {
  export function mkSuccess<T>(nextIndex: number, value: T): Result<T> {
    return ["Success", [nextIndex, value]]
  }

  export function mkError<T>(): Result<T> {
    return ["Error"]
  }

  export function mkEof<T>(): Result<T> {
    return ["Eof"]
  }

  export function map<T, U>(result: Result<T>, mapping: (v: [number, T]) => [number, U]): Result<U> {
    switch (result[0]) {
      case "Success":
        return ["Success", mapping(result[1])]
      case "Error":
        return ["Error"]
      case "Eof":
        return ["Eof"]
    }
  }

  export function getErrorOrEof<T, U>(result: Result<T>): Result<U> {
    switch (result[0]) {
      case "Error":
        return ["Error"]
      case "Eof":
        return ["Eof"]
      case "Success":
        throw new Error(`expected Error or Eof but actual ${JSON.stringify(result)}`)
    }
  }
}

export type Parser<InputElement, T> = (input: InputElement[], startIndex: number) => Result<T>

export function test<InputElement>(
  pred: ((x: InputElement) => boolean)
): Parser<InputElement, InputElement> {
  return (input, startIndex) => {
    if (startIndex < input.length) {
      const x = input[startIndex]
      if (pred(x)) {
        return Result.mkSuccess(startIndex + 1, x)
      }

      return Result.mkError()
    }

    return Result.mkEof()
  }
}

export function testMap<InputElement, T>(
  mapping: ((x: InputElement) => T | undefined)
): Parser<InputElement, T> {
  return (input, startIndex) => {
    if (startIndex < input.length) {
      const res = mapping(input[startIndex])
      if (res) {
        return Result.mkSuccess(startIndex + 1, res)
      }

      return Result.mkError()
    }

    return Result.mkEof()
  }
}

export function then<InputElement, T1, T2>(
  p1: Parser<InputElement, T1>,
  p2: Parser<InputElement, T2>
): Parser<InputElement, T2> {
  return (input, startIndex) => {
    const res = p1(input, startIndex)
    if (res[0] === "Success") {
      const [startIndex, _] = res[1]
      const res2 = p2(input, startIndex)
      if (res2[0] === "Success") {
        return res2
      }

      return res2
    }

    return res
  }
}

/** Does the same as the `then` function, but returns result of the first parser */
export function trim<InputElement, T1, T2>(
  p1: Parser<InputElement, T1>,
  p2: Parser<InputElement, T2>
): Parser<InputElement, T1> {
  return (input, startIndex) => {
    const res = p1(input, startIndex)
    if (res[0] === "Success") {
      const [startIndex, _] = res[1]
      const res2 = p2(input, startIndex)
      if (res2[0] === "Success") {
        return res
      }

      return res2
    }

    return res
  }
}

export function chain<InputElement, T1, T2>(
  p: Parser<InputElement, T1>,
  f: ((x: T1) => Parser<InputElement, T2>)
): Parser<InputElement, T2> {
  return (input, startIndex) => {
    const res = p(input, startIndex)
    if (res[0] === "Success") {
      const [startIndex, r] = res[1]
      return f(r)(input, startIndex)
    }

    return res
  }
}

export function success<InputElement, T>(x: T): Parser<InputElement, T> {
  return (input, startIndex) => {
    return Result.mkSuccess(startIndex, x)
  }
}

export function fail<InputElement, T>(): Parser<InputElement, T> {
  return (input, startIndex) => {
    return Result.mkError()
  }
}

export function many<InputElement, T>(
  p: Parser<InputElement, T>
): Parser<InputElement, T[]> {
  return (inputArray, startIndex) => {
    const inputArraylength = inputArray.length
    if (startIndex < inputArraylength) {
      const resultArray: T[] = new Array()

      let index = startIndex
      for (; index < inputArraylength;) {
        const element = p(inputArray, index)
        if (element[0] === "Success") {
          const [resIndex, res] = element[1]
          index = resIndex
          resultArray.push(res)
        } else {
          break
        }
      }

      return Result.mkSuccess(index, resultArray)
    }

    return Result.mkSuccess(startIndex, [])
  }
}

export function many1<InputElement, T>(
  p: Parser<InputElement, T>
): Parser<InputElement, T[]> {
  return pipe2( // OPTIMIZE
    p,
    many(p),
    (x1, x2) => {
      return [x1, ...x2]
    }
  )
}

export function alt<InputElement, T>(
  p1: Parser<InputElement, T>,
  p2: Parser<InputElement, T>
): Parser<InputElement, T> {
  return (input, startIndex) => {
    const res = p1(input, startIndex)
    if (res[0] === "Success") {
      return res
    } else {
      const res = p2(input, startIndex)
      if (res[0] === "Success") {
        return res
      }

      return res
    }
  }
}

export function map<InputElement, T, U>(
  p: Parser<InputElement, T>,
  mapping: (x: T) => U
): Parser<InputElement, U> {
  return (input, startIndex) => {
    const res = p(input, startIndex)
    if (res[0] === "Success") {
      const [startIndex, res2] = res[1]
      return Result.mkSuccess(startIndex, mapping(res2))
    }

    return res
  }
}

export function pipe2<InputElement, T1, T2, T3>(
  p1: Parser<InputElement, T1>,
  p2: Parser<InputElement, T2>,
  mapping: ((v1: T1, v2: T2) => T3)
): Parser<InputElement, T3> {
  return chain(
    p1,
    x1 => {
      return map(
        p2,
        x2 => {
          return mapping(x1, x2)
        }
      )
    }
  )
}

export function eof<InputElement, T>(
  p: Parser<InputElement, T>
): Parser<InputElement, T> {
  return (input, startIndex) => {
    const res = p(input, startIndex)
    if (res[0] === "Success") {
      const [startIndex, xs] = res[1]
      if (startIndex < input.length) {
        return Result.mkError()
      }

      return res
    }
    return res
  }
}

export function run<InputElement, T>(
  p: Parser<InputElement, T>,
) {
  return (input: InputElement[]): Result<T> => {
    const res = p(input, 0)
    return res
  }
}
