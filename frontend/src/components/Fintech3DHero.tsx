import React, { useState, useRef, useEffect } from 'react';
import { Zap, Smartphone, CheckCircle2 } from 'lucide-react';

export const Fintech3DHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotate, setRotate] = useState({ x: 8, y: -12 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic 3D Particle Constellation on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? '#0066FF' : '#6851FF',
      alpha: Math.random() * 0.5 + 0.2
    }));

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw 3D Isometric Cyber Grid Perspective in background
      ctx.strokeStyle = 'rgba(0, 102, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw rotating central 3D orbital rings
      angle += 0.008;
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      // Outer Orbital Ellipse
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.35, height * 0.22, Math.PI / 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 102, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.stroke();

      // Inner Counter-Rotating Ring
      ctx.rotate(-angle * 1.8);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.22, height * 0.14, -Math.PI / 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(104, 81, 255, 0.2)';
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();

      // Connect particle nodes
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.globalAlpha = p1.alpha;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(0, 102, 255, 0.12)';
            ctx.lineWidth = 1 - dist / 90;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Handle 3D Mouse Parallax Tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -16;
    const rotY = ((x - centerX) / centerX) * 18;

    setRotate({ x: rotX, y: rotY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.6
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 8, y: -12 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[460px] sm:h-[500px] flex items-center justify-center select-none overflow-visible"
      style={{ perspective: '1200px' }}
    >
      {/* Background 3D Canvas with glowing particle constellation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl"
      />

      {/* Floating 3D Background Glow Orb */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#0066FF]/20 via-[#6851FF]/25 to-blue-400/20 blur-3xl -z-10 animate-pulse" />

      {/* Interactive 3D Rotational Canvas Container */}
      <div
        className="relative transition-transform duration-200 ease-out will-change-transform cursor-pointer"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${isHovered ? 1.04 : 1}, ${isHovered ? 1.04 : 1}, 1)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Holographic 3D Metal Card Surface */}
        <div
          className="w-[320px] sm:w-[370px] h-[200px] sm:h-[230px] rounded-3xl p-6 sm:p-7 relative overflow-hidden text-white shadow-2xl border border-white/20 transition-all backdrop-blur-md"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #0047BA 85%, #6851FF 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 102, 255, 0.35), 0 0 35px rgba(104, 81, 255, 0.25)'
          }}
        >
          {/* Dynamic Light Sheen Following Cursor */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)`,
              opacity: glare.opacity
            }}
          />

          {/* Holographic Wave Geometric Lines */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full border border-blue-400/20 pointer-events-none" />
          <div className="absolute -right-16 -bottom-16 w-60 h-60 rounded-full border border-purple-400/20 pointer-events-none" />

          {/* Card Top: Logo & Contactless Wave */}
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#6851FF] flex items-center justify-center font-black text-white text-sm shadow-md">
                P
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">PAYCORE</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-200 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                PLATINUM
              </span>
              <div className="w-6 h-6 flex items-center justify-center text-white/80">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 rotate-90">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M8.5 15.5a6 6 0 0 1 7 0" />
                  <path d="M12 18.5a1 1 0 0 1 0 0" />
                </svg>
              </div>
            </div>
          </div>

          {/* Gold Metallic EMV Microchip */}
          <div className="my-3 sm:my-4 relative z-10 flex items-center gap-3">
            <div className="w-10 h-7 rounded-lg bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-500 border border-amber-400/60 shadow-sm relative overflow-hidden flex items-center justify-center">
              <div className="w-full h-[1px] bg-amber-600/40 absolute" />
              <div className="h-full w-[1px] bg-amber-600/40 absolute" />
              <div className="w-4 h-4 rounded border border-amber-700/30" />
            </div>
            <span className="text-[11px] font-mono text-blue-200/90 tracking-widest font-semibold">
              •••• 8829
            </span>
          </div>

          {/* Card Bottom: Holder Name & Expiry */}
          <div className="flex justify-between items-end relative z-10 pt-1">
            <div>
              <div className="text-[9px] font-mono text-blue-200 uppercase tracking-wider">ENTERPRISE MERCHANT</div>
              <div className="text-xs font-bold text-white tracking-wide">ACME VENTURES INC.</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-mono text-blue-200 uppercase tracking-wider">VALID THRU</div>
              <div className="text-xs font-mono font-bold text-white">12/30</div>
            </div>
          </div>
        </div>

        {/* 3D Floating Badge 1: UPI AutoPay (Pop-out in Z-axis) */}
        <div
          className="absolute -top-6 -left-8 sm:-left-12 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-xl flex items-center gap-3 animate-float pointer-events-none"
          style={{ transform: 'translateZ(55px)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UPI AUTOPAY 2.0</div>
            <div className="text-xs font-black text-slate-900 flex items-center gap-1">
              <span>Mandate Active</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* 3D Floating Badge 2: Instant Payouts Disbursal (Pop-out in Z-axis) */}
        <div
          className="absolute -bottom-6 -right-6 sm:-right-10 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-xl flex items-center gap-3 animate-float pointer-events-none"
          style={{
            transform: 'translateZ(65px)',
            animationDelay: '1.2s'
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-emerald-700 font-bold font-mono">24x7 IMPS DISBURSAL</div>
            <div className="text-xs font-black text-slate-900">₹45,000.00 Settled</div>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold">
            &lt; 2s
          </span>
        </div>

        {/* 3D Floating Pill: Smart Gateway Routing */}
        <div
          className="absolute top-1/2 -right-12 sm:-right-16 -translate-y-1/2 bg-slate-900 text-white rounded-xl px-3 py-1.5 border border-slate-700 shadow-xl flex items-center gap-2 text-[11px] font-mono animate-float pointer-events-none hidden sm:flex"
          style={{
            transform: 'translateZ(45px)',
            animationDelay: '0.6s'
          }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300">Routing: 100% Success</span>
        </div>
      </div>
    </div>
  );
};
