import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfuCbRaqxkMQTjm7dIqhDBSDVd5RkJHM4",
  authDomain: "gasleakdetector-aa2bc.firebaseapp.com",
  databaseURL: "https://gasleakdetector-aa2bc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gasleakdetector-aa2bc",
  storageBucket: "gasleakdetector-aa2bc.firebasestorage.app",
  messagingSenderId: "878891852662",
  appId: "1:878891852662:web:0c457a7f49573951ead057",
  measurementId: "G-04P4WCHNR6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const statusElement = document.getElementById("status");
const gasValueElement = document.getElementById("gasValue");
const statusLabel = document.getElementById("statusLabel");
const gasDesc = document.getElementById("gasDesc");
const footerStatus = document.getElementById("footerStatus");

Notification.requestPermission();

let alerted = false;
let lastAlertTime = null;

// Fixed thresholds for gas levels
const SAFE_THRESHOLD = 500;      // Below 500 ppm = SAFE
const WARNING_THRESHOLD = 700;   // 500-700 ppm = WARNING
const DANGER_THRESHOLD = 700;    // Above 700 ppm = LEAK

// Initialize gauge
initGaugeZero();

// ============ FIREBASE LISTENER ============
const gasRef = ref(db, "gasDetector");

onValue(gasRef, (snapshot) => {
    const data = snapshot.val();

    if (data) {
        const gasValue = data.gasValue;
        const raw = Number(gasValue) || 0;

        // Update raw values
        gasValueElement.textContent = raw;
        
        // Calculate percentage based on fixed thresholds
        // 0-500 = 0-33%, 500-700 = 33-67%, 700+ = 67-100%
        let pct;
        if (raw < SAFE_THRESHOLD) {
            // Scale 0-500 to 0-0.33
            pct = (raw / SAFE_THRESHOLD) * 0.33;
        } else if (raw < WARNING_THRESHOLD) {
            // Scale 500-700 to 0.33-0.67
            pct = 0.33 + ((raw - SAFE_THRESHOLD) / (WARNING_THRESHOLD - SAFE_THRESHOLD)) * 0.34;
        } else {
            // Scale 700+ to 0.67-1.0
            pct = 0.67 + Math.min((raw - WARNING_THRESHOLD) / 500, 0.33);
        }
        pct = Math.max(0, Math.min(1, pct));

        // Update status and styling based on FIXED gas level thresholds
        let displayStatus = "SAFE";
        let statusClass = "status-safe";
        let statusLabelText = "✓ All Systems Operational";
        let gasDescText = "Normal concentration";
        
        if (raw >= DANGER_THRESHOLD) {
            displayStatus = "LEAK";
            statusClass = "status-danger";
            statusLabelText = "⚠️ LEAK DETECTED - EVACUATE";
            gasDescText = "Critical concentration - Emergency protocol active";
        } else if (raw >= SAFE_THRESHOLD) {
            displayStatus = "WARNING";
            statusClass = "status-warning";
            statusLabelText = "⚠️ CAUTION - Gas Detected";
            gasDescText = "Elevated concentration - Monitor closely";
        } else {
            displayStatus = "SAFE";
            statusClass = "status-safe";
            statusLabelText = "✓ All Systems Operational";
            gasDescText = "Normal concentration - Safe to operate";
        }

        // Update status pills
        statusElement.textContent = displayStatus;
        statusElement.className = `status-pill ${statusClass}`;
        statusElement.setAttribute('aria-label', statusLabelText);
        statusLabel.textContent = statusLabelText;
        gasDesc.textContent = gasDescText;

        // Update footer status
        footerStatus.textContent = displayStatus;
        footerStatus.parentElement.style.color = 
            statusClass === 'status-danger' ? '#b91c1c' :
            statusClass === 'status-warning' ? '#d97706' :
            '#047857';

        // Update gauge visuals
        updateGauge(pct, raw);

        // Update smoke/fog intensity based on percentage and status
        setSmokeIntensity(pct, displayStatus === 'LEAK' || displayStatus === 'WARNING');

        // Handle notifications
        if (displayStatus === "LEAK" && !alerted) {
            new Notification("🚨 GAS LEAKAGE ALERT!", { 
                body: `Critical: ${gasValue} ppm detected! Immediate evacuation required!`,
                icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23ef4444'/><text x='50' y='60' font-size='50' fill='white' text-anchor='middle'>!</text></svg>"
            });
            alerted = true;
            lastAlertTime = new Date();
        } else if (displayStatus !== "LEAK") {
            alerted = false;
        }

        // Update status chip and last-updated
        const statusChip = document.getElementById('statusChip');
        if(statusChip) {
            statusChip.textContent = displayStatus || 'Unknown';
        }
        
        const lastEl = document.getElementById('lastUpdated');
        if(lastEl) lastEl.textContent = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });

        // Update info cards
        updateInfoCards(displayStatus);
    }
});

