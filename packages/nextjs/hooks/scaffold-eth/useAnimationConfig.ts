import { useEffect, useState } from "react"; // 导入 React 的钩子函数

const ANIMATION_TIME = 2000; // 动画时间常量，单位为毫秒

/**
 * 自定义钩子，用于管理动画配置
 * @param data 任意类型的数据
 * @returns 包含 showAnimation 状态的对象
 */
export function useAnimationConfig(data: any) {
  const [showAnimation, setShowAnimation] = useState(false); // 定义一个状态变量，用于指示是否显示动画
  const [prevData, setPrevData] = useState(); // 定义一个状态变量，用于存储上一次的数据

  useEffect(() => {
    if (prevData !== undefined && prevData !== data) { // 检查数据是否改变
      setShowAnimation(true); // 数据改变时，设置 showAnimation 为 true，显示动画
      setTimeout(() => setShowAnimation(false), ANIMATION_TIME); // 动画时间结束后，设置 showAnimation 为 false，隐藏动画
    }
    setPrevData(data); // 更新 prevData 为当前数据
  }, [data, prevData]); // 依赖 data 和 prevData

  return {
    showAnimation, // 返回 showAnimation 状态
  };
}
