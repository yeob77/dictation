import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { UndoIcon } from './icons';

const PEN_COLOR = '#ef4444'; // red-500
const PEN_WIDTH = 3;

export interface GradingCanvasHandle {
  getCombinedImage: () => Promise<string>;
}

interface GradingCanvasProps {
  imageUrl: string;
}

const GradingCanvas = forwardRef<GradingCanvasHandle, GradingCanvasProps>(({ imageUrl }, ref) => {
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawCtx, setDrawCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Effect for setting up drawing canvas context
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = PEN_COLOR;
      ctx.lineWidth = PEN_WIDTH;
      ctx.imageSmoothingEnabled = true; // Enable anti-aliasing
      ctx.imageSmoothingQuality = 'high'; // Set quality to high
      setDrawCtx(ctx);
    }
  }, []);
  
  // Clear history when the image changes
  useEffect(() => {
    setHistory([]);
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [imageUrl]);

  useImperativeHandle(ref, () => ({
    getCombinedImage: async (): Promise<string> => {
      const combinedCanvas = document.createElement('canvas');
      const drawCanvas = drawCanvasRef.current;
      const combinedCtx = combinedCanvas.getContext('2d');
      
      if (!combinedCtx || !drawCanvas) return '';
  
      combinedCanvas.width = drawCanvas.width;
      combinedCanvas.height = drawCanvas.height;
      
      // 1. Fill with a solid white background for the final exported image.
      combinedCtx.fillStyle = 'white';
      combinedCtx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

      const showPlaceholder = !imageUrl || imageUrl === 'empty.png';
  
      // 2. Draw handwritten image (now transparent) on top of the white background
      if (!showPlaceholder) {
          const bgImg = new Image();
          bgImg.crossOrigin = "anonymous";
          bgImg.src = imageUrl;
          await new Promise((resolve, reject) => {
              bgImg.onload = resolve;
              bgImg.onerror = reject;
          });
          combinedCtx.drawImage(bgImg, 0, 0, combinedCanvas.width, combinedCanvas.height);
      } else {
          // If there was no handwriting, draw a placeholder text.
          combinedCtx.fillStyle = '#94a3b8'; // slate-400
          combinedCtx.font = '24px Noto Sans KR, sans-serif';
          combinedCtx.textAlign = 'center';
          combinedCtx.textBaseline = 'middle';
          combinedCtx.fillText('입력 안 함', combinedCanvas.width / 2, combinedCanvas.height / 2);
      }
  
      // 3. Draw red-pen corrections on top
      combinedCtx.drawImage(drawCanvas, 0, 0);
  
      return combinedCanvas.toDataURL('image/png');
    }
  }));

  const getCoords = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (event.nativeEvent instanceof MouseEvent) {
      clientX = event.nativeEvent.clientX;
      clientY = event.nativeEvent.clientY;
    } else if (event.nativeEvent instanceof TouchEvent && event.nativeEvent.touches.length > 0) {
      clientX = event.nativeEvent.touches[0].clientX;
      clientY = event.nativeEvent.touches[0].clientY;
    } else {
      return { x: 0, y: 0 };
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return { 
        x: (clientX - rect.left) * scaleX, 
        y: (clientY - rect.top) * scaleY 
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    // event.preventDefault(); // Handled in JSX
    if (!drawCtx) return;
    const { x, y } = getCoords(event);
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    // event.preventDefault(); // Handled in JSX
    if (!isDrawing || !drawCtx) return;
    const { x, y } = getCoords(event);
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !drawCtx) return;
    drawCtx.closePath();
    setIsDrawing(false);

    const canvas = drawCanvasRef.current;
    if (canvas) {
      const imageData = drawCtx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prevHistory => [...prevHistory, imageData]);
    }
  };
  
  const handleUndo = () => {
    if (!drawCtx || !drawCanvasRef.current) return;
    
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    drawCtx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);

    if (newHistory.length > 0) {
      drawCtx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    }
  };
  
  const showPlaceholder = !imageUrl || imageUrl === 'empty.png';
  
  return (
    <div 
      className="relative w-full h-36 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-inner"
    >
      {showPlaceholder ? (
        <p className="text-slate-400">입력 안 함</p>
      ) : (
        <>
          <canvas
            ref={drawCanvasRef}
            width={400}
            height={300}
            className="absolute top-0 left-0 w-full h-full rounded-lg touch-action-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
            onTouchMove={(e) => { e.preventDefault(); draw(e); }}
            onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
          />
          {history.length > 0 && (
            <button
              onClick={handleUndo}
              className="absolute top-2 right-2 p-2 bg-white/70 text-slate-700 rounded-full hover:bg-slate-100 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400"
              title="되돌리기"
              aria-label="되돌리기"
            >
              <UndoIcon className="w-5 h-5" />
            </button>
          )}
        </>
      )}
    </div>
  );
});

GradingCanvas.displayName = 'GradingCanvas';

export default GradingCanvas;
