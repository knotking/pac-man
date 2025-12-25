
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Direction, 
  GameStatus, 
  TileType, 
  Position, 
  Entity, 
  Ghost, 
  GameState 
} from './types';
import { 
  MAZE_LAYOUT, 
  TILE_SIZE, 
  GRID_WIDTH, 
  GRID_HEIGHT, 
  INITIAL_LIVES, 
  GHOST_DATA,
  POWER_PELLET_DURATION
} from './constants';
import { getGameCommentary, getStrategyTip } from './services/geminiService';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: INITIAL_LIVES,
    level: 1,
    status: GameStatus.IDLE,
    powerTimer: 0
  });

  const [aiMessage, setAiMessage] = useState<string>("READY PLAYER ONE?");
  const [tipMessage, setTipMessage] = useState<string>("USE ARROW KEYS TO MOVE.");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pacmanRef = useRef<Entity>({
    pos: { x: 13.5 * TILE_SIZE, y: 23 * TILE_SIZE },
    dir: Direction.NONE,
    nextDir: Direction.NONE,
    speed: 2.2 // Slightly faster for responsiveness
  });

  const ghostsRef = useRef<Ghost[]>([]);
  const mazeRef = useRef<number[][]>(MAZE_LAYOUT.map(row => [...row]));
  const frameId = useRef<number>(0);
  const wakaCooldownRef = useRef<number>(0);

  const initGhosts = useCallback((level: number) => {
    const speed = 1.5 + (level - 1) * 0.2;
    ghostsRef.current = GHOST_DATA.map(g => ({
      ...g,
      pos: { x: g.startPos.x * TILE_SIZE, y: g.startPos.y * TILE_SIZE },
      dir: Direction.UP,
      nextDir: Direction.NONE,
      speed: speed,
      isFrightened: false,
      isEaten: false
    }));
  }, []);

  const resetEntities = useCallback((level: number) => {
    pacmanRef.current = {
      pos: { x: 13.5 * TILE_SIZE, y: 23 * TILE_SIZE },
      dir: Direction.NONE,
      nextDir: Direction.NONE,
      speed: 2.2
    };
    initGhosts(level);
  }, [initGhosts]);

  const startGame = () => {
    mazeRef.current = MAZE_LAYOUT.map(row => [...row]);
    setGameState({
      score: 0,
      lives: INITIAL_LIVES,
      level: 1,
      status: GameStatus.PLAYING,
      powerTimer: 0
    });
    resetEntities(1);
    fetchNewTip();
    setAiMessage("WAKA WAKA WAKA!");
    audioService.playStartFanfare();
    audioService.startBackgroundMusic();
  };

  const startNextLevel = useCallback(() => {
    setGameState(prev => {
      const nextLevel = prev.level + 1;
      mazeRef.current = MAZE_LAYOUT.map(row => [...row]);
      resetEntities(nextLevel);
      audioService.playStartFanfare();
      audioService.startBackgroundMusic();
      setAiMessage(`LEVEL ${nextLevel} - FASTER GHOSTS!`);
      return { 
        ...prev, 
        level: nextLevel, 
        status: GameStatus.PLAYING,
        powerTimer: 0 
      };
    });
  }, [resetEntities]);

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioService.setMute(newMute);
    if (!newMute && gameState.status === GameStatus.PLAYING) {
      audioService.startBackgroundMusic(gameState.powerTimer > 0);
    }
  };

  const fetchNewTip = async () => {
    const tip = await getStrategyTip();
    setTipMessage(tip);
  };

  const fetchCommentary = async (score: number, level: number, status: 'WON' | 'GAME_OVER') => {
    setIsAiLoading(true);
    const msg = await getGameCommentary(score, level, status);
    setAiMessage(msg);
    setIsAiLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (key === 'ArrowUp') pacmanRef.current.nextDir = Direction.UP;
    if (key === 'ArrowDown') pacmanRef.current.nextDir = Direction.DOWN;
    if (key === 'ArrowLeft') pacmanRef.current.nextDir = Direction.LEFT;
    if (key === 'ArrowRight') pacmanRef.current.nextDir = Direction.RIGHT;
  };

  const isWall = (x: number, y: number) => {
    const gridX = Math.floor(x / TILE_SIZE);
    const gridY = Math.floor(y / TILE_SIZE);
    if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) return false;
    return mazeRef.current[gridY][gridX] === TileType.WALL;
  };

  const getNextPos = (pos: Position, dir: Direction, speed: number): Position => {
    const next = { ...pos };
    if (dir === Direction.UP) next.y -= speed;
    if (dir === Direction.DOWN) next.y += speed;
    if (dir === Direction.LEFT) next.x -= speed;
    if (dir === Direction.RIGHT) next.x += speed;

    // Wrap around for tunnels
    if (next.x < 0) next.x = (GRID_WIDTH - 1) * TILE_SIZE;
    if (next.x > (GRID_WIDTH - 1) * TILE_SIZE) next.x = 0;

    return next;
  };

  const checkCollision = (pos: Position, dir: Direction): boolean => {
    const padding = Math.ceil(TILE_SIZE / 8); 
    const testPoints = [];
    if (dir === Direction.UP) testPoints.push({ x: pos.x + padding, y: pos.y - 1 }, { x: pos.x + TILE_SIZE - padding, y: pos.y - 1 });
    if (dir === Direction.DOWN) testPoints.push({ x: pos.x + padding, y: pos.y + TILE_SIZE }, { x: pos.x + TILE_SIZE - padding, y: pos.y + TILE_SIZE });
    if (dir === Direction.LEFT) testPoints.push({ x: pos.x - 1, y: pos.y + padding }, { x: pos.x - 1, y: pos.y + TILE_SIZE - padding });
    if (dir === Direction.RIGHT) testPoints.push({ x: pos.x + TILE_SIZE, y: pos.y + padding }, { x: pos.x + TILE_SIZE, y: pos.y + TILE_SIZE - padding });

    return testPoints.some(p => isWall(p.x, p.y));
  };

  const update = () => {
    if (gameState.status !== GameStatus.PLAYING) return;

    // Update Pac-man
    const pac = pacmanRef.current;
    if (pac.nextDir !== Direction.NONE && !checkCollision(pac.pos, pac.nextDir)) {
      pac.dir = pac.nextDir;
    }

    if (!checkCollision(pac.pos, pac.dir)) {
      pac.pos = getNextPos(pac.pos, pac.dir, pac.speed);
      
      // Sound logic for movement
      if (pac.dir !== Direction.NONE && wakaCooldownRef.current <= 0) {
        audioService.playWaka();
        wakaCooldownRef.current = 15; // frames
      }
    }
    
    if (wakaCooldownRef.current > 0) wakaCooldownRef.current--;

    // Eat pellets
    const gridX = Math.floor((pac.pos.x + TILE_SIZE / 2) / TILE_SIZE);
    const gridY = Math.floor((pac.pos.y + TILE_SIZE / 2) / TILE_SIZE);
    if (gridY < 0 || gridY >= GRID_HEIGHT || gridX < 0 || gridX >= GRID_WIDTH) return;

    const tile = mazeRef.current[gridY][gridX];

    if (tile === TileType.PELLET || tile === TileType.POWER_PELLET) {
      mazeRef.current[gridY][gridX] = TileType.EMPTY;
      
      if (tile === TileType.POWER_PELLET) {
        audioService.playPowerPellet();
        audioService.startBackgroundMusic(true);
      }

      setGameState(prev => {
        const newScore = prev.score + (tile === TileType.PELLET ? 10 : 50);
        // Scaled power pellet duration
        const duration = Math.max(120, POWER_PELLET_DURATION - (prev.level - 1) * 60);
        const newPowerTimer = tile === TileType.POWER_PELLET ? duration : Math.max(0, prev.powerTimer - 1);
        
        if (tile === TileType.POWER_PELLET) {
          ghostsRef.current.forEach(g => {
            if (!g.isEaten) g.isFrightened = true;
          });
        }
        
        return { ...prev, score: newScore, powerTimer: newPowerTimer };
      });
    } else {
      setGameState(prev => {
        const nextPowerTimer = Math.max(0, prev.powerTimer - 1);
        if (prev.powerTimer > 0 && nextPowerTimer === 0) {
          audioService.startBackgroundMusic(false);
          ghostsRef.current.forEach(g => { g.isFrightened = false; g.isEaten = false; });
        }
        return { ...prev, powerTimer: nextPowerTimer };
      });
    }

    // Update Ghosts
    ghostsRef.current.forEach(ghost => {
      if (!checkCollision(ghost.pos, ghost.dir) && Math.random() > 0.05) {
        ghost.pos = getNextPos(ghost.pos, ghost.dir, ghost.isFrightened ? ghost.speed * 0.5 : ghost.speed);
      } else {
        const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        const validDirs = dirs.filter(d => !checkCollision(ghost.pos, d));
        ghost.dir = validDirs[Math.floor(Math.random() * validDirs.length)] || Direction.NONE;
      }

      const dist = Math.sqrt(Math.pow(pac.pos.x - ghost.pos.x, 2) + Math.pow(pac.pos.y - ghost.pos.y, 2));
      if (dist < TILE_SIZE * 0.8) {
        if (ghost.isFrightened && !ghost.isEaten) {
          ghost.isEaten = true;
          audioService.playGhostEaten();
          setGameState(prev => ({ ...prev, score: prev.score + 200 }));
        } else if (!ghost.isEaten) {
          audioService.playDeath();
          audioService.stopBackgroundMusic();
          setGameState(prev => {
            if (prev.lives > 1) {
              resetEntities(prev.level);
              setTimeout(() => {
                if (gameState.status === GameStatus.PLAYING) audioService.startBackgroundMusic();
              }, 1500);
              return { ...prev, lives: prev.lives - 1 };
            } else {
              fetchCommentary(prev.score, prev.level, 'GAME_OVER');
              return { ...prev, lives: 0, status: GameStatus.GAME_OVER };
            }
          });
        }
      }
    });

    // Level Clear condition
    const pelletsCount = mazeRef.current.flat().filter(t => t === TileType.PELLET || t === TileType.POWER_PELLET).length;
    if (pelletsCount === 0) {
      audioService.stopBackgroundMusic();
      setGameState(prev => ({ ...prev, status: GameStatus.WON }));
      // Small delay before next level
      setTimeout(() => {
        startNextLevel();
      }, 2000);
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    mazeRef.current.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === TileType.WALL) {
          ctx.fillStyle = '#2121ff';
          ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        } else if (tile === TileType.PELLET) {
          ctx.fillStyle = '#ffb8ae';
          ctx.beginPath();
          ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TileType.POWER_PELLET) {
          if (Math.floor(Date.now() / 200) % 2 === 0) {
            ctx.fillStyle = '#ffb8ae';
            ctx.beginPath();
            ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    });

    const pac = pacmanRef.current;
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    let startAngle = 0.2 * Math.PI;
    let endAngle = 1.8 * Math.PI;
    if (pac.dir === Direction.UP) { startAngle = 1.7 * Math.PI; endAngle = 1.3 * Math.PI; }
    if (pac.dir === Direction.DOWN) { startAngle = 0.7 * Math.PI; endAngle = 0.3 * Math.PI; }
    if (pac.dir === Direction.LEFT) { startAngle = 1.2 * Math.PI; endAngle = 0.8 * Math.PI; }
    const mouthOpen = (Math.sin(Date.now() / 50) + 1) / 2;
    ctx.arc(pac.pos.x + TILE_SIZE / 2, pac.pos.y + TILE_SIZE / 2, TILE_SIZE / 2 - 2, startAngle * mouthOpen, endAngle + (2 * Math.PI - endAngle) * (1 - mouthOpen));
    ctx.lineTo(pac.pos.x + TILE_SIZE / 2, pac.pos.y + TILE_SIZE / 2);
    ctx.fill();

    ghostsRef.current.forEach(ghost => {
      if (ghost.isEaten) return;
      ctx.fillStyle = ghost.isFrightened ? '#2121ff' : ghost.color;
      ctx.beginPath();
      ctx.arc(ghost.pos.x + TILE_SIZE / 2, ghost.pos.y + TILE_SIZE / 3, TILE_SIZE / 2 - 2, Math.PI, 0);
      ctx.lineTo(ghost.pos.x + TILE_SIZE - 2, ghost.pos.y + TILE_SIZE - 2);
      ctx.lineTo(ghost.pos.x + 2, ghost.pos.y + TILE_SIZE - 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ghost.pos.x + TILE_SIZE * 0.3, ghost.pos.y + TILE_SIZE * 0.3, 3, 0, Math.PI * 2);
      ctx.arc(ghost.pos.x + TILE_SIZE * 0.7, ghost.pos.y + TILE_SIZE * 0.3, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [gameState.powerTimer]);

  useEffect(() => {
    const loop = () => {
      update();
      draw();
      frameId.current = requestAnimationFrame(loop);
    };
    frameId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId.current);
  }, [gameState.status, draw, gameState.level]); // Added level dependency to loop if needed

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white font-['Press_Start_2P']" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-start">
        
        <div className="flex flex-col gap-6 order-2 lg:order-1">
          <div className="retro-border p-4 bg-gray-900 rounded-lg text-center">
            <h2 className="text-yellow-400 text-sm mb-4">LEVEL</h2>
            <p className="text-3xl text-white">{gameState.level}</p>
          </div>
          <div className="retro-border p-4 bg-gray-900 rounded-lg">
            <h2 className="text-yellow-400 text-sm mb-4">SCORE</h2>
            <p className="text-2xl">{gameState.score.toString().padStart(6, '0')}</p>
          </div>
          <div className="retro-border p-4 bg-gray-900 rounded-lg">
            <h2 className="text-red-500 text-sm mb-4 flex justify-between items-center">
              LIVES
              <button 
                onClick={toggleMute} 
                className={`text-[10px] px-2 py-1 rounded border ${isMuted ? 'bg-red-900 border-red-500' : 'bg-gray-800 border-gray-500'}`}
              >
                {isMuted ? '🔇 MUTE' : '🔊 AUDIO'}
              </button>
            </h2>
            <div className="flex gap-2">
              {Array.from({ length: gameState.lives }).map((_, i) => (
                <div key={i} className="w-6 h-6 bg-yellow-400 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center order-1 lg:order-2">
          <h1 className="text-3xl text-yellow-400 mb-6 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]">PAC-MAN</h1>
          <div className="relative retro-border overflow-hidden rounded-md bg-black shadow-2xl">
            <canvas
              ref={canvasRef}
              width={GRID_WIDTH * TILE_SIZE}
              height={GRID_HEIGHT * TILE_SIZE}
              className="max-w-full h-auto"
            />
            {gameState.status === GameStatus.IDLE && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 text-center">
                <p className="mb-8 text-yellow-400 animate-pulse">CLICK TO START</p>
                <button 
                  onClick={startGame}
                  className="bg-yellow-400 text-black px-8 py-4 hover:bg-yellow-300 active:translate-y-1 transition-all"
                >
                  START GAME
                </button>
              </div>
            )}
            {gameState.status === GameStatus.WON && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-2xl mb-4 text-green-500 animate-bounce">LEVEL CLEAR!</p>
                <p className="text-xs text-white">GET READY FOR LEVEL {gameState.level + 1}</p>
              </div>
            )}
            {gameState.status === GameStatus.GAME_OVER && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-2xl mb-4 text-red-500">GAME OVER</p>
                <p className="text-xs mb-8 leading-relaxed text-gray-400 max-w-xs mx-auto">{isAiLoading ? "..." : aiMessage}</p>
                <button 
                  onClick={startGame}
                  className="bg-yellow-400 text-black px-8 py-4 hover:bg-yellow-300"
                >
                  REPLAY
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 order-3">
          <div className="retro-border p-4 bg-gray-900 rounded-lg flex-1">
            <h2 className="text-cyan-400 text-sm mb-4">PRO TIPS</h2>
            <div className="border-l-4 border-cyan-400 pl-4 py-2">
              <p className="text-[10px] leading-6 text-gray-300">
                {tipMessage}
              </p>
            </div>
          </div>
          <div className="retro-border p-4 bg-gray-900 rounded-lg flex-1">
            <h2 className="text-pink-400 text-sm mb-4">GEMINI COMMS</h2>
            <p className="text-[10px] leading-6 text-pink-200">
              {aiMessage}
            </p>
          </div>
          <div className="text-[8px] text-gray-600 text-center mt-4">
            &copy; 1980 GEMINI NAMCO CLONE<br/>
            ALL RIGHTS RESERVED
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-0 right-0 lg:hidden flex justify-center gap-4 px-4 opacity-50 hover:opacity-100 transition-opacity">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <button className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center" onTouchStart={() => pacmanRef.current.nextDir = Direction.UP}>↑</button>
          <div />
          <button className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center" onTouchStart={() => pacmanRef.current.nextDir = Direction.LEFT}>←</button>
          <button className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center" onTouchStart={() => pacmanRef.current.nextDir = Direction.DOWN}>↓</button>
          <button className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center" onTouchStart={() => pacmanRef.current.nextDir = Direction.RIGHT}>→</button>
        </div>
      </div>
    </div>
  );
};

export default App;
