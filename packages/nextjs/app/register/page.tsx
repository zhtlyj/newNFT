
'use client'; 
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  
  useEffect(() => {
    const wH = window.innerHeight;
    const wW = window.innerWidth;
    generateStars(wH, wW, 150);
  }, []);

  const [form, setForm] = useState({
    username: '',
    password: '',
    email: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          email: form.email,
          type: 'user'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('注册成功！');
        setForm({ username: '', password: '', email: '' });
        
        // 延迟跳转到登录页面
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setError(data.message || '注册失败，请重试');
      }
    } catch (error) {
      console.error('注册错误:', error);
      setError('服务器错误，请稍后重试');
    }
  };

  return (
    <>
      <Head>
        <title>宇航员注册页面</title>
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

      {/* Registration form */}
      <form className="box" onSubmit={handleSubmit}>
        <h1>注册</h1>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <input 
          type="text" 
          name="username" 
          value={form.username} 
          onChange={handleChange} 
          placeholder="用户名" 
          required
        />
        <input 
          type="password" 
          name="password" 
          value={form.password} 
          onChange={handleChange} 
          placeholder="密码" 
          required
        />
        <input 
          type="password" 
          name="email" 
          value={form.email} 
          onChange={handleChange} 
          placeholder="电子邮箱" 
          required
        />
        <input type="submit" value="注册" />
      </form>
    </>
  );
}

