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
      {/* Replace with live AdSense ID before production */}
      <ins className="adsbygoogle"
           style={{ display: 'inline-block', width: '728px', height: '90px' }}
           data-ad-client="ca-pub-5180621516690353"
           data-ad-slot="0000000000"
           data-ad-format="horizontal"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
