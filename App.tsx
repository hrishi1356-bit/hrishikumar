import React, { useState } from 'react';
import GameEngine from './components/GameEngine';
import { generateLevelTheme } from './services/geminiService';
import { GameStatus, LevelTheme } from './types';
import { Play, RotateCcw, Zap, Terminal, Loader2, Trophy } from 'lucide-react';

// Default initial theme
const DEFAULT_THEME: LevelTheme = {
  name: "Neon City",
  description: "A classic high-speed chase through a digital frontier.",
  backgroundColor: "#0f172a",
  groundColor: "#1e293b",
  playerColor: "#38bdf8",
  obstacleColor: "#f472b6",
  skyColor: "#312e81",
  gravity: 0.6,
  speed: 8,
  jumpStrength: 15
};

function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [theme, setTheme] = useState<LevelTheme>(DEFAULT_THEME);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startGame = () => {
    setScore(0);
    setStatus(GameStatus.PLAYING);
  };

  const handleGenerateAndStart = async () => {
    if (!prompt.trim()) {
      startGame();
      return;
    }

    setIsLoading(true);
    setStatus(GameStatus.LOADING);
    
    const newTheme = await generateLevelTheme(prompt);
    setTheme(newTheme);
    setIsLoading(false);
    startGame();
  };

  const handleGameOver = (finalScore: number) => {
    setStatus(GameStatus.GAME_OVER);
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      
      {/* Game Layer */}
      <div className="absolute inset-0 z-0">
        <GameEngine 
          status={status} 
          theme={theme} 
          onGameOver={handleGameOver}
          onScoreUpdate={setScore}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header HUD */}
        <div className="flex justify-between items-start">
          <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-lg transform transition-all hover:scale-105 pointer-events-auto">
            <h1 className="text-sm font-bold opacity-70 uppercase tracking-widest">{theme.name}</h1>
            <div className="text-4xl font-arcade mt-1 text-yellow-400">{score.toString().padStart(5, '0')}</div>
          </div>
          
          {highScore > 0 && (
             <div className="bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                    <div className="text-xs opacity-60 uppercase">High Score</div>
                    <div className="font-arcade text-lg">{highScore}</div>
                </div>
             </div>
          )}
        </div>

        {/* Start / Menu Screen */}
        {status === GameStatus.MENU && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto animate-fade-in">
            <div className="max-w-md w-full p-8 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2 font-arcade tracking-tighter">
                  RUNNER AI
                </h1>
                <p className="text-gray-400">Generate your own world and run forever.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Level Theme Prompt
                  </label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. 'Mars Base', 'Candyland', 'Cyberpunk'"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAndStart()}
                  />
                </div>

                <button
                  onClick={handleGenerateAndStart}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transform transition-all active:scale-95 group"
                >
                  <Zap className="w-5 h-5 group-hover:animate-pulse" />
                  GENERATE & RUN
                </button>
                
                <div className="text-center text-xs text-gray-600 mt-4">
                  Powered by Google Gemini 2.5 Flash
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Screen */}
        {status === GameStatus.LOADING && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 pointer-events-auto z-50">
             <div className="text-center">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Generating World...</h2>
                <p className="text-gray-400 max-w-xs mx-auto">AI is calculating physics, painting the sky, and placing obstacles for "{prompt}"</p>
             </div>
          </div>
        )}

        {/* Game Over Screen */}
        {status === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
             <div className="text-center p-8 bg-gray-900/90 rounded-2xl border border-red-500/30 shadow-2xl max-w-sm w-full">
                <h2 className="text-3xl font-arcade text-red-500 mb-2">GAME OVER</h2>
                <div className="text-white text-lg mb-6">
                    Score: <span className="font-bold text-yellow-400">{score}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={startGame}
                        className="bg-white text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Retry
                    </button>
                    <button 
                        onClick={() => setStatus(GameStatus.MENU)}
                        className="bg-gray-800 text-white border border-gray-600 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                    >
                        New Theme
                    </button>
                </div>
             </div>
          </div>
        )}

        {/* Mobile Controls Hint (Only visible when playing) */}
        {status === GameStatus.PLAYING && (
          <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none opacity-50 text-white text-sm animate-pulse">
            Tap Screen or Press Space to Jump
          </div>
        )}

      </div>
    </div>
  );
}

export default App;