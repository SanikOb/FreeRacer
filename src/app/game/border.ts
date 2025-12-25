export class Border {
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  wouldCross(oldX: number, oldY: number, newX: number, newY: number): boolean {
    if (Math.abs(this.x2 - this.x1) < 0.001) {
      const borderX = this.x1;
      const minY = Math.min(this.y1, this.y2);
      const maxY = Math.max(this.y1, this.y2);
      
      if ((oldX < borderX && newX >= borderX) || (oldX > borderX && newX <= borderX)) {
        return newY >= minY && newY <= maxY;
      }
    }
    
    if (Math.abs(this.y2 - this.y1) < 0.001) {
      const borderY = this.y1;
      const minX = Math.min(this.x1, this.x2);
      const maxX = Math.max(this.x1, this.x2);
      
      if ((oldY < borderY && newY >= borderY) || (oldY > borderY && newY <= borderY)) {
        return newX >= minX && newX <= maxX;
      }
    }
    
    return false;
  }

  getBoundaryCoordinate(): number {
    if (Math.abs(this.x2 - this.x1) < 0.001) {
      return this.x1; 
    }
    return this.y1; 
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
    ctx.restore();
  }
}

