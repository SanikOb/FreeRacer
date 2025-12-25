const pi = Math.PI;

export class Car {
    x: number;
    y: number;
    velocity: number;
    acceleration: number;
    angle: number;
    angleVelocity: number;
    private image: HTMLImageElement | null = null;
    private imageLoaded: boolean = false;

    constructor(
        x: number = 0,
        y: number = 0,
        velocity: number = 0,
        acceleration: number = 0,
        angle: number = pi / 2,
        angleVelocity: number = 0
    ) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.angle = angle;
        this.angleVelocity = angleVelocity;
    }

    loadImage(imagePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.image = new Image();
            this.image.onload = () => {
                this.imageLoaded = true;
                if (this.image) {
                    console.log(`Car image loaded successfully: ${imagePath}`, {
                        width: this.image.width,
                        height: this.image.height
                    });
                }
                resolve();
            };
            this.image.onerror = (error) => {
                console.error(`Failed to load car image from: ${imagePath}`, error);
                reject(new Error(`Failed to load image: ${imagePath}`));
            };
            console.log(`Attempting to load car image from: ${imagePath}`);
            this.image.src = imagePath;
        });
    }

    update(deltaTime: number, maxSpeed: number = 400): void {
        const maxAcceleration = 200;
        if (this.acceleration > maxAcceleration) {
            this.acceleration = maxAcceleration;
        } else if (this.acceleration < -maxAcceleration) {
            this.acceleration = -maxAcceleration;
        }
        
        this.velocity += this.acceleration * deltaTime;

        if (this.velocity > maxSpeed) {
            this.velocity = maxSpeed;
        } else if (this.velocity < -maxSpeed) {
            this.velocity = -maxSpeed;
        }

        this.angle += this.angleVelocity * deltaTime;

        this.angle = this.angle % (2 * Math.PI);
        if (this.angle < 0) {
            this.angle += 2 * Math.PI;
        }
        console.log(this.angle);
        this.x += this.velocity * Math.cos(this.angle) * deltaTime;
        this.y += this.velocity * Math.sin(this.angle) * deltaTime;
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (!this.imageLoaded || !this.image) {
            ctx.save();
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 20, this.y - 20, 40, 40);
            ctx.restore();
            return;
        }

        ctx.save();

        ctx.translate(this.x, this.y);

        ctx.rotate(this.angle);

        const imageWidth = this.image.width;
        const imageHeight = this.image.height;
        ctx.drawImage(
            this.image,
            -imageWidth / 2,
            -imageHeight / 2,
            imageWidth,
            imageHeight
        );

        ctx.restore();
    }

    getImageWidth(): number {
        return this.image?.width || 0;
    }

    getImageHeight(): number {
        return this.image?.height || 0;
    }
}

