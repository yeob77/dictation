import React, { useState } from 'react';
import ParentSetup from './components/ParentSetup';
import DictationView from './components/DictationView';
import ResultsView from './components/ResultsView';
import { AppState, Dictation, SavedText } from './types';
import { PencilBookIcon } from './components/icons';
import { useLocalStorage } from './hooks/useLocalStorage';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [dictations, setDictations] = useState<Dictation[]>([]);
  const [originalDictations, setOriginalDictations] = useState<Dictation[] | null>(null);
  const [isPracticeSession, setIsPracticeSession] = useState(false);
  const [text, setText] = useState<string>('');
  const [savedTexts, setSavedTexts] = useLocalStorage<SavedText[]>('savedDictations', []);
  const [dictationKey, setDictationKey] = useState(0);

  const handleStartDictation = (shuffle: boolean) => {
    let words = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
    
    if (shuffle) {
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
    setDictationKey(prevKey => prevKey + 1);
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
    setText('');
    setAppState(AppState.SETUP);
  };

  const handleRetry = () => {
    const resetDictations = dictations.map(d => ({ ...d, handwrittenImage: '', isCorrect: null }));

    for (let i = resetDictations.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [resetDictations[i], resetDictations[j]] = [resetDictations[j], resetDictations[i]];
    }

    setDictations(resetDictations);
    setIsPracticeSession(false);
    setDictationKey(prevKey => prevKey + 1);
    setAppState(AppState.DICTATION);
  };

  const handleRetryOriginal = () => {
    if (!originalDictations) return;
    const resetDictations = originalDictations.map(d => ({ ...d, handwrittenImage: '', isCorrect: null }));

    for (let i = resetDictations.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [resetDictations[i], resetDictations[j]] = [resetDictations[j], resetDictations[i]];
    }

    setDictations(resetDictations);
    setIsPracticeSession(false);
    setDictationKey(prevKey => prevKey + 1);
    setAppState(AppState.DICTATION);
  };

  const handlePracticeMistakes = () => {
    let mistakenWords = dictations.filter(d => d.isCorrect === false).map(d => d.originalWord);
    for (let i = mistakenWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mistakenWords[i], mistakenWords[j]] = [mistakenWords[j], mistakenWords[i]];
    }
    const mistakeDictations = mistakenWords.map(word => ({ originalWord: word, handwrittenImage: '', isCorrect: null }));
    setDictations(mistakeDictations);
    setIsPracticeSession(true);
    setDictationKey(prevKey => prevKey + 1);
    setAppState(AppState.DICTATION);
  };

  const handleBackToSetup = () => {
    setAppState(AppState.SETUP);
  };

  const handleSaveText = () => {
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      alert('저장할 내용이 없습니다.');
      return;
    }
    if (savedTexts.some(st => st.content === trimmedText)) {
      alert('이미 저장된 내용입니다.');
      return;
    }
    const newSavedText: SavedText = {
      id: crypto.randomUUID(),
      content: trimmedText,
    };
    setSavedTexts([...savedTexts, newSavedText]);
    alert('저장되었습니다!');
  };

  const handleSelectText = (content: string) => {
    setText(content);
  };

  const handleDeleteText = (id: string) => {
    if (confirm('정말로 이 목록을 삭제하시겠습니까?')) {
      setSavedTexts(savedTexts.filter(st => st.id !== id));
    }
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.SETUP:
        return (
          <ParentSetup 
            text={text} 
            onTextChange={setText} 
            onStart={handleStartDictation}
            savedTexts={savedTexts}
            onSave={handleSaveText}
            onSelect={handleSelectText}
            onDelete={handleDeleteText}
          />
        );
      case AppState.DICTATION:
        return <DictationView key={dictationKey} dictations={dictations} onFinish={handleFinishDictation} onBack={handleBackToSetup} />;
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
        return <ParentSetup text={text} onTextChange={setText} onStart={handleStartDictation} savedTexts={savedTexts} onSave={handleSaveText} onSelect={handleSelectText} onDelete={handleDeleteText} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6">
       <main className="w-full max-w-5xl mx-auto flex flex-col h-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-2 sm:p-6 border border-white">
        <header className="text-center mb-2 md:mb-4 flex-shrink-0 flex items-center justify-center gap-3">
            <PencilBookIcon className="w-8 h-8 sm:w-12 sm:h-12 text-orange-400"/>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-700 tracking-tight">
                <span className="text-orange-500">즐거운</span> 받아쓰기
            </h1>
        </header>
        {renderContent()}
       </main>
    </div>
  );
};

export default App;