import React, { useEffect } from 'react';

export default function AdBanner() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ad blocker or scripts disabled
    }
  }, []);

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
