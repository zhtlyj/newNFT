"use client";

import { useState } from "react";

const VRPage = () => {
  const [showVR, setShowVR] = useState(false);

  if (!showVR) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-black relative">
        {/* 背景层 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/cyberpunk-grid.png')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0ff]/5 via-transparent to-transparent"></div>
        </div>
        
        {/* 按钮层 */}
        <button 
          className="relative z-50 px-8 py-4 text-2xl font-bold text-[#0ff] border-2 border-[#0ff] 
          bg-black hover:bg-[#0ff]/20 transition-all duration-300 cursor-pointer
          shadow-[0_0_20px_#0ff]"
          onClick={() => setShowVR(true)}
        >
          进入元宇宙
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-screen">
      <div className="w-full h-full">
        <iframe 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          allow="camera; microphone; display-capture; autoplay; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          src="https://demo.corporate-metaverse.com/join"
        />
      </div>
    </div>
  );
};

export default VRPage;