"use client";

import { useState, useRef, useEffect } from "react";
import type { NextPage } from "next";
import { notification } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";

interface NFTItem {
  id: number;
  name: string;
  image: string;
  rarity: "common" | "uncommon" | "rare" | "mythical" | "legendary";
  price: string;
}

// 添加 ITEMS 常量
const ITEMS: NFTItem[] = [
  { id: 1, name: "Dragon Lore", image: "/1.avif", rarity: "legendary", price: "10.5 ETH" },
  { id: 2, name: "Cyber Punk", image: "/3.avif", rarity: "mythical", price: "5.2 ETH" },
  { id: 3, name: "Neo Tokyo", image: "/9.avif", rarity: "rare", price: "2.1 ETH" },
  { id: 4, name: "Pixel Warrior", image: "/11.avif", rarity: "uncommon", price: "0.8 ETH" },
  { id: 5, name: "Space Cat", image: "/24.webp", rarity: "common", price: "0.3 ETH" },
  { id: 6, name: "Cyber Samurai", image: "/27.avif", rarity: "legendary", price: "8.5 ETH" },
];

// 添加 getRarityColor 函数
const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case "legendary":
      return "text-yellow-500";
    case "mythical":
      return "text-pink-500";
    case "rare":
      return "text-purple-500";
    case "uncommon":
      return "text-blue-500";
    default:
      return "text-gray-400";
  }
};

