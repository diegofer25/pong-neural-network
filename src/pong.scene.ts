import Phaser from 'phaser';
import hitSoundPath from './assets/hit.wav';
import ballSpritePath from './assets/ball.png';
import botPlayerSpritePath from './assets/bot-player.png';
import playerSpritePath from './assets/player.png';
import { BotNeuralNetwork } from './bot.nn';
import { LossChart } from './plot-chart';

export class PongScene extends Phaser.Scene {
    private _ball?: Phaser.Physics.Arcade.Sprite;
    private _paddleLeft?: Phaser.Physics.Arcade.Sprite;
    private _paddleRight?: Phaser.Physics.Arcade.Sprite;

    private _screenWidth?: number;
    private _screenHeight?: number;

    private _scoreLeft: number = 0;
    private _scoreRight: number = 0;
    private _scoreTextLeft?: Phaser.GameObjects.Text;
    private _scoreTextRight?: Phaser.GameObjects.Text;
    private _epochsText?: Phaser.GameObjects.Text;
    private _epochs: number = 0;

    private _isGameOver: boolean = true;
    private _startText?: Phaser.GameObjects.Text;
    private _fadedBackground?: Phaser.GameObjects.Graphics;
    private _trainingText?: Phaser.GameObjects.Text;
    private _lossChartLabelText?: Phaser.GameObjects.Text;

    private botNn: BotNeuralNetwork;
    private lossChart: LossChart;

    constructor() {
        super('PongScene');
        this.botNn = new BotNeuralNetwork();
        this.lossChart = new LossChart(document.getElementById('chart') as HTMLCanvasElement);
    }

    // Getters and setters to ensure properties are initialized before use
    get ball() {
        if (!this._ball) {
            throw new Error('Ball not initialized');
        }
        return this._ball;
    }

    set ball(ball: Phaser.Physics.Arcade.Sprite) {
        this._ball = ball;
    }

    get paddleLeft() {
        if (!this._paddleLeft) {
            throw new Error('Left paddle not initialized');
        }
        return this._paddleLeft;
    }

    set paddleLeft(paddle: Phaser.Physics.Arcade.Sprite) {
        this._paddleLeft = paddle;
    }

    get paddleRight() {
        if (!this._paddleRight) {
            throw new Error('Right paddle not initialized');
        }
        return this._paddleRight;
    }

    set paddleRight(paddle: Phaser.Physics.Arcade.Sprite) {
        this._paddleRight = paddle;
    }

    get screenWidth() {
        if (!this._screenWidth) {
            throw new Error('Screen width not initialized');
        }
        return this._screenWidth;
    }

    set screenWidth(width: number) {
        this._screenWidth = width;
    }

    get screenHeight() {
        if (!this._screenHeight) {
            throw new Error('Screen height not initialized');
        }
        return this._screenHeight;
    }

    set screenHeight(height: number) {
        this._screenHeight = height;
    }

    preload() {
        // Load game assets
        this.load.audio('hit', hitSoundPath);
        this.load.image('ballSprite', ballSpritePath);
        this.load.image('botPlayerSprite', botPlayerSpritePath);
        this.load.image('playerSprite', playerSpritePath);
    }

    create() {
        console.log('Game created and ready to start.');
        
        // Initialize screen dimensions
        this.setupScreenDimensions();

        // Draw tennis table background
        this.drawTennisTable();

        // Set up the ball and paddles
        this.setupBall();
        this.setupPaddles();

        // Configure input controls and resize handler
        this.setupInputControls();
        this.setupResizeHandler();

        // Set up score display and start text
        this.setupScore();
        this.setupStartText();

        // Add event listener to start the game on pointer down
        this.input.on('pointerdown', () => {
            if (this._isGameOver) {
                this.startGame();
            }
        });
    }

    update() {
        if (!this._isGameOver) {
            this.checkScore();
            this.controlBotPaddle();

            // Gradually increase ball velocity over time
            this.increaseBallVelocity(0.5);
        }
    }

    // Increase the ball's velocity gradually
    private increaseBallVelocity(acceleration: number) {
        if (!this.ball.body) {
            throw new Error('Ball not initialized');
        }

        const isGoingDown = this.ball.body.velocity.y > 0;
        this.ball.setVelocityY(this.ball.body.velocity.y + (isGoingDown ? acceleration : -acceleration));

        const isGoingRight = this.ball.body.velocity.x > 0;
        this.ball.setVelocityX(this.ball.body.velocity.x + (isGoingRight ? acceleration * 5 : -acceleration * 5));
    }

