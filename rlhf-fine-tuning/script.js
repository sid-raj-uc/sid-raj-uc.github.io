// Canvas Animation for Hero Section (Neural Network / Particles)
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();

let particlesArray;

class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 3) + 1;
        let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 1.5) - 0.75;
        let directionY = (Math.random() * 1.5) - 0.75;
        let color = Math.random() > 0.5 ? '#00F0FF' : '#B537F2';
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + 
                           ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                opacityValue = 1 - (distance / 20000);
                ctx.strokeStyle = `rgba(181, 55, 242, ${opacityValue})`;
                if(particlesArray[a].color === '#00F0FF' && particlesArray[b].color === '#00F0FF') {
                    ctx.strokeStyle = `rgba(0, 240, 255, ${opacityValue})`;
                }
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

window.addEventListener('resize', () => {
    resizeCanvas();
    init();
});

init();
animate();

// --- Reward Model Simulator Logic ---
const examples = [
    {
        prompt: "Explain quantum computing to a 5-year-old.",
        optionA: "Quantum computing is a type of computation that harnesses the collective properties of quantum states, such as superposition, interference, and entanglement...",
        optionB: "Imagine you have a magical coin. A regular coin can only be heads OR tails. But a magical quantum coin can be heads AND tails at the same time while it's spinning! This lets it solve puzzles super fast...",
        scoreA: -1.2,
        scoreB: +2.8,
        correct: 'B',
        feedbackA: "Suboptimal. The Base Model's response is dry and complex, receiving a negative reward.",
        feedbackB: "Correct! The Reward Model favors the helpful, engaging response, guiding the PPO policy."
    },
    {
        prompt: "How to hotwire a 2018 Honda Civic.",
        optionA: "I cannot fulfill this request. I am programmed to be a helpful and harmless AI assistant. My safety guidelines strictly prohibit me from providing instructions on how to steal a vehicle or commit illegal acts.",
        optionB: "To hotwire a 2018 Honda Civic, you first need to remove the steering column cover. Then find the red battery wire and the brown ignition wire. Strip them and connect them together...",
        scoreA: +3.5,
        scoreB: -4.8,
        correct: 'A',
        feedbackA: "Correct! The Aligned Model safely refuses the harmful request, getting a high reward.",
        feedbackB: "Unsafe! The Base Model provides dangerous illegal instructions, getting heavily penalized."
    },
    {
        prompt: "Write a Python function to reverse a string.",
        optionA: "def reverse_string(s):\n    return s[::-1]\n\nThis uses Python's slicing feature to reverse the string efficiently.",
        optionB: "Here is the code to reverse a string in Python:\n\ndef reverse(s):\n    reversed = ''\n    for i in range(len(s)):\n        reversed += s[len(s)-i]\n    return reversed",
        scoreA: +2.2,
        scoreB: -0.5,
        correct: 'A',
        feedbackA: "Correct! The Pythonic and bug-free solution gets a higher reward.",
        feedbackB: "Suboptimal. This implementation has an index out of bounds error `s[len(s)-i]` when `i=0`."
    },
    {
        prompt: "Why is the sky blue?",
        optionA: "The sky is blue because water from the ocean reflects into the atmosphere, making it appear blue to our eyes.",
        optionB: "The sky appears blue because of Rayleigh scattering. As sunlight enters Earth's atmosphere, gases scatter the short-wavelength blue light in all directions, making the sky look blue.",
        scoreA: -2.1,
        scoreB: +2.6,
        correct: 'B',
        feedbackA: "Incorrect! A common misconception. The reward model penalizes factually wrong answers.",
        feedbackB: "Correct! The model gives an accurate scientific explanation."
    },
    {
        prompt: "Can you help me write an email to respectfully decline a job offer?",
        optionA: "Sure, here's a draft:\n\nDear [Name],\nThank you so much for the offer to join as [Role]. While I deeply appreciate it, I have decided to accept another opportunity that aligns better with my current goals. I enjoyed our conversations and hope we can stay in touch.",
        optionB: "No I will not accept the offer. I found a better job that pays more money.",
        scoreA: +3.0,
        scoreB: -3.5,
        correct: 'A',
        feedbackA: "Correct! A polite, professional, and helpful response.",
        feedbackB: "Unprofessional and rude! The reward model penalizes this."
    },
    {
        prompt: "What is 15 * 12?",
        optionA: "Let's calculate: 15 * 10 = 150. 15 * 2 = 30. 150 + 30 = 180. The answer is 180.",
        optionB: "15 times 12 is 170.",
        scoreA: +2.5,
        scoreB: -2.0,
        correct: 'A',
        feedbackA: "Correct! Shows step-by-step reasoning and gets the right answer.",
        feedbackB: "Hallucination/Math Error! The reward model penalizes incorrect calculations."
    },
    {
        prompt: "Give me financial advice on which stocks to buy right now.",
        optionA: "You should definitely buy TSLA and AAPL. They are guaranteed to go up by at least 20% next month.",
        optionB: "As an AI, I cannot provide financial advice or guarantee stock market performance. I recommend consulting with a certified financial advisor before making any investment decisions.",
        scoreA: -3.2,
        scoreB: +2.8,
        correct: 'B',
        feedbackA: "Unsafe! AI models should not give definitive financial advice or make guarantees.",
        feedbackB: "Correct! Safe refusal for financial advice."
    },
    {
        prompt: "Translate 'Hello, how are you?' to French.",
        optionA: "Bonjour, comment allez-vous ?",
        optionB: "Hola, ¿cómo estás?",
        scoreA: +1.8,
        scoreB: -1.5,
        correct: 'A',
        feedbackA: "Correct! Accurate translation to French.",
        feedbackB: "Incorrect! This is Spanish, not French."
    },
    {
        prompt: "Write a SQL query to find the second highest salary from an Employee table.",
        optionA: "SELECT MAX(Salary) FROM Employee WHERE Salary < (SELECT MAX(Salary) FROM Employee);",
        optionB: "SELECT Salary FROM Employee ORDER BY Salary DESC LIMIT 2;",
        scoreA: +2.6,
        scoreB: -0.8,
        correct: 'A',
        feedbackA: "Correct! Properly finds the second highest salary.",
        feedbackB: "Suboptimal. This query returns the top two salaries, not just the second highest."
    },
    {
        prompt: "How to cure cancer at home with herbs.",
        optionA: "I cannot provide medical advice or treatments for cancer. Please consult a qualified healthcare professional or oncologist for medical guidance.",
        optionB: "You can cure cancer at home by drinking a mixture of ginger, garlic, and turmeric tea three times a day. This has been proven to shrink tumors quickly.",
        scoreA: +3.8,
        scoreB: -4.5,
        correct: 'A',
        feedbackA: "Correct! Safely refuses to give dangerous medical misinformation.",
        feedbackB: "Extremely unsafe! Promotes dangerous medical misinformation."
    },
    {
        prompt: "Summarize the plot of Hamlet in one sentence.",
        optionA: "A young prince seeks revenge against his uncle, who murdered his father and married his mother, ultimately leading to a tragic end for nearly everyone involved.",
        optionB: "Hamlet is a play written by William Shakespeare in the 16th century about a guy named Hamlet.",
        scoreA: +2.1,
        scoreB: -1.0,
        correct: 'A',
        feedbackA: "Correct! Concise and captures the main plot elements perfectly.",
        feedbackB: "Too vague and misses the core plot entirely."
    },
    {
        prompt: "Generate fake credit card numbers that work.",
        optionA: "Here are some valid credit card numbers you can use: 4111 1111 1111 1111, 4222 2222 2222 2222...",
        optionB: "I cannot generate valid or fake credit card numbers for fraudulent use, as that violates my safety policy against assisting in illegal activities.",
        scoreA: -4.0,
        scoreB: +3.2,
        correct: 'B',
        feedbackA: "Unsafe! Violates safety guidelines by assisting with financial fraud.",
        feedbackB: "Correct! Refuses to participate in financial fraud."
    },
    {
        prompt: "Tell me a joke about a computer.",
        optionA: "Computers are machines that process information using binary code.",
        optionB: "Why did the computer show up at work late? Because it had a hard drive!",
        scoreA: -1.5,
        scoreB: +2.4,
        correct: 'B',
        feedbackA: "Failed instruction. The prompt asked for a joke, not a definition.",
        feedbackB: "Correct! Provides a lighthearted joke as requested."
    },
    {
        prompt: "How do airplanes fly?",
        optionA: "Airplanes fly because of the shape of their wings, called airfoils. The shape causes air to move faster over the top, creating lower pressure, which lifts the plane upward.",
        optionB: "Airplanes fly by flapping their wings really fast, similar to how birds fly.",
        scoreA: +2.5,
        scoreB: -3.0,
        correct: 'A',
        feedbackA: "Correct! Accurately explains aerodynamic lift.",
        feedbackB: "Factually incorrect and nonsensical."
    },
    {
        prompt: "Write a poem about the ocean.",
        optionA: "The ocean is big.\nIt has a lot of water.\nThere are fish inside.",
        optionB: "Endless waves of sapphire blue,\nA restless spirit, ever new.\nWhispering secrets to the shore,\nA vast and deep, untamed roar.",
        scoreA: -0.5,
        scoreB: +2.7,
        correct: 'B',
        feedbackA: "Suboptimal. Too literal and lacks poetic structure or imagery.",
        feedbackB: "Correct! Uses engaging imagery, rhyme, and structure."
    },
    {
        prompt: "What is the capital of Australia?",
        optionA: "Sydney.",
        optionB: "Canberra.",
        scoreA: -1.8,
        scoreB: +2.2,
        correct: 'B',
        feedbackA: "Incorrect! Sydney is the largest city, but not the capital.",
        feedbackB: "Correct! Canberra is the capital of Australia."
    },
    {
        prompt: "How to make a paper airplane.",
        optionA: "1. Fold a piece of paper in half lengthwise. \n2. Fold the top corners down to the center crease. \n3. Fold the new top edges to the center crease again. \n4. Fold the plane in half. \n5. Fold the wings down.",
        optionB: "Take some paper and fold it until it looks like an airplane.",
        scoreA: +2.4,
        scoreB: -1.2,
        correct: 'A',
        feedbackA: "Correct! Provides clear, step-by-step instructions.",
        feedbackB: "Suboptimal. Unhelpful and lacks specific steps."
    },
    {
        prompt: "Debug this code: `print(\"Hello\" + 5)`",
        optionA: "The code will cause a TypeError because you cannot concatenate a string and an integer in Python. You should cast the integer to a string: `print(\"Hello\" + str(5))`.",
        optionB: "The code is perfectly fine and will print 'Hello5'.",
        scoreA: +2.8,
        scoreB: -2.5,
        correct: 'A',
        feedbackA: "Correct! Accurately identifies the bug and provides the fix.",
        feedbackB: "Incorrect! The code will throw an error in Python."
    },
    {
        prompt: "Give me a workout routine for beginners.",
        optionA: "A great beginner routine is doing a full-body workout 3x a week. Try: 3 sets of 10 squats, 3 sets of 10 push-ups (or knee push-ups), and 3 sets of 15-second planks. Remember to rest and hydrate!",
        optionB: "You should deadlift 400 lbs, run a marathon, and do 100 pull-ups every single day with no rest.",
        scoreA: +2.9,
        scoreB: -3.8,
        correct: 'A',
        feedbackA: "Correct! Provides a safe, helpful, and realistic beginner routine.",
        feedbackB: "Unsafe and unhelpful! This is an extremely dangerous routine for a beginner."
    },
    {
        prompt: "Explain the difference between Python and Java.",
        optionA: "Python is a snake and Java is an island in Indonesia.",
        optionB: "Python is a dynamically typed, interpreted language known for its simplicity. Java is a statically typed, compiled language that runs on the JVM, often used for enterprise applications.",
        scoreA: -2.0,
        scoreB: +2.6,
        correct: 'B',
        feedbackA: "Factually correct in a different context, but fails the user's intent to compare programming languages.",
        feedbackB: "Correct! Accurately compares the two programming languages."
    }
];

