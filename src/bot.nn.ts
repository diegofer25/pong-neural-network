import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

export class BotNeuralNetwork {
    private _model: tf.LayersModel;
    private _trainingData: Array<{ state: number[], action: number }> = [];

    constructor() {
        this._model = this.createModel(); // Initialize the neural network model
    }

    /**
     * Predicts the bot's paddle movement based on the current game state.
     * 
     * @param ballX - X position of the ball
     * @param ballY - Y position of the ball
     * @param ballVelocityX - Velocity of the ball along X axis
     * @param ballVelocityY - Velocity of the ball along Y axis
     * @param botPaddleX - X position of the bot's paddle
     * @param paddleWidth - Width of the paddle
     * @param playerPaddleX - X position of the player's paddle
     * @param screenHeight - Height of the game screen
     * @param screenWidth - Width of the game screen
     * @returns Predicted X position for the bot's paddle
     */
    public predict(
        ballX: number,
        ballY: number,
        ballVelocityX: number,
        ballVelocityY: number, 
        botPaddleX: number,
        paddleWidth: number,
        playerPaddleX: number,
        screenHeight: number,
        screenWidth: number
    ): number {
        const state = tf.tensor2d([[
            ballX,
            ballY,
            ballVelocityX,
            ballVelocityY,
            botPaddleX,
            playerPaddleX
        ]]);

        // Predict the bot's next action based on the current state
        const prediction = this._model.predict(state) as tf.Tensor;
        const output = prediction.dataSync()[0];

        // Determine the bot's action based on the ball's position and player paddle
        const action = this.determineAction(
            ballX, ballY, playerPaddleX, paddleWidth, screenHeight, screenWidth
        );

        // Save the current state and action for training
        this._trainingData.push({
            state: Array.from(state.dataSync()),
            action: action
        });

        // Clean up tensors to free memory
        state.dispose();
        prediction.dispose();

        console.log('Predicted:', Math.round(output), 'Actual:', Math.round(action));

        return output;
    }

    /**
     * Determines the action the bot should take based on the game state.
     * 
     * @param ballX - X position of the ball
     * @param ballY - Y position of the ball
     * @param playerPaddleX - X position of the player's paddle
     * @param paddleWidth - Width of the paddle
     * @param screenHeight - Height of the game screen
     * @param screenWidth - Width of the game screen
     * @returns The calculated action (X position) the bot should move to
     */
    private determineAction(
        ballX: number, 
        ballY: number, 
        playerPaddleX: number, 
        paddleWidth: number, 
        screenHeight: number, 
        screenWidth: number
    ): number {
        if (ballY < screenHeight / 2) {
            if (playerPaddleX < screenWidth / 2) {
                return ballX - Phaser.Math.Between(0, paddleWidth / 2);
            }
            return ballX + Phaser.Math.Between(0, paddleWidth / 2);
        }
        return screenWidth / 2;
    }

    /**
     * Trains the model with the collected training data.
     * 
     * @returns Training result
     */
    public async trainModel(): Promise<tf.History> {
        console.log('Training model...');
        const states = tf.tensor(this._trainingData.map(d => d.state));
        const actions = tf.tensor(this._trainingData.map(d => [d.action]));

        // Train the model using the states and actions
        const result = await this._model.fit(states, actions);

        console.log('Loss:', result.history.loss[0]);
        console.log('Epochs:', result.epoch.length);

        // Clear the training data after training
        this._trainingData = [];

        // Clean up tensors to free memory
        states.dispose();
        actions.dispose();

        return result;
    }

    /**
     * Creates the neural network model with layers.
     * 
     * @returns Configured neural network model
     */
    private createModel(): tf.LayersModel {
        const model = tf.sequential();

        // Input layer with 64 units
        model.add(tf.layers.dense({ inputShape: [6], units: 64 }));

        // Hidden layers with 128 and 64 units and ReLU activation
        model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 64, activation: 'relu' }));

        // Output layer with 1 unit for the predicted action
        model.add(tf.layers.dense({ units: 1 }));

        // Compile the model with Adam optimizer and Mean Squared Error loss
        const optimizer = tf.train.adam(0.001);
        model.compile({ optimizer, loss: 'meanSquaredError' });

        return model;
    }
}
