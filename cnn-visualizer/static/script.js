document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const loadingOverlay = document.getElementById('loading-overlay');
    const resultsSection = document.getElementById('results-section');
    
    // UI Elements for results
    const predClassName = document.getElementById('pred-class-name');
    const predConfidence = document.getElementById('pred-confidence');
    const probBarsContainer = document.getElementById('prob-bars-container');
    const imgOriginal = document.getElementById('img-original');
    const imgHeatmap = document.getElementById('img-heatmap');
    const imgOverlay = document.getElementById('img-overlay');
    const samplesContainer = document.getElementById('samples-container');

    // Add sample images logic
    const classes = ['plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'];
    const sampleImages = [];
    classes.forEach(c => {
        for (let i = 0; i < 5; i++) {
            sampleImages.push(`sample_${c}_${i}.png`);
        }
    });
    // Shuffle the array so images are mixed randomly
    for (let i = sampleImages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sampleImages[i], sampleImages[j]] = [sampleImages[j], sampleImages[i]];
    }

    sampleImages.forEach(img => {
        const wrapper = document.createElement('div');
        wrapper.className = 'sample-img-wrapper';
        
        const imgEl = document.createElement('img');
        imgEl.src = `/static/sample_images/${img}`;
        imgEl.alt = "Sample Image";
        
        wrapper.appendChild(imgEl);
        wrapper.addEventListener('click', () => {
            fetch(imgEl.src)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], img, { type: 'image/png' });
                    processImage(file);
                });
        });
        
        samplesContainer.appendChild(wrapper);
    });

    // Drag and drop handlers
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            processImage(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            processImage(e.target.files[0]);
        }
    });

    function processImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        // Show loading state
        loadingOverlay.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        // Create form data
        const formData = new FormData();
        formData.append('image', file);

        // Send to backend
        fetch('/predict', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateUI(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to analyze image. Ensure backend is running.');
            loadingOverlay.classList.add('hidden');
        });
    }

    function updateUI(data) {
        // Update top prediction
        predClassName.textContent = data.predicted_class;
        predConfidence.textContent = (data.confidence * 100).toFixed(1) + '%';

        // Update probability bars (top 3)
        probBarsContainer.innerHTML = '';
        const top3 = data.probabilities.slice(0, 3);
        
        top3.forEach(([className, prob]) => {
            const probPct = (prob * 100).toFixed(1) + '%';
            
            const html = `
                <div class="prob-item">
                    <div class="prob-label">
                        <span>${className}</span>
                        <span>${probPct}</span>
                    </div>
                    <div class="prob-bar-bg">
                        <div class="prob-bar-fill" style="width: 0%"></div>
                    </div>
                </div>
            `;
            probBarsContainer.insertAdjacentHTML('beforeend', html);
        });

        // Trigger animation for bars
        setTimeout(() => {
            const bars = probBarsContainer.querySelectorAll('.prob-bar-fill');
            top3.forEach(([_, prob], index) => {
                if(bars[index]) {
                    bars[index].style.width = (prob * 100) + '%';
                }
            });
        }, 100);

        // Update images
        imgOriginal.src = `data:image/png;base64,${data.original_b64}`;
        imgHeatmap.src = `data:image/png;base64,${data.heatmap_b64}`;
        imgOverlay.src = `data:image/png;base64,${data.overlay_b64}`;

        // Hide loading, show results
        loadingOverlay.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        // Scroll to results smoothly
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
});