// ============ GAUGE MANAGEMENT ============
function initGaugeZero() {
    const arc = document.getElementById('gaugeArc');
    const label = document.getElementById('gaugeLabel');
    const needle = document.getElementById('needle');
    const needleShadow = document.getElementById('needleShadow');
    
    if(arc) {
        const circumference = 2 * Math.PI * 80;
        const semic = circumference / 2;
        // use semicircle length as dash length so the gauge shows a half-ring
        arc.style.strokeDasharray = String(semic);
        arc.style.strokeDashoffset = String(semic);
    }
    if(label) label.textContent = '0%';
    if(gasValueElement) gasValueElement.textContent = '0';
    if(needle) needle.setAttribute('transform', 'rotate(-180)');
    if(needleShadow) needleShadow.setAttribute('transform', 'rotate(-180)');
}

function updateGauge(pct, rawValue) {
    const arc = document.getElementById('gaugeArc');
    const label = document.getElementById('gaugeLabel');
    const needle = document.getElementById('needle');
    const needleShadow = document.getElementById('needleShadow');
    const gaugeRange = document.getElementById('gaugeRange');
    
    if (arc && label && needle) {
        const circumference = 2 * Math.PI * 80;
        const semic = circumference / 2;
        // visible arc length should be part of the semicircle
        const visible = semic * pct; // how much of the semicircle to show
        // set dasharray to semic (the full visible semicircle length) and offset to hide the remainder
        arc.style.strokeDasharray = String(semic);
        // offset should move from semic (hidden) down to semic - visible
        const dash = semic - visible;
        arc.style.strokeDashoffset = String(dash);
        
        const displayPct = Math.round(pct * 100);
        label.textContent = displayPct + '%';
        
        const angle = -180 + (pct * 180);
        needle.setAttribute('transform', `rotate(${angle})`);
        
        if (needleShadow) {
            needleShadow.setAttribute('transform', `rotate(${angle})`);
        }

        // Determine gauge color based on fixed thresholds
        let strokeColor = '#10b981'; // green default
        if (rawValue >= DANGER_THRESHOLD) strokeColor = '#ef4444'; // red
        else if (rawValue >= SAFE_THRESHOLD) strokeColor = '#f59e0b'; // yellow

        // Apply stroke color to arc and label
        try {
            arc.setAttribute('stroke', strokeColor);
        } catch (e) {}
        try {
            label.setAttribute('fill', strokeColor);
        } catch (e) {}

        // Move the gauge tip (small circle) to follow the arc end and color it
        const tip = document.getElementById('gaugeTip');
        if (tip) {
            try {
                tip.setAttribute('transform', `rotate(${angle})`);
                tip.setAttribute('fill', strokeColor);
            } catch (e) {}
        }

        // Update range display with fixed thresholds
        if (gaugeRange) {
            let rangeText = 'Safe Zone: 0-500 ppm';
            if (rawValue >= DANGER_THRESHOLD) rangeText = 'DANGER: >700 ppm';
            else if (rawValue >= SAFE_THRESHOLD) rangeText = 'Warning: 500-700 ppm';
            gaugeRange.textContent = rangeText;
        }
    }
}

