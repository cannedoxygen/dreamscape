Project README for Recursive Math Dreamscape.
# AI-Driven Recursive Mathematical Dreamscape

An immersive, interactive mathematical experience combining fractals, advanced web technologies, AI-generated sound, and quantum-inspired interactions.

## Overview

This project creates a unique landing page that functions as a quantum mathematical dreamscape – an immersive experience of infinite fractals, dynamic visuals, and harmonic sound that reacts intelligently to user interactions. It leverages WebGL for visualization, Web Audio API for sound generation, and OpenAI for intelligent orchestration.

## Features

- **Interactive Fractal Visualization**: Explore Mandelbrot, Julia sets, 3D Mandelbulb fractals, and hyperbolic tilings
- **AI-Generated Soundscapes**: Experience harmonic audio that adapts to your exploration
- **Quantum-Inspired Interactions**: Probabilistic events and intelligent adaptation create a unique experience each time
- **Audio-Reactive Visuals**: Watch as the fractals respond to sound in real-time
- **User-Driven Exploration**: Control the experience through intuitive interactions

## Technical Stack

- **Visualization**: Three.js, WebGL, GLSL Shaders
- **Audio**: Web Audio API, Tone.js, Magenta.js
- **AI Integration**: OpenAI API
- **Build System**: Webpack, Babel
- **Development**: JavaScript ES6+

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- NPM (v7 or higher)
- Modern web browser with WebGL support
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/recursive-math-dreamscape.git
   cd recursive-math-dreamscape
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your OpenAI API key:
   - Create a `.env` file in the project root
   - Add your API key: `OPENAI_API_KEY=your_api_key_here`

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:9000`

## Project Structure

```
recursive-math-dreamscape/
├── src/
│   ├── visualization/      # Fractal rendering and effects
│   ├── audio/              # Sound synthesis and analysis
│   ├── interaction/        # User input and UI
│   ├── ai/                 # AI orchestration with OpenAI
│   └── ...
└── ...
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the mathematical beauty of fractals and recursive structures
- Built with the power of modern web technologies and artificial intelligence