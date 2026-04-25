document.addEventListener("DOMContentLoaded", () => {
    // Initialize Highlight.js
    hljs.highlightAll();

    // Generate Background Stars
    const starsContainer = document.getElementById('stars');
    const numStars = 150;

    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Randomize star position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Randomize size and opacity
        const size = Math.random() * 3 + 1; // 1px to 4px
        
        // Randomize animation duration and delay
        const duration = Math.random() * 3 + 2; // 2s to 5s
        const delay = Math.random() * 5;
        
        star.style.left = `${x}vw`;
        star.style.top = `${y}vh`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
