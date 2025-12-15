import React, { useEffect, useRef } from 'react';
import { GameStatus, LevelTheme, Player, Obstacle, Particle } from '../types';

interface GameEngineProps {
  status: GameStatus;
  theme: LevelTheme;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ status, theme, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const scoreRef = useRef<number>(0);
  
  // Game State Refs (Mutable for performance)
  const playerRef = useRef<Player>({
    x: 50,
    y: 0, // Will be set on resize
    width: 40,
    height: 40,
    color: theme.playerColor,
    dy: 0,
    isJumping: false
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef<number>(0);
  const speedMultiplierRef = useRef<number>(1);
  const groundYRef = useRef<number>(0);

  // Initialize or Reset Game
  const resetGame = (canvas: HTMLCanvasElement) => {
    groundYRef.current = canvas.height - 100;
    playerRef.current = {
      x: canvas.width * 0.1, // 10% from left
      y: groundYRef.current - 40,
      width: 40,
      height: 40,
      color: theme.playerColor,
      dy: 0,
      isJumping: false
    };
    obstaclesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    frameCountRef.current = 0;
    speedMultiplierRef.current = 1;
    onScoreUpdate(0);
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const spawnObstacle = (canvas: HTMLCanvasElement) => {
    const minHeight = 40;
    const maxHeight = 100;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    obstaclesRef.current.push({
      x: canvas.width,
      y: groundYRef.current - height,
      width: 30 + Math.random() * 20,
      height: height,
      color: theme.obstacleColor,
      speed: theme.speed * speedMultiplierRef.current,
      passed: false
    });
  };

  const update = (canvas: HTMLCanvasElement) => {
    if (status !== GameStatus.PLAYING) return;

    frameCountRef.current++;
    scoreRef.current++;
    
    // Increase difficulty slowly
    if (frameCountRef.current % 600 === 0) {
      speedMultiplierRef.current += 0.1;
    }

    // Update Score in UI rarely to save renders
    if (frameCountRef.current % 10 === 0) {
      onScoreUpdate(Math.floor(scoreRef.current / 10));
    }

    // Player Physics
    const player = playerRef.current;
    player.dy += theme.gravity;
    player.y += player.dy;

    // Ground Collision
    if (player.y + player.height > groundYRef.current) {
      player.y = groundYRef.current - player.height;
      player.dy = 0;
      player.isJumping = false;
    }

    // Obstacle Logic
    // Spawn Logic: Random interval but ensures gap is jumpable
    if (frameCountRef.current % Math.floor(100 / speedMultiplierRef.current) === 0) {
       if (Math.random() > 0.3) spawnObstacle(canvas);
    }

    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      obs.x -= theme.speed * speedMultiplierRef.current;

      // Collision Detection (AABB)
      if (
        player.x < obs.x + obs.width &&
        player.x + player.width > obs.x &&
        player.y < obs.y + obs.height &&
        player.y + player.height > obs.y
      ) {
        // BOOM
        createParticles(player.x + player.width/2, player.y + player.height/2, theme.playerColor, 20);
        onGameOver(Math.floor(scoreRef.current / 10));
        return; 
      }

      // Remove off-screen obstacles
      if (obs.x + obs.width < 0) {
        obstaclesRef.current.splice(i, 1);
      }
    }

    // Particles Logic
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Clear
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Sky/Sun Accent
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, theme.skyColor);
    gradient.addColorStop(1, theme.backgroundColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Ground
    ctx.fillStyle = theme.groundColor;
    ctx.fillRect(0, groundYRef.current, canvas.width, canvas.height - groundYRef.current);
    
    // Draw Speed Lines on ground
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    const speedLineOffset = (frameCountRef.current * theme.speed * speedMultiplierRef.current) % 100;
    for(let i = 0; i < canvas.width; i+= 100) {
        ctx.beginPath();
        ctx.moveTo(i - speedLineOffset, groundYRef.current);
        ctx.lineTo(i - 50 - speedLineOffset, canvas.height);
        ctx.stroke();
    }


    // Draw Player
    const p = playerRef.current;
    ctx.fillStyle = theme.playerColor;
    ctx.shadowBlur = 20;
    ctx.shadowColor = theme.playerColor;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.shadowBlur = 0;
    
    // Player Eyes (Cute factor)
    ctx.fillStyle = "white";
    ctx.fillRect(p.x + 25, p.y + 10, 8, 8);
    ctx.fillStyle = "black";
    ctx.fillRect(p.x + 29, p.y + 12, 4, 4);


    // Draw Obstacles
    ctx.fillStyle = theme.obstacleColor;
    for (const obs of obstaclesRef.current) {
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      // Detail on obstacle
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
      ctx.fillStyle = theme.obstacleColor;
    }

    // Draw Particles
    for (const p of particlesRef.current) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const handleInput = () => {
    if (status === GameStatus.PLAYING && !playerRef.current.isJumping) {
      playerRef.current.dy = -theme.jumpStrength;
      playerRef.current.isJumping = true;
      // Jump Particles
      createParticles(playerRef.current.x + 20, playerRef.current.y + 40, "#ffffff", 5);
    }
  };

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleInput();
      }
    };
    const handleTouch = () => handleInput();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch);
    window.addEventListener('mousedown', handleTouch);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('mousedown', handleTouch);
    };
  }, [status, theme]); // Re-bind if physics change significantly, though mostly stable

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (status === GameStatus.MENU || status === GameStatus.LOADING) {
         // Reset ground ref on resize if not playing
         groundYRef.current = canvas.height - 100;
      }
    };
    window.addEventListener('resize', resize);
    resize();
    
    // Initial setup if just starting
    if (status === GameStatus.PLAYING && frameCountRef.current === 0) {
        resetGame(canvas);
    }

    const tick = () => {
      update(canvas);
      draw(ctx, canvas);
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, theme]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default GameEngine;