// ============ SMOKE/FOG EFFECTS ============
function setSmokeIntensity(pct, status) {
    const root = document.documentElement;
    
    // Scale fog opacity based on status
    let opacity;
    if (status === 'LEAK') {
        // High intensity red fog for danger (0.5 to 0.8)
        opacity = 0.5 + (pct - 0.67) * 0.5;
    } else if (status === 'WARNING') {
        // Medium intensity orange fog for warning (0.25 to 0.5)
        opacity = 0.2 + (pct - 0.33) * 0.5;
    } else {
        // Low intensity green fog for safe (0.05 to 0.2)
        opacity = 0.05 + pct * 0.15;
    }
    
    opacity = Math.max(0.05, Math.min(0.8, opacity));
    root.style.setProperty('--smoke-opacity', opacity.toFixed(3));
    
    const smokeEl = document.getElementById('smoke');
    if(!smokeEl) return;
    
    // Toggle alert class for danger/warning
    if(status === 'LEAK' || status === 'WARNING') {
        smokeEl.classList.add('smoke-alert');
    } else {
        smokeEl.classList.remove('smoke-alert');
    }
}

// ============ ANIMATED FOG/GAS PARTICLES ============
function initFogCanvas() {
    const canvas = document.getElementById('fogCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let particles = [];
    let gasLevel = 0;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2 - 0.5;
            this.life = 1;
            this.decay = Math.random() * 0.002 + 0.001;
            this.size = Math.random() * 80 + 40;
            this.color = gasLevel > 0.6 ? 
                `rgba(239, 68, 68, ${0.1 * this.life})` : 
                `rgba(16, 185, 129, ${0.08 * this.life})`;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy -= 0.05; // Rise up
            this.life -= this.decay;
            
            // Wrap around edges
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < -50) this.y = canvas.height;
            
            this.color = gasLevel > 0.6 ? 
                `rgba(239, 68, 68, ${0.1 * this.life})` : 
                `rgba(16, 185, 129, ${0.08 * this.life})`;
        }
        
        draw() {
            if (this.life <= 0) return;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function animate() {
        // Clear with fade effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Spawn particles based on gas level
        const spawnRate = Math.floor(2 + gasLevel * 8);
        for (let i = 0; i < spawnRate; i++) {
            particles.push(new Particle());
        }
        
        // Update and draw particles
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Update gas level from page state
    const updateCanvasGasLevel = () => {
        const gaugeLabel = document.getElementById('gaugeLabel');
        if (gaugeLabel) {
            const valText = gaugeLabel.textContent || '0%';
            gasLevel = Number(valText.replace('%', '')) / 100;
        }
        requestAnimationFrame(updateCanvasGasLevel);
    };
    
    updateCanvasGasLevel();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ============ INFO CARDS UPDATE ============
function updateInfoCards(status) {
    const sensorStatus = document.getElementById('sensorStatus');
    const lastAlert = document.getElementById('lastAlert');
    const updateRate = document.getElementById('updateRate');
    
    if (sensorStatus) {
        sensorStatus.textContent = 'Connected';
        sensorStatus.style.color = '#10b981';
    }
    
    if (lastAlert) {
        if (lastAlertTime) {
            lastAlert.textContent = lastAlertTime.toLocaleTimeString('en-US', { 
                hour12: true 
            });
            lastAlert.style.color = status === 'LEAK' ? '#b91c1c' : '#10b981';
        } else {
            lastAlert.textContent = 'None';
            lastAlert.style.color = '#10b981';
        }
    }
    
    if (updateRate) {
        updateRate.textContent = 'Real-time Active';
        updateRate.style.color = '#10b981';
    }
}

// ============ INITIALIZATION ============
document.getElementById('year').textContent = new Date().getFullYear();

// Initialize fog canvas for particles
initFogCanvas();

// Initialize smoke with neutral state
setSmokeIntensity(0, false);

// Monitor gauge changes
const observer = new MutationObserver(() => {
    const valText = document.getElementById('gaugeLabel')?.textContent || '0%';
    const v = Number(valText.replace('%','')) / 100;
    const status = document.getElementById('status')?.textContent || 'SAFE';
    setSmokeIntensity(v, status);
});

const gaugeLabel = document.getElementById('gaugeLabel');
if (gaugeLabel) {
    observer.observe(gaugeLabel, { childList: true, subtree: true });
}

// 3D tilt effect on panels (optional enhancement)
const panels = document.querySelectorAll('.panel');
panels.forEach(panel => {
    panel.addEventListener('mousemove', (e) => {
        const rect = panel.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        panel.style.setProperty('--mouse-x', `${x}px`);
        panel.style.setProperty('--mouse-y', `${y}px`);
    });
});