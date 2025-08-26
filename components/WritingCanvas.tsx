

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { ClearIcon, PencilIcon, EraserIcon } from './icons';

const PEN_COLOR = '#334155'; // slate-700
const PEN_WIDTH = 4;
const ERASER_WIDTH = 25;

interface WritingCanvasProps {
  initialImageUrl?: string;
}

export interface WritingCanvasHandle {
  getImage: () => string;
  clear: () => void;
}


const WritingCanvas = forwardRef<WritingCanvasHandle, WritingCanvasProps>(({ initialImageUrl }, ref) => {
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const guidelineCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawCtx, setDrawCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  // Effect for setting up drawing canvas context
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if(ctx){
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setDrawCtx(ctx);
    }
  }, []);

  // Effect for drawing guidelines
  useEffect(() => {
    const canvas = guidelineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.strokeStyle = '#e2e8f0'; // slate-200
      ctx.lineWidth = 2;
      
      const numLines = 5; // Increased number of lines for taller canvas
      const spacing = canvas.height / (numLines + 1);

      for (let i = 1; i <= numLines; i++) {
        const y = Math.round(spacing * i);
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5); // +0.5 for sharper lines
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, []); // Runs once

  // Effect to load initial image
  useEffect(() => {
    if (drawCtx && drawCanvasRef.current) {
      // Clear canvas before drawing new image
      drawCtx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);

      if (initialImageUrl && initialImageUrl !== 'empty.png') {
        const img = new Image();
        img.src = initialImageUrl;
        img.onload = () => {
          if (drawCtx && drawCanvasRef.current) { // Check again in case component unmounted
            drawCtx.drawImage(img, 0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
          }
        };
      }
    }
  }, [initialImageUrl, drawCtx]);

  const setupContextForTool = () => {
    if (!drawCtx) return;
    if (tool === 'pen') {
      drawCtx.globalCompositeOperation = 'source-over';
      drawCtx.strokeStyle = PEN_COLOR;
      drawCtx.lineWidth = PEN_WIDTH;
    } else { // eraser
      drawCtx.globalCompositeOperation = 'destination-out';
      drawCtx.lineWidth = ERASER_WIDTH;
    }
  };

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

    // Scale coordinates to match canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return { 
        x: (clientX - rect.left) * scaleX, 
        y: (clientY - rect.top) * scaleY 
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!drawCtx) return;
    setupContextForTool();
    const { x, y } = getCoords(event);
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing || !drawCtx) return;
    const { x, y } = getCoords(event);
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
  };

  const stopDrawing = () => {
    if (!drawCtx) return;
    drawCtx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (canvas && drawCtx) {
      drawCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useImperativeHandle(ref, () => ({
    getImage: () => {
      const canvas = drawCanvasRef.current;
      if (!canvas) {
        return '';
      }

      // Create a temporary canvas to check if the drawing canvas is blank.
      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = canvas.width;
      blankCanvas.height = canvas.height;
      
      // If it's blank, return a special string.
      if (canvas.toDataURL() === blankCanvas.toDataURL()) {
        return "empty.png";
      }
      
      // Otherwise, return the content of the drawing canvas, which has a transparent background.
      return canvas.toDataURL('image/png');
    },
    clear: clearCanvas,
  }));

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

  return (
    <div className="relative w-full h-full touch-none bg-white rounded-xl shadow-inner border border-slate-200">
       <canvas
        ref={guidelineCanvasRef}
        width={800}
        height={600}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
      <canvas
        ref={drawCanvasRef}
        width={800}
        height={600}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-100/50 backdrop-blur-sm p-1 rounded-full shadow-sm">
        <ToolButton label="연필" currentTool={tool} toolName="pen" onClick={() => setTool('pen')}>
            <PencilIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="지우개" currentTool={tool} toolName="eraser" onClick={() => setTool('eraser')}>
            <EraserIcon className="w-5 h-5" />
        </ToolButton>
        <button 
          onClick={clearCanvas} 
          className="p-2 bg-white text-slate-600 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          title="전체 지우기"
          aria-label="전체 지우기"
        >
          <ClearIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

WritingCanvas.displayName = 'WritingCanvas';

export default WritingCanvas;