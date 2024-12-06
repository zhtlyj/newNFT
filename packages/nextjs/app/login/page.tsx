
'use client'; 
import { useEffect } from 'react';
import Head from 'next/head';


const generateStars = (wH: number, wW: number, n: number) => {
  for (let i = 0; i < n; i++) {
    const div = document.createElement('div');
    div.className = i % 20 === 0 ? 'star star--big' : i % 9 === 0 ? 'star star--medium' : 'star';
    // random everywhere!
    div.setAttribute('style', `top:${Math.round(Math.random() * wH)}px;left:${Math.round(Math.random() * wW)}px;animation-duration:${Math.round(Math.random() * 3000) + 3000}ms;animation-delay:${Math.round(Math.random() * 3000)}ms;`);
    document.body.appendChild(div);
  }
};

export default function Home() {
  useEffect(() => {
    const wH = window.innerHeight;
    const wW = window.innerWidth;
    generateStars(wH, wW, 150);
  }, []);

  return (
    <>
      <Head>
        <title>宇航员登录页面</title>
      </Head>
      <div className="moon">
        <div className="crater"></div>
      </div>
      <div className="footprints">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="astronaut">
        <div className="backpack"></div>
        <div className="head">
          <div className="helmet"></div>
        </div>
        <div className="neck"></div>
        <div className="body"></div>
        <div className="arm right">
          <div className="top"></div>
          <div className="bot"></div>
          <div className="hand"></div>
        </div>
        <div className="arm left">
          <div className="top"></div>
          <div className="bot"></div>
          <div className="hand"></div>
        </div>
        <div className="leg right">
          <div className="top"></div>
          <div className="bot"></div>
          <div className="foot"></div>
        </div>
        <div className="leg left">
          <div className="top"></div>
          <div className="bot"></div>
          <div className="foot"></div>
        </div>
      </div>
      <div className="star comet"></div>
      <form className="box" action="/" method="post">
        <h1>登录</h1>
        <input type="text" name="" placeholder="用户名" />
        <input type="password" name="" placeholder="密码" />
        <input type="submit" name="" value="登录" />
      </form>
    </>
  );
}
