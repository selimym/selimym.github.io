/**
 * Circuit Board Particle Flow Animation - Realistic PCB Traces
 * Canvas animation featuring realistic circuit board traces with right angles
 */

(function() {
  'use strict';

  let canvas, ctx;
  let particles = [];
  let circuits = [];
  let animationId;

  // Configuration
  const config = {
    particleCount: 50,
    particleSpeed: 0.8,
    particleSize: 2.5,
    particleColor: '#00d9ff',
    particleGlow: true,
    circuitColor: 'rgba(0, 217, 255, 0.25)',
    circuitLineWidth: 2,
    connectionDistance: 120,
    backgroundColor: '#0a0e17',
    glowIntensity: 15
  };

  // Circuit path class with realistic PCB-style traces
  class Circuit {
    constructor() {
      this.points = [];
      this.segments = Math.floor(Math.random() * 4) + 3; // 3-6 segments
      this.generate();
    }

    generate() {
      const w = canvas.width;
      const h = canvas.height;
      const margin = 100;

      // Start from a random edge
      const startEdge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let x, y, direction;

      switch(startEdge) {
        case 0: // top
          x = margin + Math.random() * (w - 2 * margin);
          y = margin;
          direction = 'down';
          break;
        case 1: // right
          x = w - margin;
          y = margin + Math.random() * (h - 2 * margin);
          direction = 'left';
          break;
        case 2: // bottom
          x = margin + Math.random() * (w - 2 * margin);
          y = h - margin;
          direction = 'up';
          break;
        case 3: // left
          x = margin;
          y = margin + Math.random() * (h - 2 * margin);
          direction = 'right';
          break;
      }

      this.points.push({ x, y });

      // Generate path with RIGHT ANGLES ONLY (like real PCB traces)
      for (let i = 0; i < this.segments; i++) {
        const segmentLength = 80 + Math.random() * 150;

        // Move in current direction
        switch(direction) {
          case 'right':
            x += segmentLength;
            break;
          case 'left':
            x -= segmentLength;
            break;
          case 'up':
            y -= segmentLength;
            break;
          case 'down':
            y += segmentLength;
            break;
        }

        // Keep within bounds
        x = Math.max(margin, Math.min(w - margin, x));
        y = Math.max(margin, Math.min(h - margin, y));

        this.points.push({ x, y });

        // Change direction (90 degree turn only)
        if (i < this.segments - 1) {
          const possibleDirections = {
            'right': ['up', 'down'],
            'left': ['up', 'down'],
            'up': ['left', 'right'],
            'down': ['left', 'right']
          };

          const options = possibleDirections[direction];
          direction = options[Math.floor(Math.random() * options.length)];
        }
      }
    }

    draw() {
      // Draw main trace
      ctx.strokeStyle = config.circuitColor;
      ctx.lineWidth = config.circuitLineWidth;
      ctx.lineCap = 'square'; // Square ends like real PCB traces
      ctx.lineJoin = 'miter'; // Sharp corners
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

      // Draw pads/vias at connection points
      this.points.forEach((point, index) => {
        // Start and end get larger pads
        const isTerminal = index === 0 || index === this.points.length - 1;
        const padSize = isTerminal ? 4 : 3;

        ctx.fillStyle = config.circuitColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, padSize, 0, Math.PI * 2);
        ctx.fill();

        // Add outer ring for terminals
        if (isTerminal) {
          ctx.strokeStyle = config.circuitColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(point.x, point.y, padSize + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    // Get a point along the circuit path
    getPointOnPath(t) {
      const totalSegments = this.points.length - 1;
      const segmentIndex = Math.floor(t * totalSegments);
      const nextIndex = Math.min(segmentIndex + 1, this.points.length - 1);
      const segmentT = (t * totalSegments) - segmentIndex;

      const p1 = this.points[segmentIndex];
      const p2 = this.points[nextIndex];

      return {
        x: p1.x + (p2.x - p1.x) * segmentT,
        y: p1.y + (p2.y - p1.y) * segmentT
      };
    }
  }

  // Particle class (electrons flowing through traces)
  class Particle {
    constructor(circuit) {
      this.circuit = circuit;
      this.progress = Math.random();
      this.speed = config.particleSpeed * (0.7 + Math.random() * 0.6);
      this.size = config.particleSize * (0.8 + Math.random() * 0.4);
      this.opacity = 0.6 + Math.random() * 0.4;
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

  // Check if we're on the homepage
  function isHomepage() {
    const hash = window.location.hash;
    return hash === '' || hash === '#/' || hash === '#/home';
  }

  // Initialize canvas
  function initCanvas() {
    if (!isHomepage()) return false;

    let container = document.getElementById('circuit-canvas-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'circuit-canvas-container';
      document.body.appendChild(container);
    }

    canvas = document.getElementById('circuit-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'circuit-canvas';
      container.appendChild(canvas);
    }

    ctx = canvas.getContext('2d');
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    return true;
  }

  // Remove canvas when leaving homepage
  function cleanupCanvas() {
    const container = document.getElementById('circuit-canvas-container');
    if (container) {
      container.remove();
    }
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // Resize canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Regenerate circuits on resize
    circuits = [];
    const numCircuits = Math.min(12, Math.floor((canvas.width + canvas.height) / 150));
    for (let i = 0; i < numCircuits; i++) {
      circuits.push(new Circuit());
    }

    // Reassign circuits to particles
    particles.forEach(particle => {
      particle.circuit = circuits[Math.floor(Math.random() * circuits.length)];
    });
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
    if (!isHomepage()) {
      cleanupCanvas();
      return;
    }

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
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.connectionDistance) {
          const opacity = 1 - (distance / config.connectionDistance);
          ctx.strokeStyle = config.particleColor;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = opacity * 0.2;

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
      return;
    }

    initParticles();
    animate();
  }

  // Handle route changes
  window.addEventListener('hashchange', () => {
    if (isHomepage() && !animationId) {
      init();
    } else if (!isHomepage() && animationId) {
      cleanupCanvas();
    }
  });

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, 100); // Small delay to ensure docsify is ready
    });
  } else {
    setTimeout(init, 100);
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanupCanvas);
})();
