import React, { useEffect, useRef, useState } from 'react';
import { Gamepad2, RotateCcw, Trophy, Volume2, VolumeX, Play, Pause, Zap } from 'lucide-react';
import { Game } from '../data/gamesData';

interface CanvasGameEngineProps {
  game: Game;
  onScoreUpdate?: (score: number) => void;
}

export const CanvasGameEngine: React.FC<CanvasGameEngineProps> = ({ game, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem(`hs_${game.slug}`) || '0', 10);
  });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sound generator using Web Audio API
  const playSound = (type: 'score' | 'jump' | 'crash' | 'hit' | 'win') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'score') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'jump') {
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // Audio context suppressed
    }
  };

  const updateHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem(`hs_${game.slug}`, newScore.toString());
    }
    if (onScoreUpdate) onScoreUpdate(newScore);
  };

  // Determine game engine variant based on game category or title/slug
  const gameVariant = (() => {
    const s = game.slug.toLowerCase();
    if (s.includes('slope') || s.includes('roll') || s.includes('body-drop')) return 'slope';
    if (s.includes('2048') || game.category === 'puzzles') return '2048';
    if (s.includes('flappy') || s.includes('easter') || s.includes('among')) return 'flappy';
    if (s.includes('snake')) return 'snake';
    if (s.includes('space') || s.includes('invader') || s.includes('fractal') || s.includes('alpha')) return 'shooter';
    if (s.includes('brick') || s.includes('breakout') || s.includes('huggy')) return 'brick';
    if (s.includes('moto') || s.includes('race') || s.includes('car') || s.includes('chinko')) return 'racer';
    if (s.includes('basket') || s.includes('foot') || s.includes('sports')) return 'basketball';
    return 'slope'; // default high-speed arcade game
  })();

  // Game engine state ref to keep physics continuous across ticks
  const engineRef = useRef<any>({
    active: false,
    score: 0,
    keys: {} as Record<string, boolean>,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleStartGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    engineRef.current.score = 0;
    engineRef.current.active = true;
  };

  useEffect(() => {
    if (!gameStarted || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // --- VARIANT 1: SLOPE 3D BALL ROLLER ---
    if (gameVariant === 'slope') {
      let ballX = canvas.width / 2;
      let ballSpeedX = 0;
      let forwardSpeed = 6;
      let distance = 0;
      let obstacles: { x: number; y: number; width: number; height: number; type: number }[] = [];

      const spawnObstacle = (y: number) => {
        const w = 50 + Math.random() * 60;
        const x = 80 + Math.random() * (canvas.width - 160 - w);
        obstacles.push({ x, y, width: w, height: 24, type: Math.floor(Math.random() * 3) });
      };

      for (let i = 0; i < 6; i++) {
        spawnObstacle(-150 - i * 180);
      }

      const loop = () => {
        const keys = engineRef.current.keys;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) ballSpeedX -= 0.6;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) ballSpeedX += 0.6;

        ballSpeedX *= 0.92;
        ballX += ballSpeedX;

        // Wall boundary
        if (ballX < 40 || ballX > canvas.width - 40) {
          playSound('crash');
          setGameOver(true);
          updateHighScore(Math.floor(distance));
          return;
        }

        forwardSpeed += 0.002;
        distance += forwardSpeed * 0.1;
        setScore(Math.floor(distance));
        engineRef.current.score = Math.floor(distance);

        // Update obstacles
        obstacles.forEach((obs) => {
          obs.y += forwardSpeed;
        });

        // Collision check
        const ballRadius = 14;
        const ballY = canvas.height - 100;

        for (const obs of obstacles) {
          if (
            ballY - ballRadius < obs.y + obs.height &&
            ballY + ballRadius > obs.y &&
            ballX + ballRadius > obs.x &&
            ballX - ballRadius < obs.x + obs.width
          ) {
            playSound('crash');
            setGameOver(true);
            updateHighScore(Math.floor(distance));
            return;
          }
        }

        // Recycle obstacles
        obstacles = obstacles.filter((obs) => obs.y < canvas.height + 50);
        while (obstacles.length < 6) {
          const minY = Math.min(...obstacles.map((o) => o.y), 0);
          spawnObstacle(minY - (150 + Math.random() * 100));
        }

        // Draw 3D neon tunnel slope
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Track edges
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(30, canvas.height);
        ctx.moveTo(canvas.width - 30, 0);
        ctx.lineTo(canvas.width - 30, canvas.height);
        ctx.stroke();

        // Speed grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        const gridOffset = (distance * 20) % 40;
        for (let y = gridOffset; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(30, y);
          ctx.lineTo(canvas.width - 30, y);
          ctx.stroke();
        }

        // Draw obstacles
        obstacles.forEach((obs) => {
          ctx.fillStyle = obs.type === 0 ? '#e11d48' : obs.type === 1 ? '#f59e0b' : '#a855f7';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 12;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.shadowBlur = 0;
        });

        // Draw neon 3D ball
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        // Ball shine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ballX - 4, ballY - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
    }

    // --- VARIANT 2: FLAPPY BIRD / JETPACK ---
    else if (gameVariant === 'flappy') {
      let birdY = canvas.height / 2;
      let velocity = 0;
      let gravity = 0.45;
      let pipeSpeed = 3;
      let pipes: { x: number; top: number; bottom: number; passed: boolean }[] = [];
      let frameCount = 0;
      let localScore = 0;

      const loop = () => {
        frameCount++;
        const keys = engineRef.current.keys;

        if (keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) {
          if (velocity > -6) {
            velocity = -7.5;
            playSound('jump');
          }
          keys[' '] = false;
          keys['ArrowUp'] = false;
          keys['w'] = false;
          keys['W'] = false;
        }

        velocity += gravity;
        birdY += velocity;

        if (birdY < 10 || birdY > canvas.height - 20) {
          playSound('crash');
          setGameOver(true);
          updateHighScore(localScore);
          return;
        }

        // Spawn pipes
        if (frameCount % 90 === 0) {
          const gap = 140;
          const minHeight = 60;
          const topHeight = minHeight + Math.random() * (canvas.height - gap - minHeight * 2);
          pipes.push({
            x: canvas.width,
            top: topHeight,
            bottom: canvas.height - topHeight - gap,
            passed: false,
          });
        }

        // Move pipes
        pipes.forEach((p) => {
          p.x -= pipeSpeed;
          if (!p.passed && p.x < 120) {
            p.passed = true;
            localScore += 1;
            setScore(localScore);
            playSound('score');
          }
        });

        // Collision check
        const birdX = 120;
        const birdR = 14;

        for (const p of pipes) {
          if (p.x < birdX + birdR && p.x + 50 > birdX - birdR) {
            if (birdY - birdR < p.top || birdY + birdR > canvas.height - p.bottom) {
              playSound('crash');
              setGameOver(true);
              updateHighScore(localScore);
              return;
            }
          }
        }

        pipes = pipes.filter((p) => p.x > -60);

        // Render Flappy
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Pipes
        pipes.forEach((p) => {
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 8;
          // Top pipe
          ctx.fillRect(p.x, 0, 50, p.top);
          // Bottom pipe
          ctx.fillRect(p.x, canvas.height - p.bottom, 50, p.bottom);
          ctx.shadowBlur = 0;
        });

        // Draw Bird
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(birdX, birdY, birdR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(birdX + 5, birdY - 4, 4, 0, Math.PI * 2);
        ctx.fill();

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
    }

    // --- VARIANT 3: RETRO SNAKE ---
    else if (gameVariant === 'snake') {
      const gridSize = 20;
      let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      let dx = 1;
      let dy = 0;
      let food = { x: 15, y: 10 };
      let localScore = 0;
      let moveTimer = 0;

      const spawnFood = () => {
        food = {
          x: Math.floor(Math.random() * (canvas.width / gridSize)),
          y: Math.floor(Math.random() * (canvas.height / gridSize)),
        };
      };

      const loop = () => {
        const keys = engineRef.current.keys;
        if ((keys['ArrowUp'] || keys['w']) && dy === 0) { dx = 0; dy = -1; }
        if ((keys['ArrowDown'] || keys['s']) && dy === 0) { dx = 0; dy = 1; }
        if ((keys['ArrowLeft'] || keys['a']) && dx === 0) { dx = -1; dy = 0; }
        if ((keys['ArrowRight'] || keys['d']) && dx === 0) { dx = 1; dy = 0; }

        moveTimer++;
        if (moveTimer % 6 === 0) {
          const head = { x: snake[0].x + dx, y: snake[0].y + dy };

          // Wall collision
          const maxX = Math.floor(canvas.width / gridSize);
          const maxY = Math.floor(canvas.height / gridSize);
          if (head.x < 0 || head.x >= maxX || head.y < 0 || head.y >= maxY) {
            playSound('crash');
            setGameOver(true);
            updateHighScore(localScore);
            return;
          }

          // Self collision
          for (let i = 1; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
              playSound('crash');
              setGameOver(true);
              updateHighScore(localScore);
              return;
            }
          }

          snake.unshift(head);

          // Eat food
          if (head.x === food.x && head.y === food.y) {
            localScore += 10;
            setScore(localScore);
            playSound('score');
            spawnFood();
          } else {
            snake.pop();
          }
        }

        // Render Snake
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw food
        ctx.fillStyle = '#e11d48';
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = 10;
        ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);
        ctx.shadowBlur = 0;

        // Draw snake
        snake.forEach((seg, i) => {
          ctx.fillStyle = i === 0 ? '#38bdf8' : '#0284c7';
          ctx.fillRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2);
        });

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
    }

    // --- VARIANT 4: SPACE SHOOTER / GALAXY ---
    else if (gameVariant === 'shooter') {
      let playerX = canvas.width / 2;
      let bullets: { x: number; y: number }[] = [];
      let enemies: { x: number; y: number; speed: number; width: number }[] = [];
      let localScore = 0;
      let frameCount = 0;

      const loop = () => {
        frameCount++;
        const keys = engineRef.current.keys;

        if (keys['ArrowLeft'] || keys['a']) playerX -= 7;
        if (keys['ArrowRight'] || keys['d']) playerX += 7;

        playerX = Math.max(20, Math.min(canvas.width - 20, playerX));

        if (keys[' '] || keys['ArrowUp'] || keys['w']) {
          if (frameCount % 10 === 0) {
            bullets.push({ x: playerX, y: canvas.height - 40 });
            playSound('jump');
          }
        }

        // Spawn enemies
        if (frameCount % 45 === 0) {
          enemies.push({
            x: 30 + Math.random() * (canvas.width - 60),
            y: -30,
            speed: 2 + Math.random() * 2.5,
            width: 30,
          });
        }

        // Move bullets
        bullets.forEach((b) => (b.y -= 10));
        bullets = bullets.filter((b) => b.y > 0);

        // Move enemies
        enemies.forEach((e) => (e.y += e.speed));

        // Collisions
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          if (e.y > canvas.height - 40) {
            playSound('crash');
            setGameOver(true);
            updateHighScore(localScore);
            return;
          }

          for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (
              Math.abs(b.x - e.x) < 20 &&
              b.y > e.y && b.y < e.y + 30
            ) {
              enemies.splice(i, 1);
              bullets.splice(j, 1);
              localScore += 25;
              setScore(localScore);
              playSound('score');
              break;
            }
          }
        }

        // Render
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Player ship
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(playerX, canvas.height - 40);
        ctx.lineTo(playerX - 15, canvas.height - 15);
        ctx.lineTo(playerX + 15, canvas.height - 15);
        ctx.closePath();
        ctx.fill();

        // Bullets
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 10));

        // Enemies
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
        enemies.forEach((e) => ctx.fillRect(e.x - 15, e.y, 30, 20));
        ctx.shadowBlur = 0;

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
    }

    // --- VARIANT 5: BRICK BREAKER / OTHER ---
    else {
      let paddleX = canvas.width / 2 - 50;
      let ballX = canvas.width / 2;
      let ballY = canvas.height - 50;
      let dx = 4;
      let dy = -4;
      let localScore = 0;

      let bricks: { x: number; y: number; active: boolean; color: string }[] = [];
      const colors = ['#f43f5e', '#f59e0b', '#10b981', '#38bdf8', '#a855f7'];

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          bricks.push({
            x: 40 + c * (canvas.width - 80) / 8,
            y: 40 + r * 25,
            active: true,
            color: colors[r % colors.length],
          });
        }
      }

      const loop = () => {
        const keys = engineRef.current.keys;
        if (keys['ArrowLeft'] || keys['a']) paddleX -= 7;
        if (keys['ArrowRight'] || keys['d']) paddleX += 7;
        paddleX = Math.max(10, Math.min(canvas.width - 110, paddleX));

        ballX += dx;
        ballY += dy;

        // Wall collisions
        if (ballX < 10 || ballX > canvas.width - 10) { dx = -dx; playSound('hit'); }
        if (ballY < 10) { dy = -dy; playSound('hit'); }

        // Paddle collision
        if (ballY > canvas.height - 40 && ballX > paddleX && ballX < paddleX + 100) {
          dy = -Math.abs(dy);
          playSound('hit');
        }

        // Bottom loss
        if (ballY > canvas.height) {
          playSound('crash');
          setGameOver(true);
          updateHighScore(localScore);
          return;
        }

        // Brick collision
        bricks.forEach((b) => {
          if (b.active && ballX > b.x && ballX < b.x + 60 && ballY > b.y && ballY < b.y + 20) {
            b.active = false;
            dy = -dy;
            localScore += 50;
            setScore(localScore);
            playSound('score');
          }
        });

        // Render
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Bricks
        bricks.forEach((b) => {
          if (b.active) {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, (canvas.width - 100) / 8, 20);
          }
        });

        // Paddle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(paddleX, canvas.height - 30, 100, 12);

        // Ball
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
        ctx.fill();

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameStarted, isPaused, gameVariant]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 rounded-2xl overflow-hidden select-none">
      
      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-200 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-rose-400">
            <Zap className="w-4 h-4 fill-current" />
            Score: {score}
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4 fill-current" />
            Best: {highScore}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {gameStarted && !gameOver && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-slate-300" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Canvas */}
      <canvas
        ref={canvasRef}
        width={700}
        height={420}
        className="w-full h-full max-h-[70vh] object-contain bg-slate-950"
      />

      {/* Start Screen Overlay */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/30 text-rose-500 flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{game.title}</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">{game.description}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 max-w-sm">
            💡 {game.controls}
          </div>
          <button
            onClick={handleStartGame}
            className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-2 transform hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>PLAY GAME NOW</span>
          </button>
        </div>
      )}

      {/* Game Over Screen Overlay */}
      {gameOver && (
        <div className="absolute inset-0 z-30 bg-slate-950/92 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
          <div className="text-rose-500 text-3xl font-black tracking-widest uppercase font-mono">
            GAME OVER
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-300">Final Score: <span className="text-rose-400 font-mono text-lg">{score}</span></p>
            <p className="text-xs text-slate-400">High Score: <span className="text-amber-400 font-mono">{highScore}</span></p>
          </div>
          <button
            onClick={handleStartGame}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-rose-600/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      )}

      {/* Paused Overlay */}
      {isPaused && !gameOver && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
          <div className="text-amber-400 text-xl font-bold tracking-wider font-mono">GAME PAUSED</div>
          <button
            onClick={() => setIsPaused(false)}
            className="px-6 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl"
          >
            Resume
          </button>
        </div>
      )}

    </div>
  );
};
