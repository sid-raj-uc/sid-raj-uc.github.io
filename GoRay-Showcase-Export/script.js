document.addEventListener('DOMContentLoaded', () => {
    const galleryBtns = document.querySelectorAll('.gallery-btn');
    const galleryImage = document.getElementById('gallery-image');
    const spinner = document.querySelector('.loading-spinner');

    // Preload images for smoother transitions
    const preloadedImages = {};
    for (let i = 1; i <= 5; i++) {
        const img = new Image();
        img.src = `assets/benchmark_scene_${i}.png`;
        preloadedImages[i] = img;
    }

    galleryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            galleryBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            btn.classList.add('active');

            const sceneId = btn.getAttribute('data-scene');
            
            // UI Transition
            galleryImage.classList.add('loading');
            spinner.style.display = 'block';

            // Simulate slight network delay for effect, or swap immediately
            setTimeout(() => {
                galleryImage.src = preloadedImages[sceneId].src;
                
                galleryImage.onload = () => {
                    galleryImage.classList.remove('loading');
                    spinner.style.display = 'none';
                };
            }, 300);
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Ray Tracer Visualization Logic ---
    const canvas = document.getElementById('ray-canvas');
    const restartBtn = document.getElementById('restart-viz');
    if (canvas && restartBtn) {
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 400;

        const spheres = [
            { x: 450, y: 200, r: 60, color: '#3b82f6' },
            { x: 600, y: 120, r: 40, color: '#ec4899' },
            { x: 650, y: 300, r: 70, color: '#10b981' },
            { x: 350, y: 320, r: 40, color: '#f59e0b' }
        ];
        
        const light = { x: 400, y: 50 };
        const camera = { x: 50, y: 200 };
        const screenX = 150;
        const screenYStart = 50;
        const screenYEnd = 350;
        const stepY = 15;
        
        let currentScanY = screenYStart;
        let activePaths = [];
        let screenPixels = [];
        let isAnimating = false;

        function intersect(origin, dir, sphere) {
            const vx = origin.x - sphere.x;
            const vy = origin.y - sphere.y;
            const b = 2 * (dir.x * vx + dir.y * vy);
            const c = (vx * vx + vy * vy) - sphere.r * sphere.r;
            const disc = b * b - 4 * c;
            if (disc < 0) return null;
            const t = (-b - Math.sqrt(disc)) / 2;
            if (t < 0.001) return null;
            return t;
        }

        function spawnRaysForY(y) {
            const dirX = screenX - camera.x;
            const dirY = y - camera.y;
            const len = Math.sqrt(dirX*dirX + dirY*dirY);
            const dir = { x: dirX/len, y: dirY/len };
            const origin = { x: camera.x, y: camera.y };
            
            let minT = Infinity;
            let hitSphere = null;
            spheres.forEach(s => {
                const t = intersect(origin, dir, s);
                if (t && t < minT) {
                    minT = t;
                    hitSphere = s;
                }
            });
            
            let endX = origin.x + dir.x * 800;
            let endY = origin.y + dir.y * 800;
            let hitPoint = null;
            
            if (hitSphere) {
                endX = origin.x + dir.x * minT;
                endY = origin.y + dir.y * minT;
                hitPoint = { x: endX, y: endY };
            }

            // Primary Ray
            activePaths.push({
                x1: origin.x, y1: origin.y, x2: endX, y2: endY, 
                color: 'rgba(255, 255, 255, 0.8)', progress: 0, speed: 0.05,
                onComplete: () => {
                    if (hitSphere && hitPoint) {
                        // Shadow Ray
                        activePaths.push({
                            x1: hitPoint.x, y1: hitPoint.y, x2: light.x, y2: light.y,
                            color: 'rgba(250, 204, 21, 0.6)', progress: 0, speed: 0.05, dash: true
                        });

                        // Reflection Ray
                        const nx = (hitPoint.x - hitSphere.x) / hitSphere.r;
                        const ny = (hitPoint.y - hitSphere.y) / hitSphere.r;
                        const dot = dir.x*nx + dir.y*ny;
                        const rx = dir.x - 2*dot*nx;
                        const ry = dir.y - 2*dot*ny;
                        
                        activePaths.push({
                            x1: hitPoint.x, y1: hitPoint.y, 
                            x2: hitPoint.x + rx*300, y2: hitPoint.y + ry*300,
                            color: hitSphere.color, progress: 0, speed: 0.04
                        });

                        screenPixels.push({ y: y, color: hitSphere.color });
                    } else {
                        screenPixels.push({ y: y, color: '#111' });
                    }
                    
                    // Next scanline
                    currentScanY += stepY;
                    if (currentScanY <= screenYEnd) {
                        spawnRaysForY(currentScanY);
                    } else {
                        isAnimating = false;
                        restartBtn.textContent = "Restart Simulation";
                    }
                }
            });
        }

        function drawScene() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw screen plane
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX, screenYStart - 20);
            ctx.lineTo(screenX, screenYEnd + 20);
            ctx.stroke();

            // Draw computed pixels on screen plane
            screenPixels.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(screenX - 4, p.y - stepY/2, 8, stepY);
            });

            // Draw light
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(light.x, light.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#facc15';
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw camera
            ctx.fillStyle = '#7c3aed';
            ctx.beginPath();
            ctx.arc(camera.x, camera.y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Draw spheres
            spheres.forEach(s => {
                const gradient = ctx.createRadialGradient(s.x - s.r/3, s.y - s.r/3, s.r/10, s.x, s.y, s.r);
                gradient.addColorStop(0, '#fff');
                gradient.addColorStop(0.2, s.color);
                gradient.addColorStop(1, '#000');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw animating rays
            for (let i = activePaths.length - 1; i >= 0; i--) {
                let p = activePaths[i];
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                if (p.dash) ctx.setLineDash([5, 5]);
                else ctx.setLineDash([]);
                
                const curX = p.x1 + (p.x2 - p.x1) * p.progress;
                const curY = p.y1 + (p.y2 - p.y1) * p.progress;
                
                ctx.beginPath();
                ctx.moveTo(p.x1, p.y1);
                ctx.lineTo(curX, curY);
                ctx.stroke();
                
                // Draw leading photon
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(curX, curY, 3, 0, Math.PI*2);
                ctx.fill();

                if (p.progress < 1) {
                    p.progress += p.speed;
                    if (p.progress >= 1) {
                        p.progress = 1;
                        if (p.onComplete) p.onComplete();
                    }
                }
            }
            ctx.setLineDash([]);
        }

        function animate() {
            drawScene();
            if (isAnimating || activePaths.some(p => p.progress < 1)) {
                requestAnimationFrame(animate);
            }
        }

        restartBtn.addEventListener('click', () => {
            currentScanY = screenYStart;
            activePaths = [];
            screenPixels = [];
            isAnimating = true;
            restartBtn.textContent = "Simulating...";
            spawnRaysForY(currentScanY);
            animate();
        });

        // Run once on load
        drawScene();
    }
});
