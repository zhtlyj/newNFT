"use client";

import { useState, useRef, useEffect } from "react";

interface PixelNftProps {
  originalImage: File | null;
  onPixelated: (pixelatedDataUrl: string) => void;
}

export const PixelNft: React.FC<PixelNftProps> = ({ originalImage, onPixelated }) => {
  const [pixelatedImage, setPixelatedImage] = useState<string | null>(null);
  const [blockSize, setBlockSize] = useState<number>(8);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const [autoBlockSize, setAutoBlockSize] = useState<boolean>(true);
  const [brightness, setBrightness] = useState<number>(0.5);
  const [saturation, setSaturation] = useState<number>(0.3);
  const [depth, setDepth] = useState<number>(0.2);

  // 优化的方块颜色处理函数
  const createBlockColors = (r: number, g: number, b: number, brightness: number) => {
    // 增强色彩饱和度和对比度
    const saturate = (color: number[], factor: number = saturation) => {
      const avg = (color[0] + color[1] + color[2]) / 3;
      return color.map(c => {
        const saturated = Math.min(255, Math.max(0, c + (c - avg) * factor));
        return Math.round(saturated);
      });
    };

    // HSL调整函数
    const adjustHSL = (color: number[], lightness: number) => {
      const r = color[0] / 255;
      const g = color[1] / 255;
      const b = color[2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = max === r
          ? (g - b) / d + (g < b ? 6 : 0)
          : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
        h /= 6;
      }

      // 调整亮度
      l = Math.max(0, Math.min(1, l + lightness));

      // 转回RGB
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      return [
        Math.round(hue2rgb(p, q, h + 1/3) * 255),
        Math.round(hue2rgb(p, q, h) * 255),
        Math.round(hue2rgb(p, q, h - 1/3) * 255)
      ];
    };

    // 主色调整
    const mainColor = saturate([r, g, b]);
    
    // 动态光照因子
    const topLightFactor = 0.25 + (brightness * 0.2);
    const sideDarkFactor = -0.2 - (brightness * 0.1);
    const bottomDarkFactor = -0.3 - (brightness * 0.15);
    
    // 计算各个面的颜色
    const topColor = adjustHSL(mainColor, topLightFactor);
    const frontColor = mainColor;
    const rightColor = adjustHSL(mainColor, sideDarkFactor);
    const bottomColor = adjustHSL(mainColor, bottomDarkFactor);
    const highlightColor = adjustHSL(mainColor, 0.3);

    return [frontColor, topColor, rightColor, bottomColor, highlightColor];
  };

  // 添加 Sobel 边缘检测
  const applySobelFilter = (data: Uint8ClampedArray, width: number, height: number) => {
    const output = new Uint8ClampedArray(width * height);
    const kernelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const kernelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let pixelX = 0;
        let pixelY = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            pixelX += gray * kernelX[(ky + 1) * 3 + (kx + 1)];
            pixelY += gray * kernelY[(ky + 1) * 3 + (kx + 1)];
          }
        }

        const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
        output[y * width + x] = magnitude;
      }
    }
    return output;
  };

  // 添加颜色差异计算函数
  const getColorDifference = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
    // 使用 CIE76 色差公式
    const rmean = (r1 + r2) / 2;
    const r = r1 - r2;
    const g = g1 - g2;
    const b = b1 - b2;
    return Math.sqrt((2 + rmean/256) * r * r + 4 * g * g + (2 + (255-rmean)/256) * b * b);
  };

  // 添加图像分析函数
  const analyzeImage = (imageData: ImageData, width: number, height: number) => {
    const data = imageData.data;
    let complexity = 0;
    let edgeCount = 0;
    let detailLevel = 0;

    // 计算图像复杂度
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const prevIdx = (y * width + (x - 1)) * 4;
        const nextIdx = (y * width + (x + 1)) * 4;

        // 计算颜色差异
        const diffX = Math.abs(data[idx] - data[prevIdx]) +
                     Math.abs(data[idx + 1] - data[prevIdx + 1]) +
                     Math.abs(data[idx + 2] - data[prevIdx + 2]);
        
        const diffY = Math.abs(data[idx] - data[nextIdx]) +
                     Math.abs(data[idx + 1] - data[nextIdx + 1]) +
                     Math.abs(data[idx + 2] - data[nextIdx + 2]);

        if (diffX > 30 || diffY > 30) {
          edgeCount++;
        }

        complexity += diffX + diffY;
      }
    }

    // 归一化复杂度
    complexity = complexity / (width * height);
    const edgeDensity = edgeCount / (width * height);
    
    // 计算细节水平
    detailLevel = (complexity * 0.6 + edgeDensity * 0.4) * 100;

    return { complexity, edgeDensity, detailLevel };
  };

  // 计算最佳方块大小
  const calculateOptimalBlockSize = (
    width: number, 
    height: number, 
    detailLevel: number,
    maskData?: Uint8ClampedArray
  ) => {
    // 基础大小范围
    const minSize = 4;
    const maxSize = 16;

    // 计算图像主体区域大小
    let subjectSize = 1;
    if (maskData) {
      let maskArea = 0;
      for (let i = 0; i < maskData.length; i += 4) {
        if (maskData[i + 3] > 128) {
          maskArea++;
        }
      }
      subjectSize = Math.sqrt(maskArea) / Math.sqrt(width * height);
    }

    // 根据图像大小计算基础方块大小
    const baseSizeByDimension = Math.max(
      minSize,
      Math.min(maxSize, Math.floor(Math.min(width, height) / 32))
    );

    // 根据细节水平调整方块大小
    const detailFactor = Math.max(0.5, Math.min(2, (100 - detailLevel) / 50));
    
    // 根据主体大小调整
    const subjectFactor = Math.max(0.8, Math.min(1.2, 1 / subjectSize));

    // 计算最终方块大小
    let optimalSize = Math.round(baseSizeByDimension * detailFactor * subjectFactor);
    
    // 确保在有效范围内
    optimalSize = Math.max(minSize, Math.min(maxSize, optimalSize));

    // 确保是偶数
    optimalSize = Math.floor(optimalSize / 2) * 2;

    return optimalSize;
  };

  // 优化的图像分割函数
  const createImageMask = async (imageData: ImageData, width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const data = imageData.data;
    const mask = new Uint8ClampedArray(width * height * 4);
    
    // 1. 计算图像统计信息
    let totalBrightness = 0;
    let brightnessVariance = 0;
    const brightnessList: number[] = [];

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      totalBrightness += brightness;
      brightnessList.push(brightness);
    }

    const avgBrightness = totalBrightness / (width * height);
    brightnessVariance = brightnessList.reduce((acc, val) => 
      acc + Math.pow(val - avgBrightness, 2), 0) / brightnessList.length;

    // 2. 创建多层次能量图
    const createEnergyMap = () => {
      const energyMap = new Float32Array(width * height);
      const centerX = width / 2;
      const centerY = height / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

      // Sobel 边缘检测
      const edges = applySobelFilter(data, width, height);
      
      // 计算局部对比度
      const contrastMap = new Float32Array(width * height);
      const radius = 2;
      
      for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
          const centerIdx = (y * width + x) * 4;
          let maxDiff = 0;
          
          // 计算局部最大颜色差异
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              if (dx === 0 && dy === 0) continue;
              
              const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
              const diff = getColorDifference(
                data[centerIdx], data[centerIdx + 1], data[centerIdx + 2],
                data[neighborIdx], data[neighborIdx + 1], data[neighborIdx + 2]
              );
              maxDiff = Math.max(maxDiff, diff);
            }
          }
          contrastMap[y * width + x] = maxDiff / 255;
        }
      }

      // 组合所有特征
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          const idx = i * 4;

          // 距离权重（使用高斯函数）
          const distanceToCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          const distanceWeight = Math.exp(-distanceToCenter / (maxDistance * 0.5));

          // 颜色显著性
          const brightness = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
          const colorWeight = Math.abs(brightness - avgBrightness) / Math.sqrt(brightnessVariance);

          // 边缘强度
          const edgeStrength = edges[i] / 255;

          // 局部对比度
          const contrast = contrastMap[i];

          // 组合所有特征
          energyMap[i] = (
            edgeStrength * 0.3 +     // 边缘权重
            distanceWeight * 0.25 +   // 距离权重
            colorWeight * 0.25 +      // 颜色权重
            contrast * 0.2           // 对比度权重
          );
        }
      }
      return energyMap;
    };

    const energyMap = createEnergyMap();

    // 3. 改进的区域生长算法
    const visited = new Set<number>();
    const queue: [number, number][] = []; // [index, priority]
    const threshold = 0.25; // 降低阈值以包含更多相关区域

    // 从中心区域开始
    const centerRegion = new Set<number>();
    const centerRadius = Math.min(width, height) * 0.2;
    const startPoint = Math.floor(height/2) * width + Math.floor(width/2);

    for (let y = height/2 - centerRadius; y < height/2 + centerRadius; y++) {
      for (let x = width/2 - centerRadius; x < width/2 + centerRadius; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = Math.floor(y) * width + Math.floor(x);
          if (energyMap[idx] > threshold) {
            centerRegion.add(idx);
            queue.push([idx, energyMap[idx]]);
            visited.add(idx);
          }
        }
      }
    }

    // 优先队列处理
    queue.sort((a, b) => b[1] - a[1]);

    while (queue.length > 0) {
      const [current, _] = queue.shift()!;
      const x = current % width;
      const y = Math.floor(current / width);

      // 检查8个方向的相邻像素
      const neighbors = [
        [x-1, y], [x+1, y], [x, y-1], [x, y+1],
        [x-1, y-1], [x+1, y-1], [x-1, y+1], [x+1, y+1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborIdx = ny * width + nx;
          if (!visited.has(neighborIdx)) {
            const neighborEnergy = energyMap[neighborIdx];
            if (neighborEnergy > threshold) {
              queue.push([neighborIdx, neighborEnergy]);
              visited.add(neighborIdx);
            }
          }
        }
      }
    }

    // 4. 创建平滑的遮罩
    const smoothRadius = 3;
    const smoothMask = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        let sum = 0;
        let count = 0;

        for (let sy = -smoothRadius; sy <= smoothRadius; sy++) {
          for (let sx = -smoothRadius; sx <= smoothRadius; sx++) {
            const nx = x + sx;
            const ny = y + sy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = ny * width + nx;
              sum += visited.has(ni) ? 1 : 0;
              count++;
            }
          }
        }

        const alpha = (sum / count) * 255;
        smoothMask[i] = data[i];
        smoothMask[i + 1] = data[i + 1];
        smoothMask[i + 2] = data[i + 2];
        smoothMask[i + 3] = alpha;
      }
    }

    ctx.putImageData(new ImageData(smoothMask, width, height), 0, 0);
    return canvas;
  };

  // 添加像素绘制函数
  const drawPixel = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    colors: number[][],
    isEdge: boolean = false,
    customDepth: number = depth
  ) => {
    const [frontColor, topColor, rightColor, bottomColor, highlightColor] = colors;
    const padding = size * 0.05;
    const actualSize = size - padding;

    // 使用传入的 customDepth
    const depthOffset = actualSize * customDepth;
    const px = x + padding/2;
    const py = y + padding/2;

    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(px + depthOffset, py + actualSize);
    ctx.lineTo(px + actualSize + depthOffset, py + actualSize);
    ctx.lineTo(px + actualSize + depthOffset, py + actualSize + depthOffset);
    ctx.lineTo(px + depthOffset, py + actualSize + depthOffset);
    ctx.closePath();
    ctx.fill();

    // 绘制底部面
    ctx.fillStyle = `rgb(${bottomColor.join(',')})`;
    ctx.beginPath();
    ctx.moveTo(px, py + actualSize);
    ctx.lineTo(px + actualSize, py + actualSize);
    ctx.lineTo(px + actualSize + depthOffset, py + actualSize - depthOffset);
    ctx.lineTo(px + depthOffset, py + actualSize - depthOffset);
    ctx.closePath();
    ctx.fill();

    // 绘制右侧面
    ctx.fillStyle = `rgb(${rightColor.join(',')})`;
    ctx.beginPath();
    ctx.moveTo(px + actualSize, py);
    ctx.lineTo(px + actualSize + depthOffset, py - depthOffset);
    ctx.lineTo(px + actualSize + depthOffset, py + actualSize - depthOffset);
    ctx.lineTo(px + actualSize, py + actualSize);
    ctx.closePath();
    ctx.fill();

    // 绘制主面
    ctx.fillStyle = `rgb(${frontColor.join(',')})`;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + actualSize, py);
    ctx.lineTo(px + actualSize, py + actualSize);
    ctx.lineTo(px, py + actualSize);
    ctx.closePath();
    ctx.fill();

    // 绘制顶部面
    ctx.fillStyle = `rgb(${topColor.join(',')})`;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + depthOffset, py - depthOffset);
    ctx.lineTo(px + actualSize + depthOffset, py - depthOffset);
    ctx.lineTo(px + actualSize, py);
    ctx.closePath();
    ctx.fill();

    // 添加高光效果
    if (isEdge) {
      // 顶部边缘高光
      ctx.strokeStyle = `rgb(${highlightColor.join(',')})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + actualSize, py);
      ctx.stroke();

      // 侧面高光
      ctx.beginPath();
      ctx.moveTo(px + actualSize, py);
      ctx.lineTo(px + actualSize + depthOffset, py - depthOffset);
      ctx.stroke();
    }

    // 添加内部阴影和光泽
    const gradient = ctx.createLinearGradient(px, py, px + actualSize, py + actualSize);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(px + actualSize * 0.15, py + actualSize * 0.15);
    ctx.lineTo(px + actualSize * 0.85, py + actualSize * 0.15);
    ctx.lineTo(px + actualSize * 0.85, py + actualSize * 0.85);
    ctx.lineTo(px + actualSize * 0.15, py + actualSize * 0.85);
    ctx.closePath();
    ctx.fill();
  };

  // 修改像素化处理函数
  const pixelateImage = (imageUrl: string) => {
    if (!canvasRef.current) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = async () => {
      // 调整最大尺寸以适应更小的方块
      const maxSize = 800; // 增加最大尺寸以获得更多细节
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.floor(img.width * scale);
      const height = Math.floor(img.height * scale);

      // 调整画布大小为像素大小的整数倍
      const pixelsWide = Math.floor(width / blockSize);
      const pixelsHigh = Math.floor(height / blockSize);
      canvasRef.current.width = pixelsWide * blockSize;
      canvasRef.current.height = pixelsHigh * blockSize;

      // 创建临时画布
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCanvas.width = width;
      tempCanvas.height = height;
      tempCtx.drawImage(img, 0, 0, width, height);
      
      const imageData = tempCtx.getImageData(0, 0, width, height);
      
      // 分析图像
      const analysis = analyzeImage(imageData, width, height);
      
      // 创建遮罩
      const mask = await createImageMask(imageData, width, height);
      if (!mask) return;
      setMaskCanvas(mask);

      // 获取遮罩数据
      const maskData = mask.getContext('2d')?.getImageData(0, 0, width, height).data;

      // 如果启用了自动方块大小，计算最佳大小
      if (autoBlockSize) {
        const optimalSize = calculateOptimalBlockSize(width, height, analysis.detailLevel, maskData);
        setBlockSize(optimalSize);
      }

      // 清空主画布并绘制原始图像
      tempCtx.clearRect(0, 0, width, height);
      tempCtx.drawImage(img, 0, 0, width, height);

      // 只处理遮罩区域内的像素
      if (!maskData) return;

      // 逐像素处理
      for (let y = 0; y < pixelsHigh; y++) {
        for (let x = 0; x < pixelsWide; x++) {
          // 检查该区域是否在遮罩内
          let maskSum = 0;
          for (let py = 0; py < blockSize; py++) {
            for (let px = 0; px < blockSize; px++) {
              const pixelX = x * blockSize + px;
              const pixelY = y * blockSize + py;
              const i = (pixelY * width + pixelX) * 4;
              if (i < maskData.length) {
                maskSum += maskData[i + 3];
              }
            }
          }

          // 只处理遮罩区域内的像素
          if (maskSum > (blockSize * blockSize * 255 * 0.5)) {
            let r = 0, g = 0, b = 0;
            let brightness = 0;
            let edgeCount = 0;
            let count = 0;

            // 计算区域平均颜色和亮度
            for (let py = 0; py < blockSize; py++) {
              for (let px = 0; px < blockSize; px++) {
                const pixelX = x * blockSize + px;
                const pixelY = y * blockSize + py;
                const i = (pixelY * width + pixelX) * 4;
                if (i < imageData.data.length) {
                  r += imageData.data[i];
                  g += imageData.data[i + 1];
                  b += imageData.data[i + 2];
                  brightness += (imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114) / 255;
                  if (maskData[i + 3] > 0) {
                    edgeCount++;
                  }
                  count++;
                }
              }
            }

            if (count > 0) {
              r = Math.round(r / count);
              g = Math.round(g / count);
              b = Math.round(b / count);
              brightness = brightness / count;

              // 使用当前的控制参数创建方块颜色
              const colors = createBlockColors(r, g, b, brightness);
              const isEdge = edgeCount / (blockSize * blockSize) > 0.3;
              
              // 使用组件的 depth 状态
              drawPixel(tempCtx, x * blockSize, y * blockSize, blockSize, colors, isEdge, depth);
            }
          }
        }
      }

      // 处理完成后，通知父组件
      const pixelatedDataUrl = tempCanvas.toDataURL('image/png');
      setPixelatedImage(pixelatedDataUrl);
      onPixelated(pixelatedDataUrl);
    };
  };

  useEffect(() => {
    if (originalImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        pixelateImage(imageUrl);
      };
      reader.readAsDataURL(originalImage);
    }
  }, [originalImage, blockSize, brightness, saturation, depth]);

  return (
    <div className="pixel-nft-container">
      <div className="controls space-y-4">
        <div>
          <label className="control-label">
            <input
              type="checkbox"
              checked={autoBlockSize}
              onChange={(e) => setAutoBlockSize(e.target.checked)}
            />
            自动方块大小
          </label>
          
          {!autoBlockSize && (
            <div className="mt-2">
              <label className="block text-sm text-gray-400 mb-1">方块大小: {blockSize}px</label>
              <input
                type="range"
                min="4"
                max="16"
                value={blockSize}
                onChange={(e) => setBlockSize(Number(e.target.value))}
                className="slider w-full"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">亮度: {Math.round(brightness * 100)}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness * 100}
            onChange={(e) => setBrightness(Number(e.target.value) / 100)}
            className="slider w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">饱和度: {Math.round(saturation * 100)}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={saturation * 100}
            onChange={(e) => setSaturation(Number(e.target.value) / 100)}
            className="slider w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">深度: {Math.round(depth * 100)}%</label>
          <input
            type="range"
            min="10"
            max="40"
            value={depth * 100}
            onChange={(e) => setDepth(Number(e.target.value) / 100)}
            className="slider w-full"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              setBrightness(0.5);
              setSaturation(0.3);
              setDepth(0.2);
              setBlockSize(8);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
          >
            重置参数
          </button>
        </div>
      </div>

      {pixelatedImage && (
        <div className="preview mt-4">
          <img 
            src={pixelatedImage} 
            alt="Pixelated" 
            className="pixelated-image"
          />
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <style jsx>{`
        .pixel-nft-container {
          width: 100%;
          margin-bottom: 20px;
          background: #231564;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #3d2b85;
        }

        .controls {
          margin-bottom: 15px;
        }

        .control-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
        }

        .slider {
          -webkit-appearance: none;
          height: 4px;
          background: #1a1147;
          border-radius: 2px;
          outline: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #8b5cf6;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          background: #7c3aed;
        }

        .preview {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #3d2b85;
        }

        .pixelated-image {
          width: 100%;
          height: auto;
          image-rendering: pixelated;
        }
      `}</style>
    </div>
  );
};
