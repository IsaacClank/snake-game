import React from 'react';
import style from './App.module.scss';

//
// -------------------------------Game Variables-------------------------------
//
const SEG_LENGTH = 10;
const SPEED = 3;

//
// -------------------------------Game Component-------------------------------
//

// Coordinates Interface
// Multiply with SEG_LENGTH to get screen coordinates
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

interface SnakeState {
	segs: Array<Point>;
	direction: Direction;
}

const App = () => {
	const [snakeState, updateSnake] = React.useReducer(snakeStateReducer, generateSnakeState());
	// const [fruit, setFruit] = React.useState(generateFruit());

	// Effect to move the snake
	React.useEffect(() => {
		const timer = setTimeout(() => {
			updateSnake({ type: 'move' });
		}, 200 / SPEED);
		return () => clearTimeout(timer);
	}, [snakeState]);

	React.useEffect(() => {
		document?.addEventListener('keydown', e => {
			switch (e.key) {
				case 'ArrowUp':
					return updateSnake({ type: 'turn', direction: Direction.UP });
				case 'ArrowDown':
					return updateSnake({ type: 'turn', direction: Direction.DOWN });
				case 'ArrowLeft':
					return updateSnake({ type: 'turn', direction: Direction.LEFT });
				case 'ArrowRight':
					return updateSnake({ type: 'turn', direction: Direction.RIGHT });
			}
		});
	}, []);

	return (
		<div id={style.Wrapper}>
			<div id={style.Stage}>
				<RenderSnake snake={snakeState.segs} />
			</div>
		</div>
	);
};
export default App;

//
// -------------------------------Child Components-------------------------------
//

const RenderSnake = (props: { snake: Array<Point> }) => {
	return (
		<>
			{props.snake.map(seg => {
				return (
					<div
						key={`${seg.x + seg.y}`}
						className={style.seg}
						style={{ top: `${SEG_LENGTH * seg.y}px`, left: `${SEG_LENGTH * seg.x}px` }}
					/>
				);
			})}
		</>
	);
};

const RenderFruit = (props: { fruit: Point }) => {
	return (
		<div
			className={style.fruit}
			style={{ top: `${SEG_LENGTH * props.fruit.y}px`, left: `${SEG_LENGTH * props.fruit.x}px` }}
		/>
	);
};

//
// -------------------------------Helper Functions-------------------------------
//

// Generate initial state for Snake
const generateSnakeState = (): SnakeState => {
	const x = Math.floor(Math.random() * 40 + 1);
	const y = Math.floor(Math.random() * 49 + 1);

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

const generateFruit = (): Point => {
	const x = Math.floor(Math.random() * 40 + 1);
	const y = Math.floor(Math.random() * 49 + 1);
	return { x: x, y: y };
};

// Reducer for Snake state
const snakeStateReducer = (
	state: SnakeState,
	action: { type: 'grow' | 'turn' | 'move'; direction?: Direction }
): SnakeState => {
	switch (action.type) {
		case 'grow':
			return state;
		case 'move':
			return { ...state, segs: moveSnake(state) };
		case 'turn':
			if (action.direction && !invalidInput(state.direction, action.direction))
				return { ...state, direction: action.direction };
			break;
	}
	return state;
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

// Grow the snake
// const growSnake = (snakeState: SnakeState, fruit: Point) => {};

// Check for invalid inputs
const invalidInput = (dir1: Direction, dir2: Direction) => {
	if (dir1 === dir2) return true;
	if ((dir1 === Direction.DOWN || dir1 === Direction.UP) && (dir2 === Direction.DOWN || dir2 === Direction.UP))
		return true;
	if ((dir1 === Direction.LEFT || dir1 === Direction.RIGHT) && (dir2 === Direction.LEFT || dir2 === Direction.RIGHT))
		return true;

	return false;
};
