import React, { useEffect, useState } from 'react';

export default function AdBanner() {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Check if the adsbygoogle script is blocked/missing entirely
    if (!window.adsbygoogle) {
      setIsBlocked(true);
      return;
    }
    
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      setIsBlocked(true);
    }
  }, []);

  // Collapse the container fully if ads are blocked or failed to load to avoid empty whitespace
  if (isBlocked) {
    return null;
  }

  return (
    <div className="w-full flex justify-center py-2 bg-gray-100 border-b border-gray-200 text-center">
      {/* ad11 */}
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', minHeight: '90px' }}
           data-ad-client="ca-pub-5180621516690353"
           data-ad-slot="1558024599"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
