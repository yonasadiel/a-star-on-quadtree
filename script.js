const svgUrl = 'http://www.w3.org/2000/svg'
const canvas = $('#canvas')
const resolution = 8
const dimension = 2048

var state = 'start'
// start : chosing start point
// end : chosing end point
// add : waiting to draw adding rect
// addDraw : waiting to drawing adding rect complete
// sub : waiting to draw substracting rect
// subDraw : waiting to drawing substracting rect complete
var startPos = { x: 20, y: 20 }
var endPos = { x: 100, y: 100 }
var activePos = { x: 0, y: 0 }
var quadTree = { color: 'white', tree: [] }
var nodes = []
var path = []

var showAdj = true

resetCanvas = () => {
  canvas.empty()
}

drawRect = (left, top, width, height, color) => {
  let rect = $(document.createElementNS(svgUrl, 'rect'))
  let svg = $(document.createElementNS(svgUrl, 'svg'))

  rect.attr('x', left)
  rect.attr('y', top)
  rect.attr('width', width)
  rect.attr('height', height)

  rect.css('fill', color)
  rect.css('stroke-width', 1)
  rect.css('stroke', 'rgba(200, 0, 0, .1)')

  svg.attr('width', '100%')
  svg.attr('height', '100%')
  svg.html(rect)
  canvas.append(svg)
}

drawCircle = (x, y, color) => {
  let circle = $(document.createElementNS(svgUrl, 'circle'))
  let svg = $(document.createElementNS(svgUrl, 'svg'))

  circle.attr('cx', x)
  circle.attr('cy', y)
  circle.attr('r', Math.max(Math.floor(resolution/2), 8))

  circle.attr('fill', color)
  circle.attr('stroke-width', 0)

  svg.attr('width', '100%')
  svg.attr('height', '100%')
  svg.html(circle)
  canvas.append(svg)
}

drawLine = (x1, y1, x2, y2, color) => {
  let line = $(document.createElementNS(svgUrl, 'line'))
  let svg = $(document.createElementNS(svgUrl, 'svg'))

  line.attr('x1', x1)
  line.attr('y1', y1)
  line.attr('x2', x2)
  line.attr('y2', y2)

  line.css('stroke', color)
  line.css('stroke-width', 1)

  svg.attr('width', '100%')
  svg.attr('height', '100%')
  svg.html(line)
  canvas.append(svg)
}

drawQuadTree = (wLeft, wTop, wRight, wBottom, subQuadTree) => {
  if (subQuadTree.tree.length === 0) {
    drawRect(wLeft, wTop, wRight - wLeft, wBottom - wTop, subQuadTree.color)
  } else if (subQuadTree.tree.length === 4) {
    let mHorizontal = Math.floor((wLeft + wRight) / 2)
    let mVertical = Math.floor((wTop + wBottom) / 2)

    drawQuadTree(wLeft, wTop, mHorizontal, mVertical, subQuadTree.tree[0])
    drawQuadTree(mHorizontal, wTop, wRight, mVertical, subQuadTree.tree[1])
    drawQuadTree(wLeft, mVertical, mHorizontal, wBottom, subQuadTree.tree[2])
    drawQuadTree(mHorizontal, mVertical, wRight, wBottom, subQuadTree.tree[3])
  }
}

