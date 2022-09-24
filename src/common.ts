export type WithTarget<Event, Target> = Event & { currentTarget: Target }

export type Deferrer<T> =
  | ["HasNotStartedYet"]
  | ["InProgress"]
  | ["Resolved", T]

export type Result<Ok, Error> = ["Ok", Ok] | ["Error", Error]

export type Option<T> = T | null
