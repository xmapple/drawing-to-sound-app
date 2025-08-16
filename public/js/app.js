document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('doodle-area');
    const ctx = canvas.getContext('2d');
    const playBtn = document.getElementById('play-btn');
    const clearBtn = document.getElementById('clear-btn');
    const brushes = document.querySelectorAll('.brush');

    let drawing = false;
    let currentColor = '#0000ff';

    // --- Drawing Logic (No audio here) ---
    function startDrawing(e) {
        drawing = true;
        draw(e);
    }

    function stopDrawing() {
        drawing = false;
        ctx.beginPath();
    }

    function draw(e) {
        if (!drawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentColor;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    // --- Audio Logic ---
    let audioContext;

    // This function creates a single music box note
    function playNote(frequency, startTime, duration) {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // A sine wave is clean and works well for a music box sound
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        // This is the "music box" envelope
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, startTime + now);
        // Sharp attack
        gainNode.gain.linearRampToValueAtTime(0.7, startTime + now + 0.05);
        // Exponential decay
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + now + duration);

        oscillator.start(startTime + now);
        oscillator.stop(startTime + now + duration);
    }

    // This function scans the canvas and plays the melody
    function playMelody() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const totalDuration = 4; // 4 seconds for the whole melody
        const steps = 32; // Divide the melody into 32 notes

        // Pentatonic scale (C Major) - always sounds good!
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

        for (let i = 0; i < steps; i++) {
            const x = Math.floor(canvas.width * (i / steps));
            let highestY = canvas.height;

            // Find the highest pixel in this column (x)
            for (let y = 0; y < canvas.height; y++) {
                const alphaIndex = (y * canvas.width + x) * 4 + 3;
                if (imageData[alphaIndex] > 0) { // Is there a pixel here?
                    highestY = y;
                    break;
                }
            }
            
            // If a pixel was found, schedule a note to play
            if (highestY < canvas.height) {
                const noteIndex = Math.floor((highestY / canvas.height) * scale.length);
                const frequency = scale[scale.length - 1 - noteIndex];
                const startTime = (i / steps) * totalDuration;
                
                playNote(frequency, startTime, 1.0); // Each note lasts 1 second
            }
        }
    }

    // --- Event Listeners ---
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('mousemove', draw);
    
    playBtn.addEventListener('click', playMelody);

    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    brushes.forEach(brush => {
        brush.addEventListener('click', () => {
            document.querySelector('.brush.active').classList.remove('active');
            brush.classList.add('active');
            currentColor = brush.dataset.color;
        });
    });
});