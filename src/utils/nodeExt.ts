export module NodeExt {
  export function pickAndMoveByIndex(root: Node, srcIndex: number, dstIndex: number): void {
    if (srcIndex === dstIndex) {
      return
    }

    const childNodes = root.childNodes
    if (!(0 <= srcIndex && srcIndex < childNodes.length)) {
      throw new Error("The srcIndex was outside the range of elements in the root.childNodes.")
    }
    if (!(0 <= dstIndex && dstIndex < childNodes.length)) {
      throw new Error("The dstIndex was outside the range of elements in the root.childNodes.")
    }

    if (srcIndex < dstIndex) {
      const srcNode = childNodes[srcIndex]
      srcNode.remove()
      const x = childNodes[dstIndex]
      x.after(srcNode)
    } else {
      const srcNode = childNodes[srcIndex]
      srcNode.remove()
      const x = childNodes[dstIndex]
      x.before(srcNode)
    }
  }

  export function pickAndMove(root: Node, srcChild: Node, dstChild: Node): void {
    const childNodes = root.childNodes

    let srcIndex: number | undefined, dstIndex: number | undefined
    for (let index = 0; index < childNodes.length; index++) {
      if (srcIndex && dstIndex) {
        break
      }

      const element = childNodes[index]
      if (element === srcChild) {
        srcIndex = index
      } else if (element === dstChild) {
        dstIndex = index
      }
    }

    if (!srcIndex) {
      throw new Error("srcChild not found")
    } else if (!dstIndex) {
      throw new Error("dstChild not found")
    }
    return pickAndMoveByIndex(root, srcIndex, dstIndex)
  }
}

export default NodeExt