    // Control the bot's paddle using the neural network's predictions
    private controlBotPaddle() {
        if (!this.ball.body) {
            throw new Error('Ball body not initialized');
        }
        
        const output = this.botNn.predict(
            this.ball.x,
            this.ball.y,
            this.ball.body.velocity.x,
            this.ball.body.velocity.y,
            this.paddleLeft.x,
            this.paddleLeft.displayWidth,
            this.paddleRight.x,
            this.screenHeight,
            this.screenWidth
        );

        const outputIsPassingRightWall = output < this.paddleLeft.displayWidth / 2;
        const outputIsPassingLeftWall = output > this.screenWidth - this.paddleLeft.displayWidth / 2;

        if (outputIsPassingRightWall) {
            this.paddleLeft.setX(this.paddleLeft.displayWidth / 2);
        } else if (outputIsPassingLeftWall) {
            this.paddleLeft.setX(this.screenWidth - this.paddleLeft.displayWidth / 2);
        } else {
            this.paddleLeft.setX(output);
        }
    }

    // Set up the start text and faded background
    private setupStartText() {
        const style = { fontSize: '34px', fill: '#ffffff' };
        
        // Create a semi-transparent black background
        this._fadedBackground = this.add.graphics();
        this._fadedBackground.fillStyle(0x000000, 0.5);
        this._fadedBackground.fillRect(0, 0, this.screenWidth, this.screenHeight);

        // Add "Click to Start" text over the background
        this._startText = this.add.text(this.screenWidth / 2, this.screenHeight / 2, 'Clique para começar', style);
        this._startText.setOrigin(0.5);
    }

    // Start the game, reset ball and hide start text
    private startGame() {
        if (this._startText && this._fadedBackground) {
            this._startText.setVisible(false);
            this._fadedBackground.setVisible(false); 
        }

        this._isGameOver = false;
        this.lossChart.hideChart();
        this._lossChartLabelText?.setVisible(false);

        // Reset ball position and make it visible
        this.resetBall();
        this.showBall();
    }
    
    // Make the ball visible
    private showBall() {
        this.ball.setVisible(true);
    }

    // Check if a score condition is met and handle it
    private checkScore() {
        if (this.ball.y < this.paddleLeft.displayHeight) {
            this._scoreRight++;
            this.processRestart(false);
        } else if (this.ball.y > this.screenHeight - this.paddleRight.displayHeight) {
            this._scoreLeft++;
            this.processRestart(true);
        }
    }

    // Handle the restart process, including training the neural network
    private async processRestart(botWon: boolean) {
        this._isGameOver = true;

        // Hide the ball and stop its movement
        this.ball.setVisible(false);
        this.ball.setVelocity(0, 0);

        // Show faded background
        this._fadedBackground?.setVisible(true);

        if (!botWon) {
            // Display "Training model..." text
            this._trainingText = this.add.text(this.screenWidth / 2, this.screenHeight / 2, 'Treinando a IA...', { fontSize: '32px' });
            this._trainingText.setOrigin(0.5);

            const result = await this.botNn.trainModel();
            this.lossChart.updateChart(result.history.loss[0] as number);
            this._epochs++;
            this.lossChart.showChart();
            this._lossChartLabelText = this.add.text(this.screenWidth / 2, this.screenHeight / 1.2, 'Clique para continuar', { fontSize: '30px' });
            this._lossChartLabelText.setOrigin(0.5);
            
            // Hide training text and show chart with label
            this._trainingText.setVisible(false);
        } else {
            this.startGame();
        }

        this.updateScore();


    }

    // Set up the score display
    private setupScore() {
        const style = { fontSize: '32px', fill: '#ffffff' };
        this._scoreTextLeft = this.add.text(2, 2, `Score: ${this._scoreLeft}`, style);
        this._scoreTextRight = this.add.text(2, this.screenHeight - 32, `Score: ${this._scoreRight}`, style);
        this._epochsText = this.add.text(this.screenWidth - 210, 2, `Geração: ${this._epochs}`, style);
    }

    // Update the displayed score
    private updateScore() {
        if (this._scoreTextLeft && this._scoreTextRight && this._epochsText) {
            this._scoreTextLeft.setText(`Score: ${this._scoreLeft}`);
            this._scoreTextRight.setText(`Score: ${this._scoreRight}`);
            this._epochsText.setText(`Geração: ${this._epochs}`);
        }
    }

    // Reset the ball position and velocity
    private resetBall() {
        this.ball.setPosition(this.screenWidth / 2, this.screenHeight / 2);
        const xVelocity = Math.random() < 0.5 ? this.screenWidth * 0.3 : -this.screenWidth * 0.3;
        const yVelocity = Math.random() < 0.5 ? this.screenHeight * 0.3 : -this.screenHeight * 0.3;
        this.ball.setVelocityX(xVelocity);
        this.ball.setVelocityY(yVelocity);
        this.ball.setVisible(true);
    }

