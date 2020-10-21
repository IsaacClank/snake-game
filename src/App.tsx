import React from "react";
import style from "./App.module.scss";

let SNAKE_COLOR = "green";
let DIFFICULTY = 2;
let THEME: "light" | "dark" = "light";

// -------------------------------CONTEXT & TYPES-------------------------------
//

const GameSettings = React.createContext({
  settings: {
    SEG_LENGTH: 10,
    SPEED: 3,
    STEPS: 50,
    color: "green",
    lightTheme: true,
  },
  changeTheme: () => {},
  changeSnakeColor: (c: string) => {},
  changeDifficulty: (d: number) => {},
});

interface Point {
  x: number;
  y: number;
}

enum Direction {
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
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
    SPEED: DIFFICULTY,
    color: SNAKE_COLOR,
    lightTheme: THEME === "light",
  });
  const changeTheme = () => setSettings(s => ({ ...s, lightTheme: !s.lightTheme }));
  const changeSnakeColor = (c: string) => setSettings(s => ({ ...s, color: c }));
  const changeDifficulty = (d: number) => setSettings(s => ({ ...s, SPEED: d }));

  return (
    <GameSettings.Provider
      value={{
        settings: settings,
        changeTheme: changeTheme,
        changeSnakeColor: changeSnakeColor,
        changeDifficulty: changeDifficulty,
      }}
    >
      <div
        id={style.Wrapper}
        style={{
          backgroundColor: `${settings.lightTheme ? "white" : "black"}`,
          color: `${settings.lightTheme ? "black" : "white"}`,
        }}
      >
        <GameScreen gameState={gameState} updateGameState={updateGameState} />
        <MainScreen updateGameState={updateGameState} gameState={gameState} />
        <Settings gameState={gameState} />
      </div>
    </GameSettings.Provider>
  );
};
export default App;

// -------------------------------GAME SCREEN COMPONENT-------------------------------
//

// Main menu screen
const MainScreen = (props: {
  updateGameState: React.Dispatch<React.SetStateAction<GameState>>;
  gameState: GameState;
}) => {
  const startGame = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === " ") {
        props.updateGameState(GameState.Running);
        document.removeEventListener("keydown", startGame);
      }
    },
    [props]
  );

  React.useEffect(() => {
    if (props.gameState !== GameState.Running) document.addEventListener("keydown", e => startGame(e));
  }, [props.gameState, startGame]);

  return (
    <div id={style.Menu}>
      <div>{props.gameState !== GameState.Running && <p>Press Spacebar to start the game!</p>}</div>
    </div>
  );
};

// Settings
const Settings = (props: { gameState: GameState }) => {
  const { changeTheme, changeSnakeColor, settings, changeDifficulty } = React.useContext(GameSettings);
  if (props.gameState !== GameState.Running)
    return (
      <div id={style.Settings}>
        <div onChange={changeTheme}>
          <label htmlFor={style.Light}>Light</label>
          <input
            readOnly
            id={style.Light}
            type='radio'
            value='light'
            name='theme'
            checked={settings.lightTheme ? true : false}
          />
          <label htmlFor={style.Dark} style={{ marginLeft: "1em" }}>
            Dark
          </label>
          <input
            readOnly
            id={style.Dark}
            type='radio'
            value='dark'
            name='theme'
            checked={settings.lightTheme ? false : true}
          />
        </div>
        <hr></hr>
        <div>
          <label htmlFor={style.SnakeColorPicker}>Snake Color</label>
          <br />
          <input
            id={style.SnakeColorPicker}
            value={settings.color}
            onChange={e => changeSnakeColor(e.target.value)}
            type='text'
          />
        </div>
        <div>
          <label htmlFor={style.DificultySlider}>Dificulty</label>
          <br />
          <input
            type='range'
            min={1}
            max={4}
            value={settings.SPEED}
            onChange={e => changeDifficulty(Number.parseInt(e.target.value))}
          />
        </div>
      </div>
    );
  else return null;
};

