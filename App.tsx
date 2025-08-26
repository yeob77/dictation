import React, { useState, useCallback } from 'react';
import ParentSetup from './components/ParentSetup';
import DictationView from './components/DictationView';
import ResultsView from './components/ResultsView';
import { AppState, Dictation } from './types';
import { PencilBookIcon } from './components/icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [dictations, setDictations] = useState<Dictation[]>([]);
  const [originalDictations, setOriginalDictations] = useState<Dictation[] | null>(null);
  const [isPracticeSession, setIsPracticeSession] = useState(false);
  const [text, setText] = useState<string>(''); // State for setup text lifted up

  const handleStartDictation = (shuffle: boolean) => {
    let words = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
    
    if (shuffle) {
      // Fisher-Yates shuffle algorithm
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
    }

    const initialDictations = words.map(word => ({
      originalWord: word,
      handwrittenImage: '',
      isCorrect: null,
    }));
    
    setDictations(initialDictations);
    setOriginalDictations(initialDictations);
    setIsPracticeSession(false);
    setAppState(AppState.DICTATION);
  };

  const handleFinishDictation = (finalDictations: Dictation[]) => {
    setDictations(finalDictations);
    setAppState(AppState.RESULTS);
  };

  const handleRestart = () => {
    setDictations([]);
    setOriginalDictations(null);
    setIsPracticeSession(false);
    setText(''); // Clear text for a new session
    setAppState(AppState.SETUP);
  };

  const handleRetry = () => {
    const resetDictations = dictations.map(d => ({
      ...d,
      handwrittenImage: '',
      isCorrect: null,
    }));
    setDictations(resetDictations);
    setIsPracticeSession(false); // Retrying is a new, normal session
    setAppState(AppState.DICTATION);
  };

  const handleRetryOriginal = () => {
    if (!originalDictations) return;
    const resetDictations = originalDictations.map(d => ({
      ...d,
      handwrittenImage: '',
      isCorrect: null,
    }));
    setDictations(resetDictations);
    setIsPracticeSession(false);
    setAppState(AppState.DICTATION);
  };

  const handlePracticeMistakes = () => {
    let mistakenWords = dictations
      .filter(d => d.isCorrect === false)
      .map(d => d.originalWord);
    
    // Shuffle the mistaken words for more effective practice
    for (let i = mistakenWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mistakenWords[i], mistakenWords[j]] = [mistakenWords[j], mistakenWords[i]];
    }

    const mistakeDictations = mistakenWords.map(word => ({
      originalWord: word,
      handwrittenImage: '',
      isCorrect: null,
    }));

    setDictations(mistakeDictations);
    setIsPracticeSession(true); // Mark this as a practice session
    setAppState(AppState.DICTATION);
  };

  const handleBackToSetup = () => {
    setAppState(AppState.SETUP);
  };
  
  const renderContent = () => {
    switch (appState) {
      case AppState.SETUP:
        return <ParentSetup text={text} onTextChange={setText} onStart={handleStartDictation} />;
      case AppState.DICTATION:
        return (
          <DictationView
            dictations={dictations}
            onFinish={handleFinishDictation}
            onBack={handleBackToSetup}
          />
        );
      case AppState.RESULTS:
        return (
          <ResultsView 
            dictations={dictations} 
            onUpdate={setDictations} 
            onRestart={handleRestart} 
            onRetry={handleRetry} 
            onPracticeMistakes={handlePracticeMistakes}
            onRetryOriginal={handleRetryOriginal}
            isPracticeSession={isPracticeSession}
          />
        );
      default:
        return <ParentSetup text={text} onTextChange={setText} onStart={handleStartDictation} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6">
       <main className="w-full max-w-5xl mx-auto flex flex-col h-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-8 border border-white">
        <header className="text-center mb-4 md:mb-6 flex-shrink-0 flex items-center justify-center gap-3">
            <PencilBookIcon className="w-10 h-10 sm:w-12 sm:h-12 text-orange-400"/>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-700 tracking-tight">
                <span className="text-orange-500">즐거운</span> 받아쓰기
            </h1>
        </header>
        {renderContent()}
       </main>
    </div>
  );
};

export default App;