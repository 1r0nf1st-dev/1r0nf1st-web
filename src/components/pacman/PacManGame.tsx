'use client';

import type { JSX } from 'react';
import { useRef, useEffect, useCallback } from 'react';

const CELL_SIZE = 20;
const COLS = 19;
const ROWS = 21;

// 0=empty, 1=wall, 2=dot, 3=power pellet
const MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1],
  [1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 2, 1, 2, 0, 0, 0, 0, 0, 2, 1, 2, 1, 1, 1],
  [0, 0, 0, 0, 1, 2, 1, 2, 0, 1, 1, 1, 0, 2, 1, 2, 1, 0, 0],
  [1, 1, 1, 1, 1, 2, 1, 2, 0, 1, 0, 0, 0, 2, 1, 2, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 0, 1, 0, 0, 0, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 2, 1, 2, 0, 0, 0, 0, 0, 2, 1, 2, 1, 1, 1],
  [0, 0, 0, 0, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 0, 0],
  [1, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 1],
  [1, 3, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1],
  [1, 2, 1, 2, 2, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

type Direction = 'up' | 'down' | 'left' | 'right';

interface Pos {
  x: number;
  y: number;
}

function cloneMaze(m: number[][]): number[][] {
  return m.map((row) => [...row]);
}

function getStartPos(): Pos {
  return { x: 9, y: 19 };
}

function getGhostStarts(): Pos[] {
  return [
    { x: 9, y: 9 },
    { x: 8, y: 9 },
    { x: 10, y: 9 },
    { x: 9, y: 8 },
  ];
}

function canMove(maze: number[][], x: number, y: number): boolean {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
  return maze[Math.floor(y)][Math.floor(x)] !== 1;
}

function getNeighbors(maze: number[][], pos: Pos): Pos[] {
  const d: Pos[] = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];
  const out: Pos[] = [];
  for (const dd of d) {
    const nx = pos.x + dd.x;
    const ny = pos.y + dd.y;
    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && canMove(maze, nx, ny)) {
      out.push({ x: nx, y: ny });
    }
  }
  return out;
}