const BlindBox: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [isOpening, setIsOpening] = useState(false);
  const [isKeyAnimating, setIsKeyAnimating] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NFTItem | null>(null);
  const [items, setItems] = useState<NFTItem[]>([]);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef<HTMLDivElement>(null);

  // 生成滚动列表
  useEffect(() => {
    const generateItems = () => {
      const itemList: NFTItem[] = [];
      for (let i = 0; i < 50; i++) {
        itemList.push(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
      }
      setItems(itemList);
    };
    generateItems();
  }, []);

  // 处理钥匙点击
  const handleKeyClick = () => {
    if (isOpening || isKeyAnimating || !connectedAddress) return;
    setIsKeyAnimating(true);
  };

  // 处理开箱
  const handleOpenBox = async () => {
    if (isOpening) return;

    try {
      setIsOpening(true);
      setSelectedItem(null);

      // 播放开箱动画
      if (boxRef.current) {
        boxRef.current.style.animation = "shake 0.5s ease-in-out";
      }

      // 等待动画完成后开始CSGO风格的开箱
      setTimeout(() => {
        setIsSpinning(true);
        const spinDuration = 6000;
        const finalPosition = Math.floor(Math.random() * (items.length - 10)) + 5;

        if (spinnerRef.current) {
          spinnerRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(0.15, 0.45, 0.15, 1)`;
          spinnerRef.current.style.transform = `translateX(-${finalPosition * 200}px)`;
        }

        // 等待滚动动画结束
        setTimeout(() => {
          setIsSpinning(false);
          setSelectedItem(items[finalPosition]);
          setIsOpening(false);
          setIsKeyAnimating(false);
        }, spinDuration);
      }, 1000);

    } catch (error) {
      console.error("开箱失败:", error);
      notification.error({ message: "开箱失败，请重试 " });
      setIsOpening(false);
      setIsKeyAnimating(false);
      setIsSpinning(false);
    }
  };

  // 定义每个面的图片
  const faceImages = {
    front: ITEMS[0].image,
    back: ITEMS[1].image,
    top: ITEMS[2].image,
    bottom: ITEMS[3].image,
    left: ITEMS[4].image,
    right: ITEMS[5].image
  };

  return (
    <div className="min-h-screen bg-[#1a1147] py-8">
      <div className="container mx-auto px-4">
        {/* 标题部分 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Mystery Box
            </span>
          </h1>
          <p className="text-gray-400">Try your luck and get a rare NFT!</p>
        </div>

        {/* 盒子区域 */}
        <div className="max-w-2xl mx-auto relative">
          {!isSpinning ? (
            // 3D盒子显示
            <div className="flex justify-center mb-8">
              <div 
                ref={boxRef}
                onClick={handleOpenBox}
                className={`relative cursor-pointer transform transition-transform ${
                  isOpening ? 'cursor-not-allowed opacity-70' : 'hover:scale-105'
                }`}
              >
                {/* 3D盒子 */}
                <div className="perspective-container">
                  <motion.section
                    initial={{ rotateX: 0, rotateY: 0 }}
                    animate={isOpening ? {
                      rotateX: 360,
                      rotateY: 360,
                      scale: [1, 1.2, 0],
                      opacity: [1, 1, 0],
                    } : {
                      rotateX: 360,
                      rotateY: 360,
                    }}
                    transition={isOpening ? {
                      duration: 2,
                      ease: "easeInOut",
                    } : {
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="box-3d"
                  >
                    {/* 六个面的展示 */}
                    {Object.entries(faceImages).map(([face, image]) => (
                      <div key={face} className={`box-face ${face}`}>
                        <div className="box-content">
                          <img 
                            src={image} 
                            alt={`Face ${face}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </motion.section>
                </div>
              </div>
            </div>
          ) : (
            // CSGO风格开箱界面
            <div className="relative">
              {/* 滚动展示区 */}
              <div className="relative h-[200px] bg-[#231564]/50 rounded-xl overflow-hidden backdrop-blur-sm border border-[#3d2b85] mb-4">
                {/* 中心指示器 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-500 z-10"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-500 blur-xl z-0"></div>
                
                {/* 滚动容器 */}
                <div className="absolute left-1/2 top-0 bottom-0 flex items-center" style={{ transform: 'translateX(-50%)' }}>
                  <div
                    ref={spinnerRef}
                    className="flex gap-4 transition-transform"
                    style={{ transform: 'translateX(0)' }}
                  >
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="w-[180px] h-[180px] bg-[#1a1147] rounded-lg border border-[#3d2b85] flex flex-col items-center justify-center p-4 flex-shrink-0"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg mb-2"
                        />
                        <h3 className={`text-sm font-bold ${getRarityColor(item.rarity)}`}>
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-400">{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 添加开箱按钮 */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    const spinDuration = 6000;
                    const finalPosition = Math.floor(Math.random() * (items.length - 10)) + 5;

                    if (spinnerRef.current) {
                      spinnerRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(0.15, 0.45, 0.15, 1)`;
                      spinnerRef.current.style.transform = `translateX(-${finalPosition * 200}px)`;
                    }

                    // 等待滚动动画结束
                    setTimeout(() => {
                      setIsSpinning(false);
                      setSelectedItem(items[finalPosition]);
                      setIsOpening(false);
                      setIsKeyAnimating(false);
                    }, spinDuration);
                  }}
                  disabled={isSpinning}
                  className={`
                    px-8 py-3 rounded-xl text-white font-bold
                    ${isSpinning 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transform hover:scale-105 transition-all'
                    }
                    shadow-lg hover:shadow-purple-500/25
                    relative overflow-hidden group
                  `}
                >
                  {/* 按钮内容 */}
                  <span className="relative z-10 flex items-center gap-2">
                    {isSpinning ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Opening...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Open Box
                      </>
                    )}
                  </span>

                  {/* 按钮背景动画 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          )}

          {/* 开箱结果 */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 p-6 bg-[#231564]/50 rounded-xl backdrop-blur-sm border border-[#3d2b85]"
              >
                <h2 className="text-2xl font-bold text-center mb-4 text-white">
                  You got:
                </h2>
                <div className="flex items-center justify-center gap-6">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className={`text-xl font-bold ${getRarityColor(selectedItem.rarity)}`}>
                      {selectedItem.name}
                    </h3>
                    <p className="text-gray-400">{selectedItem.rarity.toUpperCase()}</p>
                    <p className="text-purple-400 font-bold">{selectedItem.price}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 添加钥匙 */}
        <motion.div
          ref={keyRef}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 cursor-pointer z-50"
          animate={isKeyAnimating ? {
            y: [-100, -350],
            x: [0, 0],
            rotate: [0, 0],
            scale: [1, 0.5],
          } : {
            y: 0,
            x: 0,
            rotate: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
          }}
          onAnimationComplete={() => {
            if (isKeyAnimating) {
              setTimeout(() => {
                handleOpenBox();
              }, 300);
            }
          }}
          onClick={handleKeyClick}
        >
          <div className={`key-container ${isKeyAnimating ? 'animating' : ''}`}>
            <div className="key-head" />
            <div className="key-shaft" />
            <div className="key-teeth" />
            <div className="key-glow" />
          </div>
        </motion.div>
      </div>

      {/* 3D盒子样式 */}
      <style jsx global>{`
        .perspective-container {
          perspective: 1000px;
          width: 200px;
          height: 200px;
          margin: 0 auto;
        }

        .box-3d {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          cursor: pointer;
        }

        .box-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          transition: all 1s;
        }

        .box-content {
          width: 100%;
          height: 100%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
        }

        .front { transform: translateZ(100px); }
        .back { transform: rotateX(-180deg) translateZ(100px); }
        .top { transform: rotateX(90deg) translateZ(100px); }
        .bottom { transform: rotateX(-90deg) translateZ(100px); }
        .left { transform: rotateY(-90deg) translateZ(100px); }
        .right { transform: rotateY(90deg) translateZ(100px); }

        .box-3d:hover .front { transform: translateZ(250px); }
        .box-3d:hover .back { transform: rotateX(-180deg) translateZ(250px); }
        .box-3d:hover .top { transform: rotateX(90deg) translateZ(250px); }
        .box-3d:hover .bottom { transform: rotateX(-90deg) translateZ(250px); }
        .box-3d:hover .left { transform: rotateY(-90deg) translateZ(250px); }
        .box-3d:hover .right { transform: rotateY(90deg) translateZ(250px); }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px) rotate(-5deg); }
          75% { transform: translateX(10px) rotate(5deg); }
        }

        .key-container {
          position: relative;
          width: 50px;
          height: 80px;
          cursor: pointer;
          filter: drop-shadow(0 0 10px rgba(180, 180, 255, 0.5));
        }

        .key-head {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8e8e8, #b8b8b8);
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 
            inset -2px -2px 4px rgba(0, 0, 0, 0.2),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8);
        }

        .key-shaft {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 40px;
          background: linear-gradient(135deg, #e8e8e8, #b8b8b8);
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 
            inset -2px -2px 4px rgba(0, 0, 0, 0.2),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8);
        }

        .key-teeth {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #e8e8e8, #b8b8b8);
          clip-path: polygon(
            0 0,
            20% 0,
            20% 40%,
            40% 40%,
            40% 0,
            60% 0,
            60% 40%,
            80% 40%,
            80% 0,
            100% 0,
            100% 100%,
            0 100%
          );
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 
            inset -2px -2px 4px rgba(0, 0, 0, 0.2),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8);
        }

        /* 添加紫色光效 */
        .key-glow {
          position: absolute;
          inset: -5px;
          background: radial-gradient(
            circle at center,
            rgba(168, 85, 247, 0.4),
            transparent 70%
          );
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .key-container.animating .key-glow {
          opacity: 1;
        }

        @keyframes keyFloat {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-8px); 
          }
        }

        .key-container {
          animation: keyFloat 3s ease-in-out infinite;
        }

        .key-container.animating {
          animation: none;
        }
      `}</style>
    </div>
  );
};

export default BlindBox; 