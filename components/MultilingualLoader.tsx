'use client';

import React from 'react';

const learningWords = [
  { word: 'ಓದು', language: 'KANNADA' },
  { word: '阅读', language: 'MANDARIN' },
  { word: 'पढ़ो', language: 'HINDI' },
  { word: '読む', language: 'JAPANESE' },
  { word: 'படி', language: 'TAMIL' },
  { word: 'اقرأ', language: 'ARABIC' },
  { word: 'చదువు', language: 'TELUGU' },
  { word: 'Читать', language: 'RUSSIAN' },
  { word: 'পড়ুন', language: 'BENGALI' },
  { word: 'Διαβάστε', language: 'GREEK' },
  { word: 'वाचा', language: 'MARATHI' },
  { word: 'קרא', language: 'HEBREW' },
  { word: 'વાંચો', language: 'GUJARATI' },
  { word: '읽기', language: 'KOREAN' },
  { word: 'വായിക്കുക', language: 'MALAYALAM' },
  { word: 'อ่าน', language: 'THAI' },
  { word: 'ਪੜ੍ਹੋ', language: 'PUNJABI' },
  { word: 'Leer', language: 'SPANISH' },
  { word: 'ପଢନ୍ତុ', language: 'ODIA' },
  { word: 'Learn', language: 'ENGLISH' }
];

interface MultilingualLoaderProps {
  message?: string;
  compact?: boolean;
}

export default function MultilingualLoader({
  message = 'Preparing your learning space',
  compact = false,
}: MultilingualLoaderProps) {
  // Safe array concatenation to enable a clean loop transition
  const loopingWords = learningWords.concat(learningWords[0]);

  return (
    <div className={compact ? 'loader compact' : 'loader'} role="status" aria-live="polite" aria-label={message}>
      <div className="loader-mark" aria-hidden="true">
        <span className="mark-line" />
        <div className="word-window">
          
          {/* Word track: Slides from left to right */}
          <div className="word-track track-words">
            {loopingWords.map((entry, index) => (
              <div className="word-cell" key={`word-${entry.language}-${index}`}>
                <strong>{entry.word}</strong>
              </div>
            ))}
          </div>

          {/* Language track: Slides from right to left */}
          <div className="word-track track-languages">
            {loopingWords.map((entry, index) => (
              <div className="word-cell" key={`lang-${entry.language}-${index}`}>
                <small>{entry.language}</small>
              </div>
            ))}
          </div>

        </div>
        <span className="mark-line" />
      </div>
      <p>{message}</p>
      <span className="screen-reader-only">Loading</span>
      
      <style jsx>{`
        .loader { min-height: calc(100vh - 13rem); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1.1rem; padding:3rem 1.25rem; color:var(--text-secondary); text-align:center; }
        .loader.compact { min-height:12rem; padding:1.5rem; }
        .loader-mark { display:flex; align-items:center; gap:.85rem; color:var(--text-primary); }
        .mark-line { width:2.4rem; height:1px; background:var(--border-color); }
        
        /* The Window Viewport */
        .word-window { 
          position: relative;
          width: 14.5rem; 
          height: 4.6rem; 
          overflow: hidden; 
          border: 1px solid var(--border-color); 
          border-top: 3px solid var(--accent-primary); 
          background: var(--bg-secondary); 
          box-shadow: var(--shadow-md); 
        }
        
        .word-track { 
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          display: flex; 
          flex-direction: column; 
        }
        
        .word-cell { 
          height: 4.6rem; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
        }
        
        /* Layout formatting */
        .word-cell strong { 
          font-family: var(--font-display); 
          font-size: 1.65rem; 
          line-height: 1; 
          color: var(--text-primary); 
          transform: translateY(-0.35rem); 
        }
        
        .word-cell small { 
          color: var(--accent-primary); 
          font-family: var(--font-sans); 
          font-size: .64rem; 
          font-weight: 800; 
          letter-spacing: .12em; 
          transform: translateY(0.85rem); 
        }
        
        /* Fast Animation: Whole sequence runs in 12s total */
        .track-words {
          animation: cycle-words-left-right 12s cubic-bezier(.76,0,.24,1) infinite;
        }
        .track-languages {
          animation: cycle-languages-right-left 12s cubic-bezier(.76,0,.24,1) infinite;
        }

        .loader p { margin:0; font-size:.88rem; font-weight:700; }
        .screen-reader-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

        /* Words Track Keyframes (Step up + slide left to right) */
        @keyframes cycle-words-left-right {
          0%, 3%   { transform: translateY(0) translateX(-25px); opacity: 0; }
          4%, 8%   { transform: translateY(0) translateX(0); opacity: 1; }
          9%       { transform: translateY(-4.6rem) translateX(25px); opacity: 0; }
          10%, 13% { transform: translateY(-4.6rem) translateX(0); opacity: 1; }
          14%      { transform: translateY(-9.2rem) translateX(-25px); opacity: 0; }
          15%, 18% { transform: translateY(-9.2rem) translateX(0); opacity: 1; }
          19%      { transform: translateY(-13.8rem) translateX(25px); opacity: 0; }
          20%, 23% { transform: translateY(-13.8rem) translateX(0); opacity: 1; }
          24%      { transform: translateY(-18.4rem) translateX(-25px); opacity: 0; }
          25%, 28% { transform: translateY(-18.4rem) translateX(0); opacity: 1; }
          29%      { transform: translateY(-23rem) translateX(25px); opacity: 0; }
          30%, 33% { transform: translateY(-23rem) translateX(0); opacity: 1; }
          34%      { transform: translateY(-27.6rem) translateX(-25px); opacity: 0; }
          35%, 38% { transform: translateY(-27.6rem) translateX(0); opacity: 1; }
          39%      { transform: translateY(-32.2rem) translateX(25px); opacity: 0; }
          40%, 43% { transform: translateY(-32.2rem) translateX(0); opacity: 1; }
          44%      { transform: translateY(-36.8rem) translateX(-25px); opacity: 0; }
          45%, 48% { transform: translateY(-36.8rem) translateX(0); opacity: 1; }
          49%      { transform: translateY(-41.4rem) translateX(25px); opacity: 0; }
          50%, 53% { transform: translateY(-41.4rem) translateX(0); opacity: 1; }
          54%      { transform: translateY(-46rem) translateX(-25px); opacity: 0; }
          55%, 58% { transform: translateY(-46rem) translateX(0); opacity: 1; }
          59%      { transform: translateY(-50.6rem) translateX(25px); opacity: 0; }
          60%, 63% { transform: translateY(-50.6rem) translateX(0); opacity: 1; }
          64%      { transform: translateY(-55.2rem) translateX(-25px); opacity: 0; }
          65%, 68% { transform: translateY(-55.2rem) translateX(0); opacity: 1; }
          69%      { transform: translateY(-59.8rem) translateX(25px); opacity: 0; }
          70%, 73% { transform: translateY(-59.8rem) translateX(0); opacity: 1; }
          74%      { transform: translateY(-64.4rem) translateX(-25px); opacity: 0; }
          75%, 78% { transform: translateY(-64.4rem) translateX(0); opacity: 1; }
          79%      { transform: translateY(-69rem) translateX(25px); opacity: 0; }
          80%, 83% { transform: translateY(-69rem) translateX(0); opacity: 1; }
          84%      { transform: translateY(-73.6rem) translateX(-25px); opacity: 0; }
          85%, 88% { transform: translateY(-73.6rem) translateX(0); opacity: 1; }
          89%      { transform: translateY(-78.2rem) translateX(25px); opacity: 0; }
          90%, 93% { transform: translateY(-78.2rem) translateX(0); opacity: 1; }
          94%      { transform: translateY(-82.8rem) translateX(-25px); opacity: 0; }
          95%, 98% { transform: translateY(-82.8rem) translateX(0); opacity: 1; }
          100%     { transform: translateY(-87.4rem) translateX(0); opacity: 1; }
        }

        /* Languages Track Keyframes (Step up + slide right to left) */
        @keyframes cycle-languages-right-left {
          0%, 3%   { transform: translateY(0) translateX(25px); opacity: 0; }
          4%, 8%   { transform: translateY(0) translateX(0); opacity: 1; }
          9%       { transform: translateY(-4.6rem) translateX(-25px); opacity: 0; }
          10%, 13% { transform: translateY(-4.6rem) translateX(0); opacity: 1; }
          14%      { transform: translateY(-9.2rem) translateX(25px); opacity: 0; }
          15%, 18% { transform: translateY(-9.2rem) translateX(0); opacity: 1; }
          19%      { transform: translateY(-13.8rem) translateX(-25px); opacity: 0; }
          20%, 23% { transform: translateY(-13.8rem) translateX(0); opacity: 1; }
          24%      { transform: translateY(-18.4rem) translateX(25px); opacity: 0; }
          25%, 28% { transform: translateY(-18.4rem) translateX(0); opacity: 1; }
          29%      { transform: translateY(-23rem) translateX(-25px); opacity: 0; }
          30%, 33% { transform: translateY(-23rem) translateX(0); opacity: 1; }
          34%      { transform: translateY(-27.6rem) translateX(25px); opacity: 0; }
          35%, 38% { transform: translateY(-27.6rem) translateX(0); opacity: 1; }
          39%      { transform: translateY(-32.2rem) translateX(-25px); opacity: 0; }
          40%, 43% { transform: translateY(-32.2rem) translateX(0); opacity: 1; }
          44%      { transform: translateY(-36.8rem) translateX(25px); opacity: 0; }
          45%, 48% { transform: translateY(-36.8rem) translateX(0); opacity: 1; }
          49%      { transform: translateY(-41.4rem) translateX(-25px); opacity: 0; }
          50%, 53% { transform: translateY(-41.4rem) translateX(0); opacity: 1; }
          54%      { transform: translateY(-46rem) translateX(25px); opacity: 0; }
          55%, 58% { transform: translateY(-46rem) translateX(0); opacity: 1; }
          59%      { transform: translateY(-50.6rem) translateX(-25px); opacity: 0; }
          60%, 63% { transform: translateY(-50.6rem) translateX(0); opacity: 1; }
          64%      { transform: translateY(-55.2rem) translateX(25px); opacity: 0; }
          65%, 68% { transform: translateY(-55.2rem) translateX(0); opacity: 1; }
          69%      { transform: translateY(-59.8rem) translateX(-25px); opacity: 0; }
          70%, 73% { transform: translateY(-59.8rem) translateX(0); opacity: 1; }
          74%      { transform: translateY(-64.4rem) translateX(25px); opacity: 0; }
          75%, 78% { transform: translateY(-64.4rem) translateX(0); opacity: 1; }
          79%      { transform: translateY(-69rem) translateX(-25px); opacity: 0; }
          80%, 83% { transform: translateY(-69rem) translateX(0); opacity: 1; }
          84%      { transform: translateY(-73.6rem) translateX(25px); opacity: 0; }
          85%, 88% { transform: translateY(-73.6rem) translateX(0); opacity: 1; }
          89%      { transform: translateY(-78.2rem) translateX(-25px); opacity: 0; }
          90%, 93% { transform: translateY(-78.2rem) translateX(0); opacity: 1; }
          94%      { transform: translateY(-82.8rem) translateX(25px); opacity: 0; }
          95%, 98% { transform: translateY(-82.8rem) translateX(0); opacity: 1; }
          100%     { transform: translateY(-87.4rem) translateX(0); opacity: 1; }
        }
          @media (prefers-reduced-motion: reduce) { 
          .track-words, .track-languages { animation: none !important; } 
        }
        @media (max-width: 480px) { 
          .mark-line { width: 1.3rem; }
          .word-window { width: 12.5rem; } 
        }
      `}</style>
    </div>
  );
}
