import Image from "next/image";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-[90%] md:w-[75%]">
        <h1 className="text-center mb-16 text-4xl font-bold text-gray-900">
          TP_NFT
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center justify-center hover:scale-105 transform transition-transform duration-300">
            <div className="relative w-72 h-72 overflow-hidden rounded-xl border-4 border-gray-300">
              <Image
                src="/3.avif"
                layout="fill"
                objectFit="cover"
                alt="challenge banner"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white text-center rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs">作者：22</p>
                <p className="text-xs">拥有者：33</p>
                <p className="text-xs">版权信息：版权所有，未经授权禁止转载</p>
              </div>
            </div>
            <p className="text-center text-lg mt-8 text-gray-700">
              🐰《暴力兔》NFT系列是一组极具个性和独特魅力的数字艺术作品，每一只暴兔都散发着强大的能量和狂野的气息，为数字艺术界带来了全新的视觉体验。 🎨✨
            </p>
          </div>
          <div className="flex flex-col items-center justify-center hover:scale-105 transform transition-transform duration-300">
            <div className="relative w-72 h-72 overflow-hidden rounded-xl border-4 border-gray-300">
              <Image
                src="/1.avif"
                layout="fill"
                objectFit="cover"
                alt="challenge banner"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white text-center rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs">作者：郑逸</p>
                <p className="text-xs">拥有者：罗宇杰</p>
                <p className="text-xs">版权信息：版权所有，未经授权禁止转载</p>
              </div>
            </div>
            <p className="text-center text-lg mt-8 text-gray-700">
              🌹每一幅《暴力娘》NFT都是艺术家精心打造的独一无二的作品，通过数字化手段展现了强烈的原始女性力量和自然美感，成为数字艺术市场的热门收藏品之一。 🌺🌿
            </p>
          </div>
          <div className="flex flex-col items-center justify-center hover:scale-105 transform transition-transform duration-300">
            <div className="relative w-72 h-72 overflow-hidden rounded-xl border-4 border-gray-300">
              <Image
                src="/9.avif"
                layout="fill"
                objectFit="cover"
                alt="challenge banner"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white text-center rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs">作者：44</p>
                <p className="text-xs">拥有者：55</p>
                <p className="text-xs">版权信息：版权所有，未经授权禁止转载</p>
              </div>
            </div>
            <p className="text-center text-lg mt-8 text-gray-700">
              🖼️欣赏《暴力狼》NFT就像是探索一个神秘的世界，每一只暴狼都有着自己独特的个性和故事，让人不由得沉浸其中，感受到数字艺术带来的无限魅力。🔍🌀
            </p>
          </div>
          <div className="flex flex-col items-center justify-center hover:scale-105 transform transition-transform duration-300">
            <div className="relative w-72 h-72 overflow-hidden rounded-xl border-4 border-gray-300">
              <Image
                src="/11.avif"
                layout="fill"
                objectFit="cover"
                alt="challenge banner"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white text-center rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs">作者：666</p>
                <p className="text-xs">拥有者：777</p>
                <p className="text-xs">版权信息：版权所有，未经授权禁止转载</p>
              </div>
            </div>
            <p className="text-center text-lg mt-8 text-gray-700">
              🎭《暴力狂》NFT融合了数字技术和艺术创作的独特魅力，为观众带来极具视觉效果和深刻内涵的内容吸引力。每一幅暴力狂NFT都是独一无二的艺术品，值得收藏和欣赏。 💥🖌️
            </p>
          </div>
          <div className="flex flex-col items-center justify-center hover:scale-105 transform transition-transform duration-300">
            <div className="relative w-72 h-72 overflow-hidden rounded-xl border-4 border-gray-300">
              <Image
                src="/24.webp"
                layout="fill"
                objectFit="cover"
                alt="challenge banner"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white text-center rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs">作者：333</p>
                <p className="text-xs">拥有者：3333</p>
                <p className="text-xs">版权信息：版权所有，未经授权禁止转载</p>
              </div>
            </div>
            <p className="text-center text-lg mt-8 text-gray-700">
              🌀《暴力环》NFT将科技与艺术完美融合，通过炫目的视觉效果和神秘的色彩组合，展现了独特的未来感和无限可能，吸引了大量的收藏家和艺术爱好者。✨🌌
            </p>
          </div>
          <div className="flex flex-col items-center justify-center hover:scale-105 transform transition-transform duration-300">
            <div className="relative w-72 h-72 overflow-hidden rounded-xl border-4 border-gray-300">
              <Image
                src="/27.avif"
                layout="fill"
                objectFit="cover"
                alt="challenge banner"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white text-center rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs">作者：222</p>
                <p className="text-xs">拥有者：222</p>
                <p className="text-xs">版权信息：版权所有，未经授权禁止转载</p>
              </div>
            </div>
            <p className="text-center text-lg mt-8 text-gray-700">
              🌟《暴力武士》NFT代表着数字艺术的未来发展方向，以其独特的艺术风格和创新的数字技术，为喜欢创意和冒险的收藏家提供了一个绝佳的投资机会。⚔️🛡️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
