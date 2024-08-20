# Pong Game with Neural Network Bot

This project is a Pong game implemented using Phaser and TensorFlow.js. It features a neural network-powered bot that learns to play the game through reinforcement learning.

## Features

- **Phaser 3**: Used for rendering the game.
- **Neural Network**: The bot is trained using TensorFlow.js to play the game against the player.
- **Real-Time Learning**: The bot improves its gameplay after each round based on the player's actions.
- **Chart.js Integration**: Visualizes the loss of the neural network over training epochs.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/diegofer25/pong-neural-network.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd pong-neural-network
   ```

3. **Install the dependencies:**

   ```bash
   npm install
   ```

## Usage

### Development Server

To start the development server, run:

```bash
npm start
```

This will start the game on `http://localhost:4321`. The game will automatically reload if you change any of the source files.

### Production Build

To create a production build, run:

```bash
npm run build
```

The build files will be generated in the `dist` directory.

## Project Structure

- **src/**: Contains the source code of the game.
  - **index.html**: The main HTML file.
  - **pong-game.scene.ts**: The game scene file where the game logic is implemented.
  - **bot.nn.ts**: Contains the neural network logic for the bot.
  - **plot-chart.ts**: Handles the visualization of the training loss using Chart.js.
  - **assets/**: Contains game assets such as images and sounds.

## Technologies Used

- **Phaser 3**: A fast, free, and fun open-source HTML5 game framework.
- **TensorFlow.js**: A library for training and deploying machine learning models in the browser.
- **Chart.js**: A simple yet flexible JavaScript charting library.
- **Parcel**: A fast, zero-configuration web application bundler.

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

## Author

This project was created by Diego Lamarão. If you have any questions or feedback, feel free to reach out!