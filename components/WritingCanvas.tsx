import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';

const PEN_COLOR = '#334155'; // slate-700
const PEN_WIDTH = 4;
const ERASER_WIDTH = 25;

interface WritingCanvasProps {
  initialImageUrl?: string;
  tool: 'pen' | 'eraser';
}

export interface WritingCanvasHandle {
  getImage: () => string;
  clear: () => void;
}

const WritingCanvas = forwardRef<WritingCanvasHandle, WritingCanvasProps>(({ initialImageUrl, tool }, ref) => {
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const guidelineCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawCtx, setDrawCtx] = useState<CanvasRenderingContext2D | null>(null);

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
      
      const numLines = 5;
      const spacing = canvas.height / (numLines + 1);

      for (let i = 1; i <= numLines; i++) {
        const y = Math.round(spacing * i);
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, []);

  // Effect to load initial image
  useEffect(() => {
    if (drawCtx && drawCanvasRef.current) {
      drawCtx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);

      if (initialImageUrl && initialImageUrl !== 'empty.png') {
        const img = new Image();
        img.src = initialImageUrl;
        img.onload = () => {
          if (drawCtx && drawCanvasRef.current) {
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
      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = canvas.width;
      blankCanvas.height = canvas.height;
      if (canvas.toDataURL() === blankCanvas.toDataURL()) {
        return "empty.png";
      }
      return canvas.toDataURL('image/png');
    },
    clear: clearCanvas,
  }));

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
    </div>
  );
});

WritingCanvas.displayName = 'WritingCanvas';

export default WritingCanvas;