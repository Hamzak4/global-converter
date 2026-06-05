import React from 'react';
import { SiteSettings } from '../types';

interface AdSenseProps {
  type: 'header' | 'sidebar' | 'between_content' | 'footer';
  settings: SiteSettings;
}

export const AdSense: React.FC<AdSenseProps> = ({ type, settings }) => {
  const adHtml = settings.ads[type];

  if (!adHtml) return null;

  return (
    <div className="w-full my-4 flex justify-center items-center">
      <div 
        className="w-full max-w-4xl text-center rounded border border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/30 overflow-hidden"
        dangerouslySetInnerHTML={{ __html: adHtml }}
      />
    </div>
  );
};

export default AdSense;
