import React, { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { UI_STRINGS } from '../content/ui.fa';
import { focusYFor } from '../content/imageFocus';

interface CardImageProps {
  src: string;
  alt: string;
}

/**
 * Card photo for Section A. If the file is missing (not uploaded yet) it falls back to the
 * neutral placeholder, so the assessment keeps working with a partial image set.
 */
export const CardImage: React.FC<CardImageProps> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="h-44 sm:h-56 bg-gradient-to-br from-slate-100 via-amber-50/40 to-slate-200 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 flex flex-col items-center justify-center text-center relative border-b border-slate-200/60 dark:border-slate-800 overflow-hidden">
      {failed ? (
        <div className="p-4">
          <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-xs flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 mx-auto">
            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {UI_STRINGS.sectionA.placeholderTitle}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
          style={{ objectPosition: `50% ${focusYFor(src)}%` }}
        />
      )}
    </div>
  );
};