fillRectToQuadtree = (rLeft, rTop, rRight, rBottom, wLeft, wTop, wRight, wBottom, subQuadTree, color) => {
  if (rLeft === wLeft
       && rTop === wTop
       && rRight === wRight
       && rBottom === wBottom) {
    subQuadTree.color = color
    subQuadTree.tree = []

  } else {
    if (subQuadTree.tree.length === 0) {
      let content = subQuadTree.color
      for (let i = 0; i < 4; i++)
        subQuadTree.tree.push({ color: content, tree: [] })
    }

    let mHorizontal = Math.floor((wLeft + wRight) / 2)
    let mVertical = Math.floor((wTop + wBottom) / 2)

    if (rLeft < mHorizontal && rTop < mVertical)
      fillRectToQuadtree(
        rLeft, rTop, Math.min(mHorizontal, rRight), Math.min(mVertical, rBottom),
        wLeft, wTop, mHorizontal, mVertical,
        subQuadTree.tree[0], color)
    
    if (rRight > mHorizontal && rTop < mVertical)
      fillRectToQuadtree(
        Math.max(mHorizontal, rLeft), rTop, rRight, Math.min(mVertical, rBottom),
        mHorizontal, wTop, wRight, mVertical,
        subQuadTree.tree[1], color)

    if (rLeft < mHorizontal && rBottom > mVertical)
      fillRectToQuadtree(
        rLeft, Math.max(mVertical, rTop), Math.min(mHorizontal, rRight), rBottom,
        wLeft, mVertical, mHorizontal, wBottom,
        subQuadTree.tree[2], color)
    
    if (rRight > mHorizontal && rBottom > mVertical)
      fillRectToQuadtree(
        Math.max(mHorizontal, rLeft), Math.max(mVertical, rTop), rRight, rBottom,
        mHorizontal, mVertical, wRight, wBottom,
        subQuadTree.tree[3], color)
    
    if (isFullColor(subQuadTree, color)) {
      subQuadTree.color = color
      subQuadTree.tree = []
    }
  }
}

fillRect = (x1, y1, x2, y2, color) => {
  if (Math.abs(x2 - x1) > 0 && Math.abs(y2 - y1) > 0) {
    fillRectToQuadtree(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.max(x2, x1),
      Math.max(y2, y1),
      0, 0, dimension, dimension, quadTree, color)
  }
}

isFullColor = (subQuadTree, color) => {
  if (subQuadTree.tree.length === 0)
    return (subQuadTree.color === color)
  return (isFullColor(subQuadTree.tree[0], color)
    && isFullColor(subQuadTree.tree[1], color)
    && isFullColor(subQuadTree.tree[2], color)
    && isFullColor(subQuadTree.tree[3], color))
}

refresh = () => {
  console.log("refresh")
  astar()
  resetCanvas()
  drawQuadTree(0, 0, dimension, dimension, quadTree)
  drawCircle(startPos.x, startPos.y, 'red')
  drawCircle(endPos.x, endPos.y, 'blue')

  for (let pathIdx = 0; pathIdx < path.length; pathIdx++) {
    drawLine(path[pathIdx].x1, path[pathIdx].y1, path[pathIdx].x2, path[pathIdx].y2, 'green')
  }

  if (showAdj) {
    for (let nodesIdx = 0; nodesIdx < nodes.length; nodesIdx++) {
      let node = nodes[nodesIdx]
      for (let adjIdx = 0; adjIdx < node.adj.length; adjIdx++) {
        let adj = nodes[node.adj[adjIdx]]
        drawLine(node.x, node.y, adj.x, adj.y, 'rgba(200, 200, 200, .1)')
      }
    }
  }
}

addListener = () => {
  canvas.mousedown((e) => {
    if (state === 'add' || state === 'sub') {
      activePos.x = e.pageX - canvas.position().left
      activePos.y = e.pageY - canvas.position().top
      state += 'Draw'
    }
  })
  canvas.mouseup((e) => {
    if (state === 'addDraw') {
      let left   = roundToResolution(activePos.x)
      let top    = roundToResolution(activePos.y)
      let right  = roundToResolution(e.pageX - canvas.position().left)
      let bottom = roundToResolution(e.pageY - canvas.position().top)
      fillRect(left, top, right, bottom, 'grey')
        
      state = 'add'
    } else if (state === 'subDraw') {
      let left   = roundToResolution(activePos.x)
      let top    = roundToResolution(activePos.y)
      let right  = roundToResolution(e.pageX - canvas.position().left)
      let bottom = roundToResolution(e.pageY - canvas.position().top)
      fillRect(left, top, right, bottom, 'white')

      state = 'sub'
    } else if (state === 'start') {
      startPos.x = roundToResolution(e.pageX - canvas.position().left) - resolution / 2
      startPos.y = roundToResolution(e.pageY - canvas.position().top) - resolution / 2
      changeStateTo('end')
    } else if (state === 'end') {
      endPos.x = roundToResolution(e.pageX - canvas.position().left) - resolution / 2
      endPos.y = roundToResolution(e.pageY - canvas.position().top) - resolution / 2
      changeStateTo('add')
    }
    refresh()
  })
}

