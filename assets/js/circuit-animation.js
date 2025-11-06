/**
 * Circuit Board Particle Flow Animation
 * A minimalistic canvas animation featuring circuit traces and flowing particles
 */

(function() {
  'use strict';

  let canvas, ctx;
  let particles = [];
  let circuits = [];
  let animationId;
  let mouseX = 0;
  let mouseY = 0;

  // Configuration
  const config = {
    particleCount: 60,
    particleSpeed: 0.5,
    particleSize: 2,
    particleColor: '#00d9ff',
    particleGlow: true,
    circuitColor: 'rgba(0, 217, 255, 0.2)',
    circuitLineWidth: 1,
    connectionDistance: 150,
    backgroundColor: '#0a0e17',
    glowIntensity: 10
  };

  // Circuit path class
  class Circuit {
    constructor() {
      this.points = [];
      this.segments = Math.floor(Math.random() * 3) + 2;
      this.orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';

      this.generate();
    }

    generate() {
      const w = canvas.width;
      const h = canvas.height;

      if (this.orientation === 'horizontal') {
        let y = Math.random() * h;
        let x = 0;
        this.points.push({ x, y });

        for (let i = 0; i < this.segments; i++) {
          x += (w / this.segments) + (Math.random() - 0.5) * 100;
          if (Math.random() > 0.7) {
            y += (Math.random() - 0.5) * 100;
          }
          this.points.push({ x, y });
        }
      } else {
        let x = Math.random() * w;
        let y = 0;
        this.points.push({ x, y });

        for (let i = 0; i < this.segments; i++) {
          y += (h / this.segments) + (Math.random() - 0.5) * 100;
          if (Math.random() > 0.7) {
            x += (Math.random() - 0.5) * 100;
          }
          this.points.push({ x, y });
        }
      }
    }

    draw() {
      ctx.strokeStyle = config.circuitColor;
      ctx.lineWidth = config.circuitLineWidth;
      ctx.beginPath();

      for (let i = 0; i < this.points.length; i++) {
        const point = this.points[i];
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }

      ctx.stroke();

      // Draw nodes at circuit points
      this.points.forEach(point => {
        ctx.fillStyle = config.circuitColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Get a point along the circuit path
    getPointOnPath(t) {
      const segmentIndex = Math.floor(t * (this.points.length - 1));
      const nextIndex = Math.min(segmentIndex + 1, this.points.length - 1);
      const segmentT = (t * (this.points.length - 1)) - segmentIndex;

      const p1 = this.points[segmentIndex];
      const p2 = this.points[nextIndex];

      return {
        x: p1.x + (p2.x - p1.x) * segmentT,
        y: p1.y + (p2.y - p1.y) * segmentT
      };
    }
  }

  // Particle class
  class Particle {
    constructor(circuit) {
      this.circuit = circuit;
      this.progress = Math.random();
      this.speed = config.particleSpeed * (0.5 + Math.random() * 0.5);
      this.size = config.particleSize * (0.5 + Math.random());
      this.opacity = 0.5 + Math.random() * 0.5;
    }

    update() {
      this.progress += this.speed / 1000;

      if (this.progress > 1) {
        this.progress = 0;
      }

      const pos = this.circuit.getPointOnPath(this.progress);
      this.x = pos.x;
      this.y = pos.y;
    }

    draw() {
      if (config.particleGlow) {
        ctx.shadowBlur = config.glowIntensity;
        ctx.shadowColor = config.particleColor;
      }

      ctx.fillStyle = config.particleColor;
      ctx.globalAlpha = this.opacity;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  // Initialize canvas
  function initCanvas() {
    const container = document.getElementById('circuit-canvas-container');
    if (!container) return false;

    canvas = document.getElementById('circuit-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'circuit-canvas';
      container.appendChild(canvas);
    }

    ctx = canvas.getContext('2d');
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);

    return true;
  }

  // Resize canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Regenerate circuits on resize
    circuits = [];
    for (let i = 0; i < 8; i++) {
      circuits.push(new Circuit());
    }

    // Reassign circuits to particles
    particles.forEach(particle => {
      particle.circuit = circuits[Math.floor(Math.random() * circuits.length)];
    });
  }

  // Handle mouse movement
  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  // Initialize particles
  function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      const circuit = circuits[Math.floor(Math.random() * circuits.length)];
      particles.push(new Particle(circuit));
    }
  }

  // Animation loop
  function animate() {
    // Clear canvas with background color
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw circuits
    circuits.forEach(circuit => circuit.draw());

    // Update and draw particles
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });

    // Draw connections between nearby particles
    drawConnections();

    animationId = requestAnimationFrame(animate);
  }

  // Draw connections between nearby particles
  function drawConnections() {
    ctx.globalAlpha = 0.15;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.connectionDistance) {
          const opacity = 1 - (distance / config.connectionDistance);
          ctx.strokeStyle = config.particleColor;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = opacity * 0.15;

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
  }

  // Initialize
  function init() {
    if (!initCanvas()) {
      console.warn('Circuit animation container not found');
      return;
    }

    initParticles();
    animate();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
})();