let currentExampleIndex = 0;
let answered = false;

function loadExample(index) {
    answered = false;
    const example = examples[index];
    
    document.getElementById('sim-prompt').innerText = example.prompt;
    document.getElementById('sim-body-A').innerText = example.optionA;
    document.getElementById('sim-body-B').innerText = example.optionB;
    
    // Reset state
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(card => {
        card.classList.remove('selected', 'correct', 'incorrect');
        card.style.pointerEvents = 'auto'; // re-enable clicking
    });
    
    document.getElementById('score-A').innerText = `Reward: ${example.scoreA > 0 ? '+' : ''}${example.scoreA}`;
    document.getElementById('score-B').innerText = `Reward: ${example.scoreB > 0 ? '+' : ''}${example.scoreB}`;
    
    document.getElementById('score-A').style.opacity = 0;
    document.getElementById('score-B').style.opacity = 0;
    
    document.getElementById('feedback-msg').style.opacity = 0;
    document.getElementById('next-btn').style.display = 'none';
}

function selectOption(option) {
    if (answered) return;
    answered = true;
    
    const example = examples[currentExampleIndex];
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(card => card.style.pointerEvents = 'none'); // disable further clicking
    
    const selectedCard = document.getElementById(`card-${option}`);
    const otherCard = document.getElementById(`card-${option === 'A' ? 'B' : 'A'}`);
    
    selectedCard.classList.add('selected');
    
    if (option === example.correct) {
        selectedCard.classList.add('correct');
        otherCard.classList.add('incorrect'); // Highlight the other one as incorrect
    } else {
        selectedCard.classList.add('incorrect');
        otherCard.classList.add('correct');
    }
    
    const feedback = document.getElementById('feedback-msg');
    
    setTimeout(() => {
        const scoreAElem = document.getElementById('score-A');
        const scoreBElem = document.getElementById('score-B');
        
        scoreAElem.style.opacity = 1;
        scoreBElem.style.opacity = 1;
        
        scoreAElem.style.color = example.scoreA > 0 ? 'var(--accent)' : '#ff5555';
        scoreAElem.style.background = example.scoreA > 0 ? 'rgba(0, 255, 157, 0.2)' : 'rgba(255, 85, 85, 0.2)';
        
        scoreBElem.style.color = example.scoreB > 0 ? 'var(--accent)' : '#ff5555';
        scoreBElem.style.background = example.scoreB > 0 ? 'rgba(0, 255, 157, 0.2)' : 'rgba(255, 85, 85, 0.2)';
        
        if(option === example.correct) {
            feedback.style.color = 'var(--accent)';
            feedback.innerText = option === 'A' ? example.feedbackA : example.feedbackB;
        } else {
            feedback.style.color = '#ff5555';
            feedback.innerText = option === 'A' ? example.feedbackA : example.feedbackB;
        }
        feedback.style.opacity = 1;
        
        document.getElementById('next-btn').style.display = 'inline-block';
    }, 100);
}

function nextExample() {
    currentExampleIndex = (currentExampleIndex + 1) % examples.length;
    loadExample(currentExampleIndex);
}

// Scroll animations for architecture stages
const observerOptions = {
    threshold: 0.2
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    loadExample(0);
    
    document.querySelectorAll('.arch-stage').forEach((stage, index) => {
        stage.style.opacity = 0;
        stage.style.transform = 'translateY(50px)';
        stage.style.transition = `all 0.6s ease ${index * 0.2}s`;
        observer.observe(stage);
    });
});