changeStateTo = (newState) => {
  $('#' + state).removeClass('active')
  $('#' + newState).addClass('active')
  state = newState
}

roundToResolution = (x) => {
  return Math.floor((x + resolution / 2) / resolution) * resolution
}

buildNode = (left, top, right, bottom, subQuadTree) => {
  if (subQuadTree.tree.length === 0) {
    subQuadTree.nodeIdx = nodes.length
    nodes.push({ x: (left + right) / 2, y: (top + bottom) / 2, adj: [], color: subQuadTree.color})
  } else {
    let mHorizontal = Math.floor((left + right) / 2)
    let mVertical = Math.floor((top + bottom) / 2)

    buildNode(left, top, mHorizontal, mVertical, subQuadTree.tree[0])
    buildNode(mHorizontal, top, right, mVertical, subQuadTree.tree[1])
    buildNode(left, mVertical, mHorizontal, bottom, subQuadTree.tree[2])
    buildNode(mHorizontal, mVertical, right, bottom, subQuadTree.tree[3])
  }
}

buildEdgeTopBottom = (xTop1, xTop2, yTop1, yTop2, xBottom1, xBottom2, yBottom1, yBottom2, subQuadTree1, subQuadTree2) => {
  if (subQuadTree1.tree.length === 0 && subQuadTree2.tree.length === 0) {
    nodes[subQuadTree1.nodeIdx].adj.push(subQuadTree2.nodeIdx)
    nodes[subQuadTree2.nodeIdx].adj.push(subQuadTree1.nodeIdx)
  } else if (subQuadTree1.tree.length === 4 && subQuadTree2.tree.length === 4) {
    buildEdgeTopBottom(
      xTop1, Math.floor((xTop1 + xTop2) / 2), Math.floor((yTop1 + yTop2) / 2), yTop2,
      xBottom1, Math.floor((xBottom1 + xBottom2) / 2), yBottom1, Math.floor((yBottom1 + yBottom2) / 2),
      subQuadTree1.tree[2], subQuadTree2.tree[0])
    buildEdgeTopBottom(
      Math.floor((xTop1 + xTop2) / 2), xTop2, Math.floor((yTop1 + yTop2) / 2), yTop2,
      Math.floor((xBottom1 + xBottom2) / 2), xBottom2, yBottom1, Math.floor((yBottom1 + yBottom2) / 2),
      subQuadTree1.tree[3], subQuadTree2.tree[1])
  } else if (subQuadTree2.tree.length === 4) {
    buildEdgeTopBottom(
      xTop1, xTop2, yTop1, yTop2,
      xBottom1, Math.floor((xBottom1 + xBottom2) / 2), yBottom1, Math.floor((yBottom1 + yBottom2) / 2),
      subQuadTree1, subQuadTree2.tree[0])
    buildEdgeTopBottom(
      xTop1, xTop2, yTop1, yTop2,
      Math.floor((xBottom1 + xBottom2) / 2), xBottom2, yBottom1, Math.floor((yBottom1 + yBottom2) / 2),
      subQuadTree1, subQuadTree2.tree[1])
  } else {
    buildEdgeTopBottom(
      xTop1, Math.floor((xTop1 + xTop2) / 2), Math.floor((yTop1 + yTop2) / 2), yTop2,
      xBottom1, xBottom2, yBottom1, yBottom2,
      subQuadTree1.tree[2], subQuadTree2)
    buildEdgeTopBottom(
      Math.floor((xTop1 + xTop2) / 2), xTop2, Math.floor((yTop1 + yTop2) / 2), yTop2,
      xBottom1, xBottom2, yBottom1, yBottom2,
      subQuadTree1.tree[3], subQuadTree2)
  }
}

