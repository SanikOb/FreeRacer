import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Car } from './car';
import { Border } from './border';
import { Obstacle } from './obstacle';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-game',
  imports: [RouterLink],
  templateUrl: './game.html',
  styleUrl: './game.css'
})
export class Game implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId?: number;
  private car!: Car;
  private lastTime: number = 0;
  private previousCanvasWidth: number = 0;
  private previousCanvasHeight: number = 0;
  private pressedKeys: Set<string> = new Set();
  private readonly ACCELERATION = 75; 
  private readonly ANGLE_VELOCITY = 2; 
  private leftBorder!: Border;
  private rightBorder!: Border;
  private topBorder!: Border;
  private readonly BORDER_OFFSET = 50; 
  private obstacles: Obstacle[] = [];
  private readonly OBSTACLE_SPAWN_CHANCE = 0.2; 
  private lastObstacleSpawnTime: number = 0;
  private readonly MIN_SPAWN_INTERVAL = 0.5; 
  private score: number = 0; 

  ngOnInit(): void {
    
  }

  async ngAfterViewInit(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.initializeBorders();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    this.car = new Car(
      canvasWidth / 2,  
      canvasHeight * 0.85, 
      
    );
    
    try {
      await this.car.loadImage('assets/car.png');
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
    }
    
    this.setupKeyboardControls();
    
    this.lastTime = performance.now();
    this.gameLoop();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', () => this.resizeCanvas());
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private setupKeyboardControls(): void {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.key);
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.key);
  }

  private initializeBorders(): void {
    const canvas = this.canvasRef.nativeElement;
    const borderX = this.BORDER_OFFSET;
    const topBorderY = canvas.height * 0.5;
    
    
    this.leftBorder = new Border(
      borderX, 0,
      borderX, canvas.height
    );
    
    
    this.rightBorder = new Border(
      canvas.width - borderX, 0,
      canvas.width - borderX, canvas.height
    );
    
    
    this.topBorder = new Border(
      0, topBorderY,
      canvas.width, topBorderY
    );
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    
    if (this.car && this.previousCanvasWidth > 0 && this.previousCanvasHeight > 0) {
      
      const oldCenterX = this.previousCanvasWidth / 2;
      const oldCenterY = this.previousCanvasHeight / 2;
      const offsetX = this.car.x - oldCenterX;
      const offsetY = this.car.y - oldCenterY;
      
      
      const ratioX = this.previousCanvasWidth > 0 ? offsetX / this.previousCanvasWidth : 0;
      const ratioY = this.previousCanvasHeight > 0 ? offsetY / this.previousCanvasHeight : 0;
      
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      
      const newCenterX = canvas.width / 2;
      const newCenterY = canvas.height / 2;
      this.car.x = newCenterX + (ratioX * canvas.width);
      this.car.y = newCenterY + (ratioY * canvas.height);
    } else {
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (this.car) {
        this.centerCar();
      }
    }
    
    
    if (!this.leftBorder || !this.rightBorder || !this.topBorder) {
      this.initializeBorders();
    } else {
      const borderX = this.BORDER_OFFSET;
      const topBorderY = canvas.height * 0.35;
      
      this.leftBorder.x1 = borderX;
      this.leftBorder.x2 = borderX;
      this.leftBorder.y2 = canvas.height;
      
      this.rightBorder.x1 = canvas.width - borderX;
      this.rightBorder.x2 = canvas.width - borderX;
      this.rightBorder.y2 = canvas.height;
      
      this.topBorder.x1 = 0;
      this.topBorder.y1 = topBorderY;
      this.topBorder.x2 = canvas.width;
      this.topBorder.y2 = topBorderY;
    }
    
    
    this.previousCanvasWidth = canvas.width;
    this.previousCanvasHeight = canvas.height;
  }

  private centerCar(): void {
    const canvas = this.canvasRef.nativeElement;
    this.car.x = canvas.width / 2;
    this.car.y = canvas.height * 0.85; 
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; 
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    if (this.car) {
      
      const oldX = this.car.x;
      const oldY = this.car.y;
      
      
      this.handleInput(deltaTime);
      
      
      this.car.update(deltaTime, 450); 
      
      
      this.keepCarInBounds();
      
      
      this.trySpawnObstacle(deltaTime);
      
      
      this.updateObstacles(deltaTime);
      
      
      this.checkObstacleCollisions();
      
      
      this.checkBorderCollisions(oldX, oldY);
    }
  }

  private checkObstacleCollisions(): void {
    const carWidth = this.car.getImageWidth() || 40;
    const carHeight = this.car.getImageHeight() || 40;
    const carHalfWidth = carWidth / 2;
    const carHalfHeight = carHeight / 2;
    
    const carLeft = this.car.x - carHalfWidth;
    const carRight = this.car.x + carHalfWidth;
    const carTop = this.car.y - carHalfHeight;
    const carBottom = this.car.y + carHalfHeight;
    
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      const obstacleHalfWidth = obstacle.width / 2;
      const obstacleHalfHeight = obstacle.height / 2;
      
      const obstacleLeft = obstacle.x - obstacleHalfWidth;
      const obstacleRight = obstacle.x + obstacleHalfWidth;
      const obstacleTop = obstacle.y - obstacleHalfHeight;
      const obstacleBottom = obstacle.y + obstacleHalfHeight;
      
      if (carLeft < obstacleRight &&
          carRight > obstacleLeft &&
          carTop < obstacleBottom &&
          carBottom > obstacleTop) {
        this.car.velocity = this.car.velocity / 2;
        this.obstacles.splice(i, 1);
        this.score = Math.max(0, this.score - 1);
      }
    }
  }

  private keepCarInBounds(): void {
    const canvas = this.canvasRef.nativeElement;
    const carWidth = this.car.getImageWidth() || 40;
    const carHeight = this.car.getImageHeight() || 40;
    
    
    const halfWidth = carWidth / 2;
    const halfHeight = carHeight / 2;
    
    
    if (this.car.x - halfWidth < 0) {
      this.car.x = halfWidth;
      this.car.velocity = 0;
    } else if (this.car.x + halfWidth > canvas.width) {
      this.car.x = canvas.width - halfWidth;
      this.car.velocity = 0;
    }
    
    
    if (this.car.y - halfHeight < 0) {
      this.car.y = halfHeight;
    } else if (this.car.y + halfHeight > canvas.height) {
      this.car.y = canvas.height - halfHeight;
    }
  }

  private trySpawnObstacle(deltaTime: number): void {
    const canvas = this.canvasRef.nativeElement;
    const currentTime = performance.now() / 1000; 
    
    
    if (this.pressedKeys.has('ArrowUp')) {
      
      if (currentTime - this.lastObstacleSpawnTime >= this.MIN_SPAWN_INTERVAL) {
        
        if (Math.random() < this.OBSTACLE_SPAWN_CHANCE) {
          this.spawnObstacle();
          this.lastObstacleSpawnTime = currentTime;
        }
      }
    }
  }

  private spawnObstacle(): void {
    const canvas = this.canvasRef.nativeElement;
    const roadWidth = canvas.width * 0.6;
    const roadX = (canvas.width - roadWidth) / 2;
    
    
    const spawnX = roadX + Math.random() * roadWidth;
    const spawnY = -50; 
    
    
    const obstacle = new Obstacle(spawnX, spawnY, 0);
    this.obstacles.push(obstacle);
  }

  private updateObstacles(deltaTime: number): void {
    const canvas = this.canvasRef.nativeElement;
    
    
    const carYVelocity = this.car.velocity * Math.sin(this.car.angle);
    
    
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      
      
      obstacle.velocity = -carYVelocity;
      
      obstacle.update(deltaTime);
      
      
      if (obstacle.isOffScreen(canvas.height)) {
        this.obstacles.splice(i, 1);
        this.score++; 
      }
    }
  }

  private checkBorderCollisions(oldX: number, oldY: number): void {
    if (!this.leftBorder || !this.rightBorder || !this.topBorder) {
      return;
    }
    
    const newX = this.car.x;
    const newY = this.car.y;
    
    
    if (this.leftBorder.wouldCross(oldX, oldY, newX, newY)) {
      
      this.car.x = this.leftBorder.getBoundaryCoordinate() + 1;
      this.car.velocity = 0; 
    }
    
    
    if (this.rightBorder.wouldCross(oldX, oldY, newX, newY)) {
      
      this.car.x = this.rightBorder.getBoundaryCoordinate() - 1;
      this.car.velocity = 0; 
    }
    
    
    if (this.topBorder.wouldCross(oldX, oldY, newX, newY)) {
      
      this.car.y = this.topBorder.getBoundaryCoordinate() + 1;
      
    }
  }

  private handleInput(deltaTime: number): void {
    
    if (this.pressedKeys.has('ArrowUp')) {
      this.car.acceleration -= this.ACCELERATION * deltaTime;
    }
    
    
    if (this.pressedKeys.has('ArrowDown')) {
      this.car.acceleration += this.ACCELERATION * deltaTime;
    }
    
    
    if (this.pressedKeys.has('ArrowRight')) {
      this.car.angleVelocity = this.ANGLE_VELOCITY;
    }
    
    
    if (this.pressedKeys.has('ArrowLeft')) {
      this.car.angleVelocity = -this.ANGLE_VELOCITY;
    }
    
    
    if (!this.pressedKeys.has('ArrowLeft') && !this.pressedKeys.has('ArrowRight')) {
      this.car.angleVelocity = 0;
    }
  }

  private render(): void {
    const canvas = this.canvasRef.nativeElement;
    
    
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    
    this.drawRoad();
    
    
    this.drawCenterLine();
    
    
    if (this.leftBorder) {
      this.leftBorder.render(this.ctx);
    }
    if (this.rightBorder) {
      this.rightBorder.render(this.ctx);
    }
    
    
    
    for (const obstacle of this.obstacles) {
      obstacle.render(this.ctx);
    }
    
    
    if (this.car) {
      this.car.render(this.ctx);
    }
    
    
    this.drawScore();
  }

  private drawScore(): void {
    const canvas = this.canvasRef.nativeElement;
    
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    
    const scoreText = `Score: ${this.score}`;
    const padding = 20;
    this.ctx.fillText(scoreText, canvas.width - padding, padding);
    
    this.ctx.restore();
  }

  private drawRoad(): void {
    const canvas = this.canvasRef.nativeElement;
    const roadWidth = canvas.width * 0.6;
    const roadX = (canvas.width - roadWidth) / 2;
    
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(roadX, 0, roadWidth, canvas.height);
    
    
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(roadX, 0);
    this.ctx.lineTo(roadX, canvas.height);
    this.ctx.moveTo(roadX + roadWidth, 0);
    this.ctx.lineTo(roadX + roadWidth, canvas.height);
    this.ctx.stroke();
  }

  private drawCenterLine(): void {
    const canvas = this.canvasRef.nativeElement;
    const roadWidth = canvas.width * 0.6;
    const roadX = (canvas.width - roadWidth) / 2;
    const centerX = canvas.width / 2;
    
    
    this.ctx.strokeStyle = '#f1c40f';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([30, 30]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, 0);
    this.ctx.lineTo(centerX, canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
}

