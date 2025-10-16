import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { GoogleIcon } from '../icons';

const HeroSection: React.FC = () => {
  const { login, theme } = useStore(state => ({
    login: state.login,
    theme: state.theme,
  }));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const isDark = theme === 'dark';
    const particleColor = isDark ? 'hsl(0 0% 98% / 1)' : 'hsl(240 10% 3.9% / 0.7)';
    const lineColor = isDark ? '0, 0%, 98%' : '240, 10%, 3.9%';

    const particles: { x: number; y: number; size: number; speedX: number; speedY: number }[] = [];
    const particleCount = 75; // Increased from 50

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 0.4 - 0.2,
        speedY: Math.random() * 0.4 - 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.speedX;
        p1.y += p1.speedY;

        if (p1.x > canvas.width || p1.x < 0) p1.speedX *= -1;
        if (p1.y > canvas.height || p1.y < 0) p1.speedY *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 160) { // Increased from 150
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${lineColor}, ${1 - dist / 160})`;
            ctx.lineWidth = 0.7; // Increased from 0.5
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  return (
    <section className="relative flex items-center justify-center w-full h-screen text-center">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/50 via-background to-background" />

      <div className="relative z-10 max-w-4xl px-4 mx-auto">
        <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl flex flex-wrap items-center justify-center gap-x-2 md:gap-x-4"
            style={{ textShadow: '0 0 20px hsl(var(--ring) / 0.3)' }}>
          <span>From</span>
          <span className="idea-gradient-text">Idea</span>
          <span>to Actionable Blueprint.</span>
        </h1>
        <p className="max-w-2xl mx-auto mt-6 text-lg text-muted-foreground md:text-xl">
          Vynixel is your AI co-founder, transforming scattered thoughts into a structured, validated, and complete startup plan on an infinite visual canvas.
        </p>
        <div className="mt-10">
          <button
            onClick={login}
            className="inline-flex items-center justify-center px-8 py-4 space-x-3 text-lg font-semibold text-primary-foreground transition-all duration-300 transform rounded-lg shadow-2xl bg-primary hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background animate-pulse-glow"
          >
            <GoogleIcon className="w-6 h-6" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px hsl(var(--ring) / 0.4);
          }
          50% {
            box-shadow: 0 0 35px hsl(var(--ring) / 0.7);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s infinite ease-in-out;
        }

        .idea-gradient-text {
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          background-size: 300% 300%;
          animation: gradient-anim 10s ease infinite;
          /* Light theme gradient */
          background-image: linear-gradient(
            160deg,
            hsl(210, 80%, 50%),
            hsl(280, 85%, 55%),
            hsl(340, 90%, 60%),
            hsl(40, 95%, 50%),
            hsl(140, 80%, 45%),
            hsl(210, 80%, 50%)
          );
        }
            
        /* Dark theme gradient override */
        .dark .idea-gradient-text {
          background-image: linear-gradient(
            160deg,
            hsl(210, 100%, 80%),
            hsl(280, 100%, 85%),
            hsl(340, 100%, 88%),
            hsl(40, 100%, 75%),
            hsl(140, 100%, 80%),
            hsl(210, 100%, 80%)
          );
        }

        @keyframes gradient-anim {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;