buildEdgeLeftRight = (xLeft1, xLeft2, yLeft1, yLeft2, xRight1, xRight2, yRight1, yRight2, subQuadTree1, subQuadTree2) => {
  if (subQuadTree1.tree.length === 0 && subQuadTree2.tree.length === 0) {
    nodes[subQuadTree1.nodeIdx].adj.push(subQuadTree2.nodeIdx)
    nodes[subQuadTree2.nodeIdx].adj.push(subQuadTree1.nodeIdx)
  } else if (subQuadTree1.tree.length === 4 && subQuadTree2.tree.length === 4) {
    buildEdgeLeftRight(
      Math.floor((xLeft1 + xLeft2) / 2), xLeft2, yLeft1, Math.floor((yLeft1 + yLeft2) / 2),
      xRight1, Math.floor((xRight1 + xRight2) / 2), yRight1, Math.floor((yRight1 + yRight2) / 2),
      subQuadTree1.tree[1], subQuadTree2.tree[0])
    buildEdgeLeftRight(
      Math.floor((xLeft1 + xLeft2) / 2), xLeft2, Math.floor((yLeft1 + yLeft2) / 2), yLeft2,
      Math.floor((xRight1 + xRight2) / 2), xRight2,  Math.floor((yRight1 + yRight2) / 2), yRight2,
      subQuadTree1.tree[3], subQuadTree2.tree[2])
  } else if (subQuadTree2.tree.length === 4) {
    buildEdgeLeftRight(
      xLeft1, xLeft2, yLeft1, yLeft2,
      xRight1, Math.floor((xRight1 + xRight2) / 2), yRight1, Math.floor((yRight1 + yRight2) / 2),
      subQuadTree1, subQuadTree2.tree[0])
    buildEdgeLeftRight(
      xLeft1, xLeft2, yLeft1, yLeft2,
      Math.floor((xRight1 + xRight2) / 2), xRight2,  Math.floor((yRight1 + yRight2) / 2), yRight2,
      subQuadTree1, subQuadTree2.tree[2])
  } else {
    buildEdgeLeftRight(
      Math.floor((xLeft1 + xLeft2) / 2), xLeft2, yLeft1, Math.floor((yLeft1 + yLeft2) / 2),
      xRight1, xRight2, yRight1, yRight2,
      subQuadTree1.tree[1], subQuadTree2)
    buildEdgeLeftRight(
      Math.floor((xLeft1 + xLeft2) / 2), xLeft2, Math.floor((yLeft1 + yLeft2) / 2), yLeft2,
      xRight1, xRight2, yRight1, yRight2,
      subQuadTree1.tree[3], subQuadTree2)
  }
}

buildEdge = (left, top, right, bottom, subQuadTree) => {
  if (subQuadTree.tree.length === 0) {
    //
  } else {
    let mHorizontal = Math.floor((left + right) / 2)
    let mVertical = Math.floor((top + bottom) / 2)

    buildEdge(left, top, mHorizontal, mVertical, subQuadTree.tree[0])
    buildEdge(mHorizontal, top, right, mVertical, subQuadTree.tree[1])
    buildEdge(left, mVertical, mHorizontal, bottom, subQuadTree.tree[2])
    buildEdge(mHorizontal, mVertical, right, bottom, subQuadTree.tree[3])

    buildEdgeTopBottom(
      left, mHorizontal, top, mVertical,
      left, mHorizontal, mVertical, bottom,
      subQuadTree.tree[0], subQuadTree.tree[2])
    buildEdgeTopBottom(
      mHorizontal, right, top, mVertical,
      mHorizontal, right, mVertical, bottom,
      subQuadTree.tree[1], subQuadTree.tree[3])
    buildEdgeLeftRight(
      top, mVertical, left, mHorizontal,
      top, mVertical, mHorizontal, right,
      subQuadTree.tree[0], subQuadTree.tree[1])
    buildEdgeLeftRight(
      mVertical, bottom, left, mHorizontal,
      mVertical, bottom, mHorizontal, right,
      subQuadTree.tree[2], subQuadTree.tree[3])
  }
}

