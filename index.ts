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