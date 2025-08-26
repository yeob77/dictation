import React, { useState, useRef, useCallback } from 'react';
import { Dictation } from '../types';
import WritingCanvas, { WritingCanvasHandle } from './WritingCanvas';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SpeakerIcon, NextIcon, CheckIcon, BackIcon, PrevIcon, PencilIcon, EraserIcon, ClearIcon } from './icons';

interface DictationViewProps {
  dictations: Dictation[];
  onFinish: (finalDictations: Dictation[]) => void;
  onBack: () => void;
}

const SPEEDS = [
  { label: '느리게', value: 0.5 },
  { label: '보통', value: 1.0 },
  { label: '빠르게', value: 1.5 },
];

const ToolButton: React.FC<{
    label: string, 
    currentTool: 'pen' | 'eraser', 
    toolName: 'pen' | 'eraser',
    onClick: () => void,
    children: React.ReactNode
  }> = ({ label, currentTool, toolName, onClick, children }) => (
    <button 
      onClick={onClick} 
      className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${currentTool === toolName ? 'bg-sky-400 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
      title={label}
      aria-label={label}
      aria-pressed={currentTool === toolName}
    >
      {children}
    </button>
);

const DictationView: React.FC<DictationViewProps> = ({ dictations, onFinish, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [updatedDictations, setUpdatedDictations] = useState<Dictation[]>([...dictations]);
  const [initialWordSpoken, setInitialWordSpoken] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const canvasRef = useRef<WritingCanvasHandle>(null);
  const { speak, isSpeaking, voices, selectedVoice, handleSelectVoice } = useSpeechSynthesis();

  const currentWord = updatedDictations[currentIdx]?.originalWord;

  const handleListen = useCallback(() => {
    speak(currentWord, { rate: speechRate });
    if (!initialWordSpoken) {
      setInitialWordSpoken(true);
    }
  }, [speak, currentWord, initialWordSpoken, speechRate]);

  const processAnswer = () => {
    if (!canvasRef.current) return updatedDictations;
    
    const imageDataUrl = canvasRef.current.getImage();
    const newDictations = [...updatedDictations];
    newDictations[currentIdx] = {
      ...newDictations[currentIdx],
      handwrittenImage: imageDataUrl,
    };
    setUpdatedDictations(newDictations);
    return newDictations;
  };

  const handleNext = () => {
    processAnswer();
    
    if (currentIdx < dictations.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      speak(dictations[nextIdx].originalWord, { rate: speechRate });
    }
  };
  
  const handlePrev = () => {
    processAnswer();
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      speak(dictations[prevIdx].originalWord, { rate: speechRate });
    }
  };

  const handleFinish = () => {
    const finalDictations = processAnswer();
    onFinish(finalDictations);
  };

  const handleClearCanvas = () => {
    canvasRef.current?.clear();
  };
  
  const isLastWord = currentIdx === dictations.length - 1;

  const TactileButton = ({ onClick, disabled, children, className = '' }: { onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; disabled: boolean; children: React.ReactNode; className?: string; }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-150 border-b-4 active:translate-y-px active:border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:border-b-4 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
       <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-orange-600 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 rounded-lg p-2 bg-white/50 hover:bg-slate-50"
        >
          <BackIcon className="w-5 h-5" />
          다시 입력
        </button>
      </div>

      <div className="flex items-start justify-between mb-2 sm:mb-4 flex-shrink-0">
        <div>
          <p className="text-slate-500 text-base sm:text-lg">문제 {currentIdx + 1} / {dictations.length}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-700 mt-1">따라 써보세요</h2>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-100/50 backdrop-blur-sm p-1 rounded-full shadow-sm">
                <ToolButton label="연필" currentTool={tool} toolName="pen" onClick={() => setTool('pen')}>
                    <PencilIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="지우개" currentTool={tool} toolName="eraser" onClick={() => setTool('eraser')}>
                    <EraserIcon className="w-5 h-5" />
                </ToolButton>
                <button 
                  onClick={handleClearCanvas} 
                  className="p-2 bg-white text-slate-600 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="전체 지우기"
                  aria-label="전체 지우기"
                >
                  <ClearIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex flex-col items-end gap-1 sm:gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-500">읽기 속도</span>
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full shadow-inner">
                            {SPEEDS.map(({ label, value }) => (
                              <button
                                key={label}
                                onClick={() => setSpeechRate(value)}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400 ${speechRate === value ? 'bg-sky-400 text-white shadow' : 'text-slate-500 hover:bg-white'}`}
                              >
                                {label}
                              </button>
                            ))}
                        </div>
                    </div>
                     {voices.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-500">목소리 선택</span>
                         <select
                          value={selectedVoice?.name || ''}
                          onChange={(e) => handleSelectVoice(e.target.value)}
                          className="text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 border-none rounded-full shadow-inner focus:ring-2 focus:ring-orange-400 py-1 sm:py-1.5 pl-2 pr-6 sm:pl-3 sm:pr-8"
                        >
                          {voices.map(voice => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name}
                            </option>
                          ))}
                        </select>
                      </div>
                     )}
                </div>

                <button
                  onClick={handleListen}
                  disabled={isSpeaking}
                  className={`flex-shrink-0 flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 bg-sky-100 rounded-full text-sky-600 hover:bg-sky-200 transition-all duration-150 border-b-4 border-sky-300 active:translate-y-px active:border-b-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 focus:outline-none focus:ring-4 focus:ring-sky-300 ${!initialWordSpoken ? 'animate-pulse' : ''}`}
                >
                  <SpeakerIcon className="w-8 h-8 sm:w-12 sm:h-12" isSpeaking={isSpeaking} />
                </button>
            </div>
        </div>
      </div>
      
      <div className="flex-grow w-full self-stretch my-2">
        <WritingCanvas 
          key={currentIdx} 
          ref={canvasRef} 
          initialImageUrl={updatedDictations[currentIdx].handwrittenImage} 
          tool={tool}
        />
      </div>

      <div className="mt-auto pt-2 flex justify-center items-center gap-4 flex-shrink-0">
        <TactileButton
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="bg-slate-200 text-slate-700 border-slate-400 hover:bg-slate-300 focus:ring-slate-400"
        >
          <PrevIcon className="w-6 h-6" />
          이전 문제
        </TactileButton>
        {isLastWord ? (
          <TactileButton
            onClick={handleFinish}
            disabled={isSpeaking}
            className="bg-green-500 text-white border-green-700 hover:bg-green-600 focus:ring-green-500"
          >
            <CheckIcon className="w-6 h-6" />
            채점하기
          </TactileButton>
        ) : (
          <TactileButton
            onClick={handleNext}
            disabled={isSpeaking}
            className="bg-sky-400 text-white border-sky-600 hover:bg-sky-500 focus:ring-sky-400"
          >
            다음 문제
            <NextIcon className="w-6 h-6" />
          </TactileButton>
        )}
      </div>
    </div>
  );
};

export default DictationView;