findNodeIdx = (x, y) => {
  let subQuadTree = quadTree
  let left = 0
  let top = 0
  let right = dimension
  let bottom = dimension

  while (subQuadTree.tree.length === 4) {
    let mHorizontal = Math.floor((left + right) / 2)
    let mVertical = Math.floor((top + bottom) / 2)
    if (x < mHorizontal && y < mVertical) {
      subQuadTree = subQuadTree.tree[0]
      right = mHorizontal
      bottom = mVertical
    } else if (x > mHorizontal && y < mVertical) {
      subQuadTree = subQuadTree.tree[1]
      left = mHorizontal
      bottom = mVertical
    } else if (x < mHorizontal && y > mVertical) {
      subQuadTree = subQuadTree.tree[2]
      right = mHorizontal
      top = mVertical 
    } else if (x > mHorizontal && y > mVertical) {
      left = mHorizontal
      top = mVertical
      subQuadTree = subQuadTree.tree[3]
    }
  }
  return subQuadTree.nodeIdx
}

euDist = (nodeA, nodeB) => {
  return Math.sqrt((nodeA.x - nodeB.x) * (nodeA.x - nodeB.x) + (nodeA.y - nodeB.y) * (nodeA.y - nodeB.y))
}

astar = () => {
  console.log("astar")
  $("#error").empty()

  nodes = []

  fillRect(startPos.x - resolution / 2, startPos.y - resolution / 2, startPos.x + resolution / 2, startPos.y + resolution / 2, 'red')
  fillRect(  endPos.x - resolution / 2,   endPos.y - resolution / 2,   endPos.x + resolution / 2,   endPos.y + resolution / 2, 'blue')
  buildNode(0, 0, dimension, dimension, quadTree)
  buildEdge(0, 0, dimension, dimension, quadTree)

  let startIdx = findNodeIdx(startPos.x, startPos.y)
  let endIdx = findNodeIdx(endPos.x, endPos.y)
  let dist = new Array(nodes.length)
  let prev = new Array(nodes.length)
  let pq = new PriorityQueue()

  for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx++) {
    dist[nodeIdx] = -1
    prev[nodeIdx] = -1
  }

  pq.enqueue({ now: startIdx, prev: startIdx }, 0)
  path = []

  while (! pq.isEmpty() && dist[endIdx] === -1) {
    let top = pq.dequeue()
    let curNode = top.element.now

    if (dist[curNode] === -1) {
      dist[curNode] = top.priority
      prev[curNode] = top.element.prev
      // path.push({ x1: nodes[curNode].x, y1: nodes[curNode].y, x2: nodes[prev[curNode]].x, y2: nodes[prev[curNode]].y })
      
      for (let adjIdx = 0; adjIdx < nodes[curNode].adj.length; adjIdx++) {
        let next = nodes[curNode].adj[adjIdx]
        if (dist[next] === -1 && nodes[next].color !== 'grey') {
          pq.enqueue({ now: next, prev: curNode }, (dist[curNode] + euDist(nodes[curNode], nodes[next])))
        }
      }
    }
  }
  fillRect(startPos.x - resolution / 2, startPos.y - resolution / 2, startPos.x + resolution / 2, startPos.y + resolution / 2, 'white')
  fillRect(  endPos.x - resolution / 2,   endPos.y - resolution / 2,   endPos.x + resolution / 2,   endPos.y + resolution / 2, 'white')

  let curNode = endIdx
  while (curNode !== startIdx && prev[curNode] !== -1) {
    path.push({ x1: nodes[curNode].x, y1: nodes[curNode].y, x2: nodes[prev[curNode]].x, y2: nodes[prev[curNode]].y })
    curNode = prev[curNode]
  }
}

addListener()
refresh()