function dist(a: Pos, b: Pos): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export const PacManGame = (): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameState = useRef({
    maze: cloneMaze(MAZE),
    pacman: getStartPos(),
    pacDir: 'right' as Direction,
    pacAnim: 0,
    ghosts: getGhostStarts().map((p) => ({ ...p, dir: 'left' as Direction })),
    score: 0,
    lives: 3,
    frightened: 0,
    dotsLeft: 0,
    gameOver: false,
    won: false,
    nextDir: null as Direction | null,
  });

  const keys = useRef<Set<string>>(new Set());
  const lastTime = useRef(0);

  const resetGame = useCallback(() => {
    gameState.current = {
      maze: cloneMaze(MAZE),
      pacman: getStartPos(),
      pacDir: 'right',
      pacAnim: 0,
      ghosts: getGhostStarts().map((p) => ({ ...p, dir: 'left' as Direction })),
      score: 0,
      lives: 3,
      frightened: 0,
      dotsLeft: gameState.current.dotsLeft || MAZE.flat().filter((c) => c === 2 || c === 3).length,
      gameOver: false,
      won: false,
      nextDir: null,
    };
    let count = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (MAZE[r][c] === 2 || MAZE[r][c] === 3) count++;
    gameState.current.dotsLeft = count;
  }, []);

  useEffect(() => {
    let count = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (MAZE[r][c] === 2 || MAZE[r][c] === 3) count++;
    gameState.current.dotsLeft = count;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => containerRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const focused = container && document.activeElement === container;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        if (!focused) return;
        e.preventDefault();
        keys.current.add(e.code);
      }
      if (e.code === 'KeyR' || e.code === 'Space') {
        if (gameState.current.gameOver || gameState.current.won) {
          e.preventDefault();
          resetGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      keys.current.delete(e.code);
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keyup', handleKeyUp, { capture: true });

    let rafId: number;
    const loop = (t: number): void => {
      rafId = requestAnimationFrame(loop);
      const dt = Math.min((t - lastTime.current) / 1000, 0.1);
      lastTime.current = t;
      const g = gameState.current;

      if (g.gameOver || g.won) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(g.won ? 'YOU WIN!' : 'GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '18px monospace';
        ctx.fillText(`Score: ${g.score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Press R or Space to restart', canvas.width / 2, canvas.height / 2 + 55);
        return;
      }

      // Input
      if (keys.current.has('ArrowRight') || keys.current.has('KeyD')) g.nextDir = 'right';
      else if (keys.current.has('ArrowLeft') || keys.current.has('KeyA')) g.nextDir = 'left';
      else if (keys.current.has('ArrowUp') || keys.current.has('KeyW')) g.nextDir = 'up';
      else if (keys.current.has('ArrowDown') || keys.current.has('KeyS')) g.nextDir = 'down';

      // Update frightened
      if (g.frightened > 0) g.frightened -= dt;

      // Move pacman
      const pacCellX = Math.round(g.pacman.x);
      const pacCellY = Math.round(g.pacman.y);

      if (g.nextDir) {
        const check: Record<Direction, [number, number]> = {
          right: [1, 0],
          left: [-1, 0],
          up: [0, -1],
          down: [0, 1],
        };
        const [dx, dy] = check[g.nextDir];
        const nx = pacCellX + dx;
        const ny = pacCellY + dy;
        if (canMove(g.maze, nx, ny)) g.pacDir = g.nextDir;
      }

      const speed = 3.5;
      const move: Record<Direction, [number, number]> = {
        right: [speed * dt, 0],
        left: [-speed * dt, 0],
        up: [0, -speed * dt],
        down: [0, speed * dt],
      };
      const [mx, my] = move[g.pacDir];
      const npx = g.pacman.x + mx;
      const npy = g.pacman.y + my;
      const ncx = Math.round(npx);
      const ncy = Math.round(npy);
      if (canMove(g.maze, ncx, ncy)) {
        g.pacman.x = npx;
        g.pacman.y = npy;
      }

      // Wrap tunnel
      if (g.pacman.y >= 10 && g.pacman.y <= 11) {
        if (g.pacman.x < -0.5) g.pacman.x = COLS - 0.5;
        if (g.pacman.x > COLS - 0.5) g.pacman.x = -0.5;
      }

      // Eat dot
      const cell = g.maze[Math.round(g.pacman.y)]?.[Math.round(g.pacman.x)];
      if (cell === 2) {
        g.maze[Math.round(g.pacman.y)][Math.round(g.pacman.x)] = 0;
        g.score += 10;
        g.dotsLeft--;
      } else if (cell === 3) {
        g.maze[Math.round(g.pacman.y)][Math.round(g.pacman.x)] = 0;
        g.score += 50;
        g.dotsLeft--;
        g.frightened = 8;
      }

      if (g.dotsLeft <= 0) g.won = true;

      // Move ghosts
      const ghostColors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];
      for (let i = 0; i < g.ghosts.length; i++) {
        const gh = g.ghosts[i];
        const ghCellX = Math.round(gh.x);
        const ghCellY = Math.round(gh.y);

        let target: Pos;
        if (g.frightened > 0) {
          target = { x: 0, y: 0 };
        } else {
          target = { ...g.pacman };
        }

        const neighbors = getNeighbors(g.maze, { x: ghCellX, y: ghCellY });
        let best = neighbors[0];
        let bestDist = Infinity;
        for (const n of neighbors) {
          const d = g.frightened > 0 ? -dist(n, target) : dist(n, target);
          if (d < bestDist) {
            bestDist = d;
            best = n;
          }
        }
        if (best) {
          gh.dir =
            best.x > ghCellX ? 'right' : best.x < ghCellX ? 'left' : best.y < ghCellY ? 'up' : 'down';
          const [gmx, gmy] = move[gh.dir];
          const gspeed = g.frightened > 0 ? 1.5 : 2.2;
          gh.x += gmx * (gspeed / speed);
          gh.y += gmy * (gspeed / speed);
        }
      }

      // Ghost collision
      for (let gi = 0; gi < g.ghosts.length; gi++) {
        const gh = g.ghosts[gi];
        if (Math.hypot(g.pacman.x - gh.x, g.pacman.y - gh.y) < 0.8) {
          if (g.frightened > 0) {
            const start = getGhostStarts()[gi];
            gh.x = start.x;
            gh.y = start.y;
            g.score += 200;
          } else {
            g.lives--;
            if (g.lives <= 0) g.gameOver = true;
            else {
              g.pacman = getStartPos();
              g.pacDir = 'right';
              g.ghosts = getGhostStarts().map((p) => ({ ...p, dir: 'left' as Direction }));
            }
          }
        }
      }

      g.pacAnim = (g.pacAnim + dt * 8) % (2 * Math.PI);

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const scale = Math.min(w / (COLS * CELL_SIZE), h / (ROWS * CELL_SIZE));
      ctx.save();
      ctx.translate((w - COLS * CELL_SIZE * scale) / 2, (h - ROWS * CELL_SIZE * scale) / 2);
      ctx.scale(scale, scale);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const v = g.maze[r][c];
          if (v === 1) {
            ctx.fillStyle = '#2121de';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          } else if (v === 2) {
            ctx.fillStyle = '#ffb897';
            ctx.beginPath();
            ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 3, 0, 2 * Math.PI);
            ctx.fill();
          } else if (v === 3) {
            ctx.fillStyle = '#ffb897';
            ctx.beginPath();
            ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }

      // Pac-Man
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      const mouth = 0.3 * Math.sin(g.pacAnim) + 0.4;
      ctx.moveTo(
        g.pacman.x * CELL_SIZE + CELL_SIZE / 2,
        g.pacman.y * CELL_SIZE + CELL_SIZE / 2
      );
      const start =
        g.pacDir === 'right' ? mouth * Math.PI : g.pacDir === 'left' ? Math.PI + mouth * Math.PI : g.pacDir === 'up' ? (3 * Math.PI) / 2 + mouth * Math.PI : Math.PI / 2 + mouth * Math.PI;
      ctx.arc(
        g.pacman.x * CELL_SIZE + CELL_SIZE / 2,
        g.pacman.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 1,
        start,
        start + (2 * Math.PI - mouth * Math.PI)
      );
      ctx.closePath();
      ctx.fill();

      // Ghosts
      for (let i = 0; i < g.ghosts.length; i++) {
        const gh = g.ghosts[i];
        ctx.fillStyle = g.frightened > 0 ? '#2121de' : ghostColors[i];
        ctx.beginPath();
        ctx.arc(gh.x * CELL_SIZE + CELL_SIZE / 2, gh.y * CELL_SIZE + CELL_SIZE / 2 - 2, CELL_SIZE / 2 - 2, Math.PI, 0);
        ctx.lineTo(gh.x * CELL_SIZE + CELL_SIZE / 2 + CELL_SIZE / 2 - 2, gh.y * CELL_SIZE + CELL_SIZE / 2 + 2);
        ctx.lineTo(gh.x * CELL_SIZE + CELL_SIZE / 2, gh.y * CELL_SIZE + CELL_SIZE / 2);
        ctx.lineTo(gh.x * CELL_SIZE + CELL_SIZE / 2 - (CELL_SIZE / 2 - 2), gh.y * CELL_SIZE + CELL_SIZE / 2 + 2);
        ctx.closePath();
        ctx.fill();
        if (g.frightened > 0) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(gh.x * CELL_SIZE + 4, gh.y * CELL_SIZE + 2, 4, 4);
          ctx.fillRect(gh.x * CELL_SIZE + 12, gh.y * CELL_SIZE + 2, 4, 4);
        }
      }

      ctx.restore();

      // HUD
      ctx.fillStyle = '#fff';
      ctx.font = '18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${g.score}  Lives: ${'●'.repeat(g.lives)}`, 10, 25);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [resetGame]);

  const w = COLS * CELL_SIZE;
  const h = ROWS * CELL_SIZE;

  const handleContainerClick = (): void => {
    containerRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Click the game, then use Arrow keys or WASD to move · R or Space to restart
      </p>
      <div
        ref={containerRef}
        role="button"
        tabIndex={0}
        onClick={handleContainerClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            containerRef.current?.focus();
          }
        }}
        className="cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background w-fit"
        aria-label="Click to focus game"
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={480}
          className="border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-black max-w-full block"
          aria-label="Pac-Man game"
          data-testid="pacman-canvas"
        />
      </div>
    </div>
  );
};
