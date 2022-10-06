export module MapExt {
  export function ofArray<K, V>(keyValues: [K, V][]): Map<K, V> {
    const res = new Map()
    for (const [k, v] of keyValues) {
      res.set(k, v)
    }
    return res
  }
}

export default MapExt
