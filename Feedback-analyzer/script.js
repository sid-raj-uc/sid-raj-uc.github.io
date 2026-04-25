// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    // Reveal elements on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add animation classes to elements
    const animateElements = document.querySelectorAll('.metric-card, .gallery-item, .arch-layer');
    
    // Initial hidden state styles
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // Add visible class style dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Number counting animation for metrics
    const numberObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const valueEl = entry.target;
                const finalValue = parseFloat(valueEl.innerText.replace(/[^0-9.]/g, ''));
                const originalText = valueEl.innerHTML;
                
                // Skip if it doesn't contain a number
                if (isNaN(finalValue)) return;
                
                const hasSuffix = originalText.includes('<span');
                const suffix = hasSuffix ? originalText.substring(originalText.indexOf('<span')) : '';
                const duration = 2000; // 2 seconds
                const steps = 60;
                const stepTime = duration / steps;
                let currentStep = 0;
                
                const timer = setInterval(() => {
                    currentStep++;
                    const progress = currentStep / steps;
                    // Easing function
                    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                    
                    let currentValue = finalValue * easeOutQuart;
                    
                    // Format based on the final value
                    if (finalValue > 1000) {
                        currentValue = Math.floor(currentValue).toLocaleString();
                        if (originalText.includes('+')) currentValue += '+';
                    } else if (finalValue % 1 !== 0) {
                        currentValue = currentValue.toFixed(1);
                    } else {
                        currentValue = Math.floor(currentValue);
                    }
                    
                    valueEl.innerHTML = currentValue + suffix;
                    
                    if (currentStep >= steps) {
                        clearInterval(timer);
                        valueEl.innerHTML = originalText; // Ensure perfect final state
                    }
                }, stepTime);
                
                observer.unobserve(valueEl);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.metric-value').forEach(el => {
        numberObserver.observe(el);
    });

    // Chart.js Setup
    const initCharts = () => {
        if (typeof Chart === 'undefined') return;

        // Shared options
        Chart.defaults.color = '#9ba1a6';
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';

        // 1. Sentiment Distribution Doughnut
        const ctxSentiment = document.getElementById('sentimentChart');
        if (ctxSentiment) {
            new Chart(ctxSentiment.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Positive', 'Negative', 'Neutral'],
                    datasets: [{
                        data: [60.9, 31.8, 7.3],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(107, 114, 128, 0.8)'
                        ],
                        borderColor: [
                            'rgba(16, 185, 129, 1)',
                            'rgba(239, 68, 68, 1)',
                            'rgba(107, 114, 128, 1)'
                        ],
                        borderWidth: 1,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // 2. Category Breakdown Bar Chart
        const ctxCategory = document.getElementById('categoryChart');
        if (ctxCategory) {
            new Chart(ctxCategory.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Electronics', 'Home & Kitchen', 'Apparel', 'Books', 'Toys'],
                    datasets: [
                        {
                            label: 'Positive',
                            data: [65, 55, 70, 80, 50],
                            backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        },
                        {
                            label: 'Negative',
                            data: [25, 35, 20, 10, 40],
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true }
                    },
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }

        // 3. Bubble Chart for Topic Clusters
        const ctxTopic = document.getElementById('topicChart');
        if (ctxTopic) {
            new Chart(ctxTopic.getContext('2d'), {
                type: 'bubble',
                data: {
                    datasets: [
                        {
                            label: 'Battery Life',
                            data: [{ x: 15, y: 80, r: 20 }], // x = negative freq, y = compound, r = volume
                            backgroundColor: 'rgba(99, 102, 241, 0.7)'
                        },
                        {
                            label: 'Shipping Speed',
                            data: [{ x: 5, y: 40, r: 30 }],
                            backgroundColor: 'rgba(168, 85, 247, 0.7)'
                        },
                        {
                            label: 'Customer Support',
                            data: [{ x: 45, y: -20, r: 25 }],
                            backgroundColor: 'rgba(236, 72, 153, 0.7)'
                        },
                        {
                            label: 'Build Quality',
                            data: [{ x: 20, y: 60, r: 15 }],
                            backgroundColor: 'rgba(16, 185, 129, 0.7)'
                        },
                        {
                            label: 'Pricing',
                            data: [{ x: 35, y: 10, r: 35 }],
                            backgroundColor: 'rgba(245, 158, 11, 0.7)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { 
                            title: { display: true, text: 'Negative Sentiment Frequency (%)' },
                        },
                        y: { 
                            title: { display: true, text: 'Average Sentiment Score' },
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': Volume ' + context.raw.r;
                                }
                            }
                        }
                    }
                }
            });
        }
    };

    // Initialize charts
    initCharts();
});
