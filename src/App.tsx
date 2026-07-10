import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GameState, Difficulty, Level, Difference } from './types';
import { generateLevel, getDifficultyConfig } from './utils/patternGenerator';
import GameCanvas from './components/GameCanvas';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timerMode, setTimerMode] = useState(true);
  const [, setSeed] = useState(Date.now());
  const [level, setLevel] = useState<Level | null>(null);
  const [foundDiffs, setFoundDiffs] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [showWrong, setShowWrong] = useState<{ x: number; y: number; side: string } | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showHint, setShowHint] = useState<Difference | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canvasSize = useMemo(() => {
    if (typeof window === 'undefined') return 350;
    const w = window.innerWidth;
    if (w < 640) return Math.min(w - 40, 300);
    if (w < 1024) return Math.min((w - 80) / 2, 350);
    return 400;
  }, []);

  const config = useMemo(() => getDifficultyConfig(difficulty), [difficulty]);

  // Start game
  const startGame = useCallback(() => {
    const newSeed = Date.now();
    setSeed(newSeed);
    const newLevel = generateLevel(newSeed, difficulty);
    setLevel(newLevel);
    setFoundDiffs(new Set());
    setTimeLeft(config.timeLimit);
    setElapsed(0);
    setWrongClicks(0);
    setHintUsed(false);
    setHintsRemaining(3);
    setShowHint(null);
    setShowWrong(null);
    setGameState('playing');
  }, [difficulty, config]);

  const nextRound = useCallback(() => {
    const newSeed = Date.now() + round;
    setSeed(newSeed);
    const newLevel = generateLevel(newSeed, difficulty);
    setLevel(newLevel);
    setFoundDiffs(new Set());
    setTimeLeft(config.timeLimit);
    setElapsed(0);
    setWrongClicks(0);
    setHintUsed(false);
    setShowHint(null);
    setShowWrong(null);
    setRound((r) => r + 1);
    setGameState('playing');
  }, [difficulty, config, round]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
      if (timerMode) {
        setTimeLeft((t) => {
          if (t <= 1) {
            setGameState('lost');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timerMode]);

  // Check win
  useEffect(() => {
    if (level && foundDiffs.size === level.totalDifferences && gameState === 'playing') {
      const timeBonus = timerMode ? timeLeft * 10 : Math.max(0, 300 - elapsed * 2);
      const wrongPenalty = wrongClicks * 25;
      const hintPenalty = hintUsed ? 50 : 0;
      const roundScore = Math.max(0, level.totalDifferences * 100 + timeBonus - wrongPenalty - hintPenalty);
      setScore((s) => s + roundScore);
      setGameState('won');
    }
  }, [foundDiffs, level, gameState, timeLeft, elapsed, wrongClicks, hintUsed, timerMode]);

  // Handle click on canvas
  const handleCanvasClick = useCallback(
    (x: number, y: number, side: string) => {
      if (!level || gameState !== 'playing') return;

      // Check if click is near a difference
      let hit = false;
      for (const diff of level.differences) {
        if (diff.found) continue;
        const dist = Math.sqrt((x - diff.x) ** 2 + (y - diff.y) ** 2);
        if (dist < diff.radius * 1.2) {
          // Found a difference!
          const newFound = new Set(foundDiffs);
          newFound.add(diff.id);
          setFoundDiffs(newFound);

          // Mark as found in level
          diff.found = true;
          setLevel({ ...level });
          hit = true;
          break;
        }
      }

      if (!hit) {
        setWrongClicks((w) => w + 1);
        setShowWrong({ x, y, side });
        setTimeout(() => setShowWrong(null), 600);
      }
    },
    [level, gameState, foundDiffs]
  );

  // Hint
  const useHint = useCallback(() => {
    if (!level || hintsRemaining <= 0 || gameState !== 'playing') return;
    const unfound = level.differences.filter((d) => !d.found);
    if (unfound.length === 0) return;
    const hint = unfound[Math.floor(Math.random() * unfound.length)];
    setShowHint(hint);
    setHintUsed(true);
    setHintsRemaining((h) => h - 1);
    setTimeout(() => setShowHint(null), 2000);
  }, [level, hintsRemaining, gameState]);

  // Restart
  const goToMenu = useCallback(() => {
    setGameState('menu');
    setScore(0);
    setRound(1);
    setHintsRemaining(3);
  }, []);

  // ─── MENU ───
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Floating shapes decoration */}
          <div className="relative">
            <div className="absolute -top-20 -left-10 w-24 h-24 bg-violet-500/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute -top-10 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-10 left-1/2 w-28 h-28 bg-pink-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                Spot the Difference
              </h1>
              <p className="text-slate-400 mt-2">
                Find the hidden differences between two patterns
              </p>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-3 block">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all capitalize
                      ${difficulty === d
                        ? d === 'easy'
                          ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : d === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/50 shadow-lg shadow-amber-500/10'
                          : 'bg-red-500/20 text-red-300 border-2 border-red-500/50 shadow-lg shadow-red-500/10'
                        : 'bg-white/5 text-slate-400 border-2 border-white/10 hover:bg-white/10'
                      }`}
                  >
                    {d === 'easy' && '🟢 '}
                    {d === 'medium' && '🟡 '}
                    {d === 'hard' && '🔴 '}
                    {d}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-500 text-center">
                {config.numDifferences} differences · {config.numShapes} shapes · {config.timeLimit}s timer
              </div>
            </div>

            {/* Timer Mode */}
            <div className="mb-8">
              <div
                onClick={() => setTimerMode(!timerMode)}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⏱️</span>
                  <div>
                    <div className="text-sm font-medium text-slate-300">Timer Mode</div>
                    <div className="text-xs text-slate-500">
                      {timerMode ? `${config.timeLimit} seconds to find all` : 'Play at your own pace'}
                    </div>
                  </div>
                </div>
                <div
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    timerMode ? 'bg-violet-500' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      timerMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
            >
              Start Game 🎮
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── WON / LOST ───
  if (gameState === 'won' || gameState === 'lost') {
    const isWin = gameState === 'won';
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl text-center">
            <div className="text-6xl mb-4">{isWin ? '🎉' : '⏰'}</div>
            <h2 className={`text-3xl font-bold mb-2 ${isWin ? 'text-emerald-300' : 'text-red-300'}`}>
              {isWin ? 'Great Job!' : 'Time\'s Up!'}
            </h2>
            <p className="text-slate-400 mb-6">
              {isWin
                ? `You found all ${level?.totalDifferences} differences!`
                : `You found ${foundDiffs.size} of ${level?.totalDifferences} differences.`}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-2xl font-bold text-violet-300">{score}</div>
                <div className="text-xs text-slate-500">Score</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-2xl font-bold text-amber-300">{round}</div>
                <div className="text-xs text-slate-500">Round</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-2xl font-bold text-cyan-300">{formatTime(elapsed)}</div>
                <div className="text-xs text-slate-500">Time</div>
              </div>
            </div>

            <div className="flex gap-3">
              {isWin && (
                <button
                  onClick={nextRound}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg hover:from-violet-500 hover:to-indigo-500 transition-all"
                >
                  Next Round →
                </button>
              )}
              <button
                onClick={goToMenu}
                className={`${isWin ? 'flex-1' : 'w-full'} py-3 rounded-xl bg-white/10 text-slate-300 font-bold border border-white/10 hover:bg-white/15 transition-all`}
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING ───
  if (!level) return null;

  const progressPercent = (foundDiffs.size / level.totalDifferences) * 100;
  const timePercent = timerMode ? (timeLeft / config.timeLimit) * 100 : 100;
  const timeWarning = timerMode && timeLeft <= 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Spot the Difference</h1>
              <p className="text-xs text-slate-400">Round {round} · {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Hint button */}
            <button
              onClick={useHint}
              disabled={hintsRemaining <= 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 text-sm font-medium border border-amber-500/20 hover:bg-amber-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              💡 Hint ({hintsRemaining})
            </button>

            {/* Score */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/15 border border-violet-500/20">
              <span className="text-violet-300 text-sm font-bold">{score}</span>
              <span className="text-xs text-slate-500">pts</span>
            </div>

            {/* Menu */}
            <button
              onClick={goToMenu}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition border border-white/10"
              title="Back to menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white/[0.02] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 flex-wrap justify-center">
          {/* Differences Counter */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Differences:</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-400">{foundDiffs.size}</span>
              <span className="text-slate-500">/</span>
              <span className="text-lg font-bold text-slate-300">{level.totalDifferences}</span>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Timer / Elapsed */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{timerMode ? 'Time Left:' : 'Elapsed:'}</span>
            <span className={`text-lg font-mono font-bold ${timeWarning ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
              {timerMode ? formatTime(timeLeft) : formatTime(elapsed)}
            </span>
            {timerMode && (
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    timeWarning ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                  }`}
                  style={{ width: `${timePercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Wrong Clicks */}
          {wrongClicks > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Misses:</span>
              <span className="text-lg font-bold text-red-400">{wrongClicks}</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Left Canvas - Original */}
          <div className="relative">
            <GameCanvas
              shapes={level.shapes}
              differences={level.differences}
              foundDifferences={foundDiffs}
              onClickCanvas={(x, y) => handleCanvasClick(x, y, 'left')}
              label="Original"
              canvasSize={canvasSize}
              isRight={false}
            />
            {/* Wrong click indicator */}
            {showWrong && showWrong.side === 'left' && (
              <div
                className="absolute pointer-events-none animate-ping"
                style={{
                  left: (showWrong.x / 500) * canvasSize - 12,
                  top: (showWrong.y / 500) * canvasSize - 12 + 28,
                  width: 24,
                  height: 24,
                }}
              >
                <span className="text-red-500 text-xl">✕</span>
              </div>
            )}
            {/* Hint indicator */}
            {showHint && (
              <div
                className="absolute pointer-events-none animate-bounce"
                style={{
                  left: (showHint.x / 500) * canvasSize - 16,
                  top: (showHint.y / 500) * canvasSize - 16 + 28,
                  width: 32,
                  height: 32,
                }}
              >
                <div className="w-8 h-8 rounded-full border-4 border-amber-400 bg-amber-400/20 animate-pulse" />
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="hidden sm:flex flex-col items-center gap-2">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-violet-500/50 to-transparent" />
            <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full border border-violet-500/20">
              VS
            </span>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-violet-500/50 to-transparent" />
          </div>

          {/* Right Canvas - Modified */}
          <div className="relative">
            <GameCanvas
              shapes={level.modifiedShapes}
              differences={level.differences}
              foundDifferences={foundDiffs}
              onClickCanvas={(x, y) => handleCanvasClick(x, y, 'right')}
              label="Modified"
              canvasSize={canvasSize}
              isRight={true}
            />
            {/* Wrong click indicator */}
            {showWrong && showWrong.side === 'right' && (
              <div
                className="absolute pointer-events-none animate-ping"
                style={{
                  left: (showWrong.x / 500) * canvasSize - 12,
                  top: (showWrong.y / 500) * canvasSize - 12 + 28,
                  width: 24,
                  height: 24,
                }}
              >
                <span className="text-red-500 text-xl">✕</span>
              </div>
            )}
            {/* Hint indicator */}
            {showHint && (
              <div
                className="absolute pointer-events-none animate-bounce"
                style={{
                  left: (showHint.x / 500) * canvasSize - 16,
                  top: (showHint.y / 500) * canvasSize - 16 + 28,
                  width: 32,
                  height: 32,
                }}
              >
                <div className="w-8 h-8 rounded-full border-4 border-amber-400 bg-amber-400/20 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Instructions */}
      <div className="bg-white/[0.02] border-t border-white/5 py-2 text-center">
        <p className="text-xs text-slate-500">
          Click on either image where you spot a difference · Shapes may differ in color, type, size, or rotation
        </p>
      </div>
    </div>
  );
}
