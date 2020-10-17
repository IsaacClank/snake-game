import React from 'react';
import style from './App.module.scss';

// -------------------------------CONTEXT & TYPES-------------------------------
//

const GameSettings = React.createContext({
	settings: {
		SEG_LENGTH: 10,
		SPEED: 3,
		STEPS: 50,
	},
	increaseSpeed: () => {},
	resetSpeed: () => {},
});

interface Point {
	x: number;
	y: number;
}

enum Direction {
	UP = 'UP',
	DOWN = 'DOWN',
	LEFT = 'LEFT',
	RIGHT = 'RIGHT',
}

enum GameState {
	Pause,
	Running,
	Over,
}

interface SnakeState {
	segs: Array<Point>;
	direction: Direction;
}

// -------------------------------GAME SCREEN COMPONENT-------------------------------
//

const App = () => {
	const [gameState, updateGameState] = React.useState<GameState>(GameState.Pause);
	const [settings, setSettings] = React.useState({
		SEG_LENGTH: 20,
		STEPS: 30,
		SPEED: 2, // Change this to raise difficulty
	});
	const increaseSpeed = () => setSettings(s => ({ ...s, SPEED: s.SPEED + 0.1 }));
	const resetSpeed = () => setSettings(s => ({ ...s, SPEED: 2 }));
	// console.clear();

	return (
		<GameSettings.Provider value={{ settings: settings, increaseSpeed: increaseSpeed, resetSpeed: resetSpeed }}>
			<div id={style.Wrapper}>
				{gameState === GameState.Running ? (
					<GameScreen gameState={gameState} updateGameState={updateGameState} />
				) : (
					<MainScreen updateGameState={updateGameState} gameState={gameState} />
				)}
			</div>
		</GameSettings.Provider>
	);
};
export default App;

// -------------------------------GAME SCREEN COMPONENT-------------------------------
//

// Main & GameOver screen
const MainScreen = (props: {
	updateGameState: React.Dispatch<React.SetStateAction<GameState>>;
	gameState: GameState;
}) => {
	return (
		<div id={style.Menu}>
			{props.gameState === GameState.Over && (
				<div>
					<h1>GAME OVER</h1>
				</div>
			)}
			<div>
				<button onClick={() => props.updateGameState(GameState.Running)}>Start</button>
			</div>
		</div>
	);
};

// Game screen
const GameScreen = (props: {
	gameState: GameState;
	updateGameState: React.Dispatch<React.SetStateAction<GameState>>;
}) => {
	// Component States
	const { settings, increaseSpeed, resetSpeed } = React.useContext(GameSettings);
	const [fruitState, updateFruitState] = React.useState(generateFruit());
	const [snakeState, updateSnake] = React.useReducer(
		(
			state: SnakeState,
			action: { type: 'grow' | 'turn' | 'move'; direction?: Direction; newHead?: Point }
		): SnakeState => {
			switch (action.type) {
				case 'grow':
					if (action.newHead) return { ...state, segs: [action.newHead, ...state.segs.slice()] };
					break;
				case 'move':
					return { ...state, segs: moveSnake(state) };
				case 'turn':
					if (action.direction && !invalidInput(state.direction, action.direction))
						return { ...state, direction: action.direction };
					break;
			}
			return state;
		},
		generateSnakeState(settings.STEPS)
	);

	// Move snake
	React.useEffect(() => {
		if (props.gameState === GameState.Running) {
			const timer = setTimeout(() => {
				updateSnake({ type: 'move' });
			}, 200 / settings.SPEED);
			return () => clearTimeout(timer);
		} else return;
	}, [snakeState, props.gameState, settings.SPEED]);

	// Handle keypress
	React.useEffect(() => {
		if (props.gameState === GameState.Running)
			document?.addEventListener('keydown', (e: KeyboardEvent) => {
				switch (e.key) {
					case 'ArrowUp':
						updateSnake({ type: 'turn', direction: Direction.UP });
						break;
					case 'ArrowDown':
						updateSnake({ type: 'turn', direction: Direction.DOWN });
						break;
					case 'ArrowLeft':
						updateSnake({ type: 'turn', direction: Direction.LEFT });
						break;
					case 'ArrowRight':
						updateSnake({ type: 'turn', direction: Direction.RIGHT });
						break;
				}
			});
	}, [props.gameState]);

	// Check grow condition
	React.useEffect(() => {
		const currFruit = fruitState;
		if (checkEating(snakeState, fruitState)) {
			updateFruitState(generateFruit());
			increaseSpeed();
			updateSnake({ type: 'grow', newHead: currFruit });
		}
	}, [fruitState, snakeState, increaseSpeed]);

	// Check Game Over
	React.useEffect(() => {
		if (
			crashWall(snakeState, settings.STEPS) ||
			snakeState.segs.slice(1).some(seg => checkCollision(snakeState.segs[0], seg))
		) {
			props.updateGameState(GameState.Over);
			resetSpeed();
		}
	}, [snakeState, props, settings.STEPS, resetSpeed]);

	return (
		<div id={style.GameScreen}>
			<RenderSnake snake={snakeState.segs} />
			<RenderFruit fruit={fruitState} />
		</div>
	);
};

// -------------------------------RENDERER COMPONENT-------------------------------
//

const RenderSnake = (props: { snake: Array<Point> }) => {
	const { settings } = React.useContext(GameSettings);
	return (
		<>
			{props.snake.map((seg, index) => {
				return (
					<div
						key={`${seg.x}-${seg.y}-${Math.random()}`}
						className={style.seg}
						style={{ top: `${settings.SEG_LENGTH * seg.y}px`, left: `${settings.SEG_LENGTH * seg.x}px` }}
					/>
				);
			})}
		</>
	);
};

const RenderFruit = (props: { fruit: Point }) => {
	const { settings } = React.useContext(GameSettings);
	return (
		<div
			className={style.fruit}
			style={{ top: `${settings.SEG_LENGTH * props.fruit.y}px`, left: `${settings.SEG_LENGTH * props.fruit.x}px` }}
		/>
	);
};

// -------------------------------Helper Functions-------------------------------
//

// Generate initial state for Snake
const generateSnakeState = (steps: number): SnakeState => {
	const x = Math.floor(Math.random() * (steps - 10) + 1);
	const y = Math.floor(Math.random() * (steps - 1) + 1);

	return {
		segs: [
			{
				x: x,
				y: y,
			},
			{
				x: x + 1,
				y: y,
			},
		],
		direction: Direction.RIGHT,
	};
};

// Fruit position generator
const generateFruit = (): Point => {
	const x = Math.floor(Math.random() * (30 - 5) + 1);
	const y = Math.floor(Math.random() * (30 - 1) + 1);
	return { x: x, y: y };
};

// Move the Snake
const moveSnake = (snakeState: SnakeState): Array<Point> => {
	const head = snakeState.segs[0];
	const segs = snakeState.segs.slice(0, snakeState.segs.length - 1);
	switch (snakeState.direction) {
		case Direction.UP:
			segs.unshift({ ...head, y: head.y - 1 });
			break;
		case Direction.DOWN:
			segs.unshift({ ...head, y: head.y + 1 });
			break;
		case Direction.LEFT:
			segs.unshift({ ...head, x: head.x - 1 });
			break;
		case Direction.RIGHT:
			segs.unshift({ ...head, x: head.x + 1 });
			break;
		default:
			break;
	}
	return segs;
};

// Check for invalid inputs
const invalidInput = (dir1: Direction, dir2: Direction) => {
	if (dir1 === dir2) return true;
	if ((dir1 === Direction.DOWN || dir1 === Direction.UP) && (dir2 === Direction.DOWN || dir2 === Direction.UP))
		return true;
	if ((dir1 === Direction.LEFT || dir1 === Direction.RIGHT) && (dir2 === Direction.LEFT || dir2 === Direction.RIGHT))
		return true;

	return false;
};

// Bound check
const crashWall = (snakeState: SnakeState, bound: number): boolean => {
	const head = snakeState.segs[0];
	if (head.y < 0 || head.y >= bound) return true;
	if (head.x < 0 || head.x >= bound) return true;

	return false;
};

// Check for self-collision
const checkCollision = (p1: Point, p2: Point): boolean => {
	if (p1.x === p2.x && p1.y === p2.y) return true;
	return false;
};

// Check if about to collide with fruit position
const checkEating = (snakeState: SnakeState, fruit: Point): boolean => {
	const head = snakeState.segs[0];
	switch (snakeState.direction) {
		case Direction.UP:
			if (head.y - 1 === fruit.y && head.x === fruit.x) return true;
			break;
		case Direction.DOWN:
			if (head.y + 1 === fruit.y && head.x === fruit.x) return true;
			break;
		case Direction.LEFT:
			if (head.y === fruit.y && head.x - 1 === fruit.x) return true;
			break;
		case Direction.RIGHT:
			if (head.y === fruit.y && head.x + 1 === fruit.x) return true;
			break;
	}
	return false;
};
