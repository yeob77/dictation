import React, { useRef } from 'react';
import { Dictation } from '../types';
import { RestartIcon, CheckIcon, XIcon, DownloadIcon } from './icons';
import GradingCanvas, { GradingCanvasHandle } from './GradingCanvas';

interface ResultsViewProps {
  dictations: Dictation[];
  onUpdate: (updatedDictations: Dictation[]) => void;
  onRestart: () => void;
  onRetry: () => void;
  onPracticeMistakes: () => void;
  onRetryOriginal: () => void;
  isPracticeSession: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ dictations, onUpdate, onRestart, onRetry, onPracticeMistakes, onRetryOriginal, isPracticeSession }) => {
  const correctCount = dictations.filter(d => d.isCorrect === true).length;
  const incorrectCount = dictations.filter(d => d.isCorrect === false).length;
  const totalCount = dictations.length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const gradingCanvasRefs = useRef<(GradingCanvasHandle | null)[]>([]);

  const handleGrade = (index: number, isCorrect: boolean) => {
    const newDictations = [...dictations];
    newDictations[index].isCorrect = isCorrect;
    onUpdate(newDictations);
  };

  const handleSaveImage = async () => {
    const PADDING = 25;
    const ROW_HEIGHT = 160;
    const HEADER_HEIGHT = 80;
    const CANVAS_WIDTH = 750;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = HEADER_HEIGHT + (dictations.length * ROW_HEIGHT);

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.font = 'bold 32px Noto Sans KR, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('받아쓰기 채점 결과', canvas.width / 2, HEADER_HEIGHT / 2);
    
    // Column positions
    const col1_x = PADDING;
    const col2_x = 300;
    const col3_x = CANVAS_WIDTH - PADDING - 80;

    for (let i = 0; i < dictations.length; i++) {
        const item = dictations[i];
        const canvasRef = gradingCanvasRefs.current[i];
        if (!canvasRef) continue;

        const yPos = HEADER_HEIGHT + (i * ROW_HEIGHT);
        
        // Draw separator
        if (i > 0) {
            ctx.strokeStyle = '#e2e8f0'; // slate-200
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(PADDING, yPos);
            ctx.lineTo(canvas.width - PADDING, yPos);
            ctx.stroke();
        }

        const contentY = yPos + ROW_HEIGHT / 2;

        // Column 1: Correct answer
        ctx.fillStyle = '#334155'; // slate-700
        ctx.font = 'bold 24px Noto Sans KR, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i+1}. ${item.originalWord}`, col1_x, contentY);

        // Column 2: Graded image
        const imageDataUrl = await canvasRef.getCombinedImage();
        if (imageDataUrl) {
            const img = new Image();
            img.src = imageDataUrl;
            await new Promise(resolve => { img.onload = resolve; });
            
            const boxHeight = ROW_HEIGHT - PADDING;
            const boxWidth = 320;
            
            const scale = Math.min(boxWidth / img.width, boxHeight / img.height);
            const imgW = img.width * scale;
            const imgH = img.height * scale;
            const imgX = col2_x + (boxWidth - imgW) / 2;
            const imgY = yPos + (ROW_HEIGHT - imgH) / 2;
            
            ctx.drawImage(img, imgX, imgY, imgW, imgH);
        }
        
        // Column 3: Grade
        const grade = item.isCorrect === true ? '✅' : '❌';
        if (item.isCorrect !== null) {
            ctx.font = '48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(grade, col3_x, contentY);
        }
    }

    // Download
    const link = document.createElement('a');
    link.download = '받아쓰기-결과.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const TactileButton = ({ onClick, disabled, children, className = '' }: { onClick: React.MouseEventHandler<HTMLButtonElement>; disabled: boolean; children: React.ReactNode; className?: string; }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 font-bold py-2.5 px-5 rounded-xl shadow-md transition-all duration-150 border-b-4 active:translate-y-px active:border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:border-b-4 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-center flex-shrink-0">
        <h2 className="text-2xl font-bold text-slate-700">직접 채점하기</h2>
        <div className="my-4">
            <p className="text-6xl font-black text-orange-500">{score}점</p>
            <p className="text-slate-500 mt-2 text-base">{totalCount}개 중 {correctCount}개 맞았어요!</p>
        </div>
      </div>
      
      <div className="w-full flex-grow overflow-y-auto pr-2 rounded-lg bg-slate-50/50 shadow-inner p-2">
        <ul className="space-y-3">
          {dictations.map((item, index) => (
            <li key={index} className="p-3 rounded-lg bg-white shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full items-center">
                
                <div className="md:col-span-4">
                    <p className="text-xs font-semibold text-slate-400 text-center md:text-left mb-1">정답</p>
                    <p className="font-bold text-slate-700 text-xl text-center md:text-left">{item.originalWord}</p>
                </div>

                <div className="md:col-span-5 w-full">
                  <GradingCanvas ref={el => { gradingCanvasRefs.current[index] = el; }} imageUrl={item.handwrittenImage} />
                </div>
                
                <div className="md:col-span-3 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleGrade(index, true)}
                      className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                        item.isCorrect === true 
                          ? 'bg-green-500 text-white scale-110 shadow-lg' 
                          : 'bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600'
                      }`}
                      aria-label="맞음"
                    >
                      <CheckIcon className="w-9 h-9" />
                    </button>
                    <button
                      onClick={() => handleGrade(index, false)}
                      className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                        item.isCorrect === false
                          ? 'bg-red-500 text-white scale-110 shadow-lg'
                          : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600'
                      }`}
                      aria-label="틀림"
                    >
                      <XIcon className="w-9 h-9" />
                    </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex-shrink-0 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
        {isPracticeSession && (
          <TactileButton
            onClick={onRetryOriginal}
            disabled={false}
            className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 focus:ring-orange-400"
          >
            <RestartIcon className="w-5 h-5" />
            전체 문제 다시 풀기
          </TactileButton>
        )}
        {incorrectCount > 0 && (
          <TactileButton
            onClick={onPracticeMistakes}
            disabled={false}
            className="bg-amber-400 text-white border-amber-600 hover:bg-amber-500 focus:ring-amber-400"
          >
            <RestartIcon className="w-5 h-5" />
            틀린 문제 다시 풀기
          </TactileButton>
        )}
        <TactileButton
          onClick={onRetry}
          disabled={false}
          className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 focus:ring-orange-400"
        >
          <RestartIcon className="w-5 h-5" />
          같은 문제 다시 풀기
        </TactileButton>
        <TactileButton
          onClick={onRestart}
          disabled={false}
          className="bg-sky-400 text-white border-sky-600 hover:bg-sky-500 focus:ring-sky-400"
        >
          <RestartIcon className="w-5 h-5" />
          새로운 받아쓰기
        </TactileButton>
         <TactileButton
          onClick={handleSaveImage}
          disabled={false}
          className="bg-slate-500 text-white border-slate-700 hover:bg-slate-600 focus:ring-slate-500"
        >
          <DownloadIcon className="w-5 h-5" />
          결과 저장
        </TactileButton>
      </div>
    </div>
  );
};

export default ResultsView;