    // Initialize screen dimensions based on device size
    private setupScreenDimensions() {
        this.screenWidth = this.scale.width;
        this.screenHeight = this.scale.height;
    }

    // Set up the ball's properties and add it to the scene
    private setupBall() {
        this.ball = this.physics.add.sprite(this.screenWidth / 2, this.screenHeight / 2, 'ballSprite');
        this.ball.setDisplaySize(this.screenWidth * 0.05, this.screenWidth * 0.05); // Responsive size
        this.ball.setTint(0xffffff); // White color
        this.ball.setBounce(1, 1);
        this.ball.setCollideWorldBounds(true);
        this.ball.setVelocity(0, 0); // Start with zero velocity
        this.ball.setVisible(false); // Start invisible
    }

    // Set up paddles and add collision handling
    private setupPaddles() {
        this.paddleLeft = this.physics.add.sprite(this.screenWidth / 2, this.screenHeight * 0.05, 'botPlayerSprite');
        this.paddleLeft.setDisplaySize(this.screenWidth * 0.2, this.screenHeight * 0.03); // Responsive size
        this.paddleLeft.setImmovable(true);
        this.paddleLeft.setCollideWorldBounds(true); // Prevent from going out of bounds

        this.paddleRight = this.physics.add.sprite(this.screenWidth / 2, this.screenHeight * 0.95, 'playerSprite');
        this.paddleRight.setDisplaySize(this.screenWidth * 0.2, this.screenHeight * 0.03); // Responsive size
        this.paddleRight.setImmovable(true);
        this.paddleRight.setCollideWorldBounds(true); // Prevent from going out of bounds

        // Enable collision between ball and paddles
        this.physics.add.collider(this.ball, this.paddleLeft, this.ballHitPaddle as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        this.physics.add.collider(this.ball, this.paddleRight, this.ballHitPaddle as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    }

    // Set up input controls for paddle movement
    private setupInputControls() {
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.movePaddles(pointer.x);
        });
    }

    // Set up handler for screen resize events
    private setupResizeHandler() {
        this.scale.on('resize', this.resize, this);
    }

    // Handle ball collision with paddles
    private ballHitPaddle(ball: Phaser.Physics.Arcade.Sprite, paddle: Phaser.Physics.Arcade.Sprite) {
        this.sound.play('hit'); // Play collision sound
        
        const diff = ball.x - paddle.x; // Calculate difference between ball and paddle positions
    
        if (diff !== 0) {
            ball.setVelocityX(diff * 5); // Adjust ball velocity based on hit location
        }
    }

    // Move paddles based on pointer position
    private movePaddles(x: number) {
        this.paddleRight.setX(Phaser.Math.Clamp(x, this.paddleRight.displayWidth / 2, this.screenWidth - this.paddleRight.displayWidth / 2));
    }

    // Draw the tennis table background and lines
    private drawTennisTable() {
        const tableColor = 0x006400; // Dark green for the table

        const table = this.add.graphics({ fillStyle: { color: tableColor } });
        table.fillRect(0, 0, this.screenWidth, this.screenHeight); // Draw the table

        const lineColor = 0xffffff; // White for the lines

        const lines = this.add.graphics({ lineStyle: { width: 4, color: lineColor } });
        lines.strokeRect(0, 0, this.screenWidth, this.screenHeight); // Draw border lines
        lines.lineBetween(0, this.screenHeight / 2, this.screenWidth, this.screenHeight / 2); // Draw the middle line (net)
    }

    // Handle screen resize and adjust game elements
    private resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        if (width !== undefined && height !== undefined) {
            this.screenWidth = width;
            this.screenHeight = height;

            this.cameras.main.setSize(width, height);

            // Reposition and resize game elements for the new screen size
            this.ball.setPosition(this.screenWidth / 2, this.screenHeight / 2);
            this.ball.setDisplaySize(this.screenWidth * 0.05, this.screenWidth * 0.05);
            this.paddleLeft.setPosition(this.screenWidth / 2, this.screenHeight * 0.1);
            this.paddleLeft.setDisplaySize(this.screenWidth * 0.2, this.screenHeight * 0.03);
            this.paddleRight.setPosition(this.screenWidth / 2, this.screenHeight * 0.9);
            this.paddleRight.setDisplaySize(this.screenWidth * 0.2, this.screenHeight * 0.03);

            // Redraw the tennis table background
            this.drawTennisTable();
        }
    }
}
