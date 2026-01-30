import React, { useEffect, useRef } from 'react';
import { ConfigProvider, Layout, Menu, theme } from 'antd';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import ImportPage from './pages/ImportPage';
import RssImportPage from './pages/RssImportPage';
import ChatPage from './pages/ChatPage';
import CreateArticlePage from './pages/CreateArticlePage';

const { Header, Content, Footer } = Layout;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
};

const App: React.FC = () => {
  const location = useLocation();
  const { defaultAlgorithm, darkAlgorithm } = theme;
  const particlesRef = useRef<HTMLCanvasElement | null>(null);

  const selectedKey =
    location.pathname.startsWith('/search') ? '/search' :
      location.pathname.startsWith('/import') ? '/import' :
        location.pathname.startsWith('/rss') ? '/rss' :
          location.pathname.startsWith('/chat') ? '/chat' :
            location.pathname.startsWith('/create') ? '/create' : '/';

  useEffect(() => {
    const root = document.documentElement;
    let rafId = 0;
    let lastX = window.innerWidth / 2;
    let lastY = window.innerHeight / 2;

    const applyPointer = () => {
      root.style.setProperty('--pointer-x', `${lastX}px`);
      root.style.setProperty('--pointer-y', `${lastY}px`);
      rafId = 0;
    };

    const onMove = (event: MouseEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(applyPointer);
      }
    };

    applyPointer();
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = particlesRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let rafId = 0;

    const colors = [
      '0,201,167',
      '54,168,255',
      '0,229,196'
    ];

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(90, Math.max(36, Math.floor((width * height) / 28000)));
      particles = new Array(count).fill(null).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.8 + 0.6,
        a: Math.random() * 0.45 + 0.18
      }));
    };

    const drawParticle = (p: Particle, i: number) => {
      const color = colors[i % colors.length];
      ctx.beginPath();
      ctx.fillStyle = `rgba(${color}, ${p.a})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        drawParticle(p, i);
      }

      rafId = window.requestAnimationFrame(step);
    };

    resize();
    window.addEventListener('resize', resize);
    rafId = window.requestAnimationFrame(step);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: [darkAlgorithm, defaultAlgorithm],
        token: {
          colorPrimary: '#00C9A7',
          colorInfo: '#36A8FF',
          borderRadius: 12,
          wireframe: false,
          fontSize: 15,
          fontFamily: '"DM Sans", "SF Pro Display", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
        },
        components: {
          Layout: {
            headerBg: 'rgba(5, 10, 14, 0.88)',
            bodyBg: 'transparent',
            footerBg: 'transparent'
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(0, 201, 167, 0.15)',
            darkItemSelectedColor: '#f0f8ff',
            darkItemColor: '#5a7a8c'
          },
          Card: {
            borderRadiusLG: 20
          },
          Tabs: {
            inkBarColor: '#00C9A7'
          }
        }
      }}
    >
      <div className="bg-layer bg-aurora" />
      <div className="bg-layer bg-stars" />
      <canvas ref={particlesRef} className="bg-layer bg-particles" />
      <div className="bg-layer bg-grid" />
      <div className="bg-layer bg-glow" />
      <div className="bg-layer bg-pointer" />
      <div className="bg-layer bg-scanlines" />
      <div className="bg-layer bg-noise" />

      <Layout className="app-shell">
        <Header className="app-header">
          <div className="app-brand">
            <span className="brand-dot" />
            个人科技圈博客
          </div>
          <Menu
            className="app-menu"
            theme="dark"
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={[
              { key: '/', label: <Link to="/">首页</Link> },
              { key: '/search', label: <Link to="/search">知识检索</Link> },
              { key: '/import', label: <Link to="/import">文档导入</Link> },
              { key: '/rss', label: <Link to="/rss">RSS导入</Link> },
              { key: '/chat', label: <Link to="/chat">知识对话</Link> },
              { key: '/create', label: <Link to="/create">创建博客</Link> }
            ]}
          />
        </Header>
        <Content className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/rss" element={<RssImportPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/create" element={<CreateArticlePage />} />
          </Routes>
        </Content>
        <Footer className="app-footer">
          Personal AI Blog © 2026
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
