
import React, { useState, useRef } from 'react';
import { PlayIcon, SaveIcon } from './icons';
import SavedDictations from './SavedDictations';
import { SavedText } from '../types';

interface ParentSetupProps {
  text: string;
  onTextChange: (newText: string) => void;
  onStart: (shuffle: boolean) => void;
  savedTexts: SavedText[];
  onSave: () => void;
  onSelect: (content: string) => void;
  onDelete: (id: string) => void;
}

const ParentSetup: React.FC<ParentSetupProps> = ({ text, onTextChange, onStart, savedTexts, onSave, onSelect, onDelete }) => {
  const [shuffle, setShuffle] = useState(false);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleStart = () => {
    onStart(shuffle);
  };
  
  const handleSave = () => {
    onSave();
  }

  const lineNumbers = Array.from({ length: Math.max(text.split('\n').length, 1) }, (_, i) => i + 1).join('\n');

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h2 className="text-xl font-bold text-slate-700 mb-2">받아쓰기 내용 입력</h2>
      <p className="text-slate-500 mb-6 max-w-md">
        아이에게 들려줄 단어나 문장을 한 줄에 하나씩 입력해주세요.
        저장된 목록에서 불러올 수도 있습니다.
      </p>
      
      <div className="w-full max-w-lg h-48 grid grid-cols-[auto_1fr] overflow-hidden rounded-lg bg-white shadow-inner border border-slate-200 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition">
        <div 
          ref={lineNumbersRef}
          className="p-4 bg-slate-50 text-slate-400 text-right select-none overflow-y-hidden"
          aria-hidden="true"
        >
          <pre className="font-mono text-base leading-relaxed m-0 p-0">
            {lineNumbers}
          </pre>
        </div>
        <textarea
          ref={textareaRef}
          className="w-full h-full p-4 border-0 focus:ring-0 resize-none font-mono text-base leading-relaxed bg-transparent text-slate-800"
          placeholder="예시) 사과, 맛있는 딸기, 학교에 갑니다"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck="false"
        />
      </div>

      <SavedDictations savedTexts={savedTexts} onSelect={onSelect} onDelete={onDelete} />

      <div className="mt-6">
        <label className="flex items-center justify-center gap-2 text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(e) => setShuffle(e.target.checked)}
            className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
          />
          문제 순서 섞기
        </label>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-blue-600 transition-all duration-150 border-b-4 border-blue-700 active:translate-y-px active:border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <SaveIcon className="w-6 h-6" />
          저장
        </button>
        <button
          onClick={handleStart}
          className="flex items-center gap-2 bg-orange-400 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-orange-500 transition-all duration-150 border-b-4 border-orange-600 active:translate-y-px active:border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
        >
          <PlayIcon className="w-6 h-6" />
          시작하기
        </button>
      </div>
    </div>
  );
};

export default ParentSetup;