// Game screen
const GameScreen = (props: {
  gameState: GameState;
  updateGameState: React.Dispatch<React.SetStateAction<GameState>>;
}) => {
  // Component States
  const { settings } = React.useContext(GameSettings);
  const [snakeState, updateSnake] = React.useReducer(snakeStateReducer, generateSnakeState(settings.STEPS));
  const [fruitState, updateFruitState] = React.useState(generateFruit(snakeState.segs));
  const [clock, setClock] = React.useState(new Date());
  const [score, setScore] = React.useState({ growth: 0, time: 0 });
  const [speed, setSpeed] = React.useState(settings.SPEED);

  // Start timer and reset snake state
  React.useEffect(() => {
    if (props.gameState === GameState.Running) {
      setClock(new Date());
    }
  }, [props.gameState]);

  // Move snake
  React.useEffect(() => {
    if (props.gameState === GameState.Running) {
      const timer = setTimeout(() => {
        updateSnake({ type: "move" });
      }, 150 / speed);
      return () => clearTimeout(timer);
    } else return;
  }, [snakeState, props.gameState, speed]);

  // Control handler
  React.useEffect(() => {
    if (props.gameState === GameState.Running)
      document?.addEventListener("keydown", (e: KeyboardEvent) => {
        switch (e.key) {
          case "ArrowUp":
            updateSnake({ type: "turn", direction: Direction.UP });
            break;
          case "ArrowDown":
            updateSnake({ type: "turn", direction: Direction.DOWN });
            break;
          case "ArrowLeft":
            updateSnake({ type: "turn", direction: Direction.LEFT });
            break;
          case "ArrowRight":
            updateSnake({ type: "turn", direction: Direction.RIGHT });
            break;
        }
      });
  }, [props.gameState]);

  // Grow snake
  React.useEffect(() => {
    if (checkEating(snakeState, fruitState) && props.gameState === GameState.Running) {
      updateSnake({ type: "grow", newHead: fruitState });
      updateFruitState(generateFruit(snakeState.segs));
      setSpeed(s => s + settings.SPEED / 25);
    }
  }, [fruitState, snakeState, props.gameState, settings.SPEED]);

  // Stop the game
  // Reset gamet state
  React.useEffect(() => {
    if (
      (crashWall(snakeState, settings.STEPS) ||
        snakeState.segs.slice(1).some(seg => checkCollision(snakeState.segs[0], seg))) &&
      props.gameState === GameState.Running
    ) {
      props.updateGameState(GameState.Over);
      setSpeed(settings.SPEED);
      updateSnake({ type: "reset", newState: generateSnakeState(settings.STEPS) });
      setScore({
        growth: snakeState.segs.length - 2,
        time: (new Date().getTime() - clock.getTime()) / 1000,
      });
    }
  }, [snakeState, props, settings.STEPS, clock, settings.SPEED]);

  return (
    <div id={style.GameScreen} style={{ borderColor: `${settings.lightTheme ? "black" : "white"}` }}>
      {props.gameState === GameState.Running ? (
        <div>
          <RenderSnake snake={snakeState.segs} color={settings.color} />
          <RenderFruit fruit={fruitState} />
        </div>
      ) : (
        <div id={style.Score} style={{ color: `${settings.lightTheme ? "blue" : "yellow"}` }}>
          <p>GROWTH: {score.growth}</p>
          <p>TIME: {score.time.toFixed(2)}s</p>
        </div>
      )}
    </div>
  );
};

// -------------------------------RENDERER COMPONENT-------------------------------
//

const RenderSnake = (props: { snake: Array<Point>; color: string }) => {
  const { settings } = React.useContext(GameSettings);
  return (
    <>
      {props.snake.map((seg, index) => {
        return (
          <div
            key={`${seg.x}-${seg.y}-${Math.random()}`}
            className={style.seg}
            style={{
              top: `${settings.SEG_LENGTH * seg.y}px`,
              left: `${settings.SEG_LENGTH * seg.x}px`,
              backgroundColor: `${props.color}`,
            }}
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
      style={{
        top: `${settings.SEG_LENGTH * props.fruit.y}px`,
        left: `${settings.SEG_LENGTH * props.fruit.x}px`,
      }}
    />
  );
};

// -------------------------------Helper Functions-------------------------------
//

// Snake State reducer
const snakeStateReducer = (
  state: SnakeState,
  action: {
    type: "grow" | "turn" | "move" | "reset";
    direction?: Direction;
    newHead?: Point;
    newState?: SnakeState;
  }
): SnakeState => {
  switch (action.type) {
    case "grow":
      if (action.newHead) return { ...state, segs: [action.newHead, ...state.segs.slice()] };
      break;
    case "move":
      return { ...state, segs: moveSnake(state) };
    case "turn":
      if (action.direction && !invalidInput(state.direction, action.direction))
        return { ...state, direction: action.direction };
      break;
    case "reset":
      if (action.newState) return { ...action.newState };
      break;
  }
  return state;
};

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
const generateFruit = (snake: Array<Point>): Point => {
  while (true) {
    const x = Math.floor(Math.random() * (30 - 5) + 1);
    const y = Math.floor(Math.random() * (30 - 1) + 1);
    if (!snake.some(seg => seg.x === x && seg.y === y)) return { x, y };
  }
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
