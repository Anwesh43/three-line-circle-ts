const w : number = window.innerWidth 
const h : number = window.innerHeight
const parts : number = 3  
const scGap : number = 0.02 / parts 
const strokeFactor : number = 90 
const rFactor : number = 6.4
const delay : number = 20 
const colors : Array<string> = [
    "#F44336",
    "#4CAF50",
    "#3F51B5",
    "#FFC107",
    "#2196F3"
]
const backColor : string = "#BDBDBD"

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.divideScale(scale, i, n)) * n 
    }

    static sinify(scale : number) : number {
        return Math.sin(scale * Math.PI)
    }
}

class DrawingUtil {

    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawCircleFill(context : CanvasRenderingContext2D, x : number, y : number, r : number, scale : number) {
        context.save()
        context.beginPath()
        context.arc(x, y, r, 0, 2 * Math.PI)
        context.clip()
        context.fillRect(-r, -r, 2 * r * scale, 2 * r)
        context.restore()
    }

    static drawThreeLine(context : CanvasRenderingContext2D, j : number, r : number, sf : number) {
        const sfj : number = ScaleUtil.divideScale(sf, j * 2, parts)
        for (var i = 0; i < 3; i++) {
            const xStart : number = r * (i % 2) * j 
            const xUp : number = w - r * (i % 2)
            context.save()
            context.translate(-w / 2 + w / 2 * j, -r + r * i)
            DrawingUtil.drawLine(context, xStart, 0, xStart + xUp * sfj, 0)
            context.restore()
        }
    }

    static drawThreeLineCircle(context : CanvasRenderingContext2D, scale : number) {
        const sf : number = ScaleUtil.sinify(scale)
        const sf2 : number = ScaleUtil.divideScale(sf, 1, parts)
        const r : number = Math.min(w, h) / rFactor 
        for (var j = 0; j < 2; j++) {
            DrawingUtil.drawThreeLine(context, j, r, sf)
        } 
        DrawingUtil.drawCircleFill(context, 0, 0, r, sf2)
    }

    static drawTLCNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor 
        context.strokeStyle = colors[i]
        context.fillStyle = colors[i]
        DrawingUtil.drawThreeLineCircle(context, scale)
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D 
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w 
        this.canvas.height = h 
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor 
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0 
    dir : number = 0 
    prevScale : number = 0 

    update(cb : Function) {
        this.scale += this.dir * scGap 
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir 
            this.dir = 0 
            this.prevScale = this.scale 
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale 
            cb()
        }
    }
}

class Animator {

    animated : boolean = false 
    interval : number 

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true 
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false 
            clearInterval(this.interval)
        }
    }
}

class TLCNode {
    next : TLCNode
    prev : TLCNode 
    state : State = new State()
    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < colors.length - 1) {
            this.next = new TLCNode(this.i + 1)
            this.next.prev = this 
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawTLCNode(context, this.i, this.state.scale)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : TLCNode {
        var curr : TLCNode = this.prev 
        if (dir == 1) {
            curr = this.next 
        }
        if (curr) {
            return curr
        }
        cb()
        return this 
    }
}

class ThreeLineCircle {

    curr : TLCNode = new TLCNode(0)
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    animator : Animator = new Animator()
    tlc : ThreeLineCircle = new ThreeLineCircle()

    render(context : CanvasRenderingContext2D) {
        this.tlc.draw(context)
    }

    handleTap(cb : Function) {
        this.tlc.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.tlc.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}