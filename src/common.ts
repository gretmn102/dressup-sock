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
}
