import React from "react";

const steps = [
  {
    id: "01",
    title: "Set Up Your Wallet",
    description: "Once you've set up your wallet of choice, connect it to OpenSea by clicking the NFT...",
    icon: (
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
      />
    )
  },
  {
    id: "02",
    title: "Create your collection",
    description: "Click Create and set up your collection. Add social links, a description, profile & banner...",
    icon: (
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
      />
    )
  },
  {
    id: "03",
    title: "Add your NFTs",
    description: "Upload your work (image, video, audio, or 3D art), add a title and description, and customize yo...",
    icon: (
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 4v16m8-8H4" 
      />
    )
  },
  {
    id: "04",
    title: "List them for sale",
    description: "Choose between auctions, fixed-price listings, and declining-price listings. You...",
    icon: (
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    )
  }
];

const StepsGuide: React.FC = () => {
  return (
    <div className="container mx-auto px-6">
      <div className="text-center mt-4">
        <h1 className="text-5xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Create and sell NFTs
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {steps.map((step) => (
          <div
            key={step.id}
            className="bg-[#231564] rounded-xl p-4 border border-[#3d2b85] relative overflow-hidden group hover:border-purple-500 transition-colors"
          >
            <div className="text-purple-400 text-5xl font-bold opacity-10 absolute -top-4 -left-4">
              {step.id}
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {step.icon}
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
              <p className="text-gray-400 text-xs line-clamp-2">{step.description}</p>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepsGuide; 