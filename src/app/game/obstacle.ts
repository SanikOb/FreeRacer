export class Obstacle {
  x: number;
  y: number;
  velocity: number; 
  width: number = 40;
  height: number = 40;

  constructor(x: number, y: number, velocity: number) {
    this.x = x;
    this.y = y;
    this.velocity = velocity; 
  }

  update(deltaTime: number): void {
    this.y += this.velocity * deltaTime;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.restore();
  }

  isOffScreen(canvasHeight: number): boolean {
    return this.y > canvasHeight + this.height;
  }
}

