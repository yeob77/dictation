import React from 'react';
import { motion } from 'framer-motion';
import { BookOpenIcon, TrashIcon, ClipboardListIcon } from './icons';

interface SavedDictationsProps {
  savedTexts: { id: string; content: string }[];
  onSelect: (content: string) => void;
  onDelete: (id: string) => void;
}

const animationProps = {
  initial: { opacity: 0, y: -15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" },
};

const SavedDictations: React.FC<SavedDictationsProps> = ({ savedTexts, onSelect, onDelete }) => {
  if (savedTexts.length === 0) {
    return (
      <motion.div {...animationProps} className="w-full mt-6 p-4 text-center bg-white/50 rounded-lg shadow-inner">
        <ClipboardListIcon className="w-12 h-12 mx-auto text-slate-400" />
        <h3 className="mt-2 text-lg font-bold text-slate-600">저장된 목록 없음</h3>
        <p className="mt-1 text-sm text-slate-500">첫 받아쓰기 내용을 저장해보세요!</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...animationProps} className="w-full mt-6 p-4 bg-white/50 rounded-lg shadow-inner">
      <h3 className="text-lg font-bold text-slate-600 mb-3">저장된 목록</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {savedTexts.map((text) => (
          <div key={text.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
            <p className="text-slate-800 truncate flex-1 mr-4">
              {text.content.split('\n')[0]}...
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={() => onSelect(text.content)}
                className="p-2 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors flex items-center gap-1"
                aria-label={`Select dictation starting with ${text.content.slice(0, 20)}`}
              >
                <BookOpenIcon className="w-4 h-4" />
                <span>선택</span>
              </button>
              <button 
                onClick={() => onDelete(text.id)}
                className="p-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors flex items-center gap-1"
                aria-label={`Delete dictation starting with ${text.content.slice(0, 20)}`}
              >
                <TrashIcon className="w-4 h-4" />
                <span>삭제</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SavedDictations;