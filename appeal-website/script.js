// ==========================================
// TERMINATED - Appeal System Script
// WITH API KEY AUTHENTICATION - FINAL
// ==========================================

// Server URL - Change if needed
const BOT_API_URL = 'http://localhost:3001/api/appeal';

// API KEY - Must match server.js
const API_KEY = 'ap-Je-48567nf-sl-476bdu84';

const elements = {
    form: document.getElementById('appealForm'),
    submitBtn: document.getElementById('submitBtn'),
    loadingState: document.getElementById('loadingState'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    formContainer: document.getElementById('formContainer'),
    successContainer: document.getElementById('successContainer'),
    reasonTextarea: document.getElementById('reason'),
    futureTextarea: document.getElementById('future'),
    reasonCounter: document.getElementById('reasonCounter'),
    futureCounter: document.getElementById('futureCounter')
};

let isSubmitting = false;

// ========== FORM SUBMISSION ==========
elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (!validateForm()) return;
    
    isSubmitting = true;
    showLoading();
    
    const formData = getFormData();
    
    try {
        console.log('📤 Sending appeal to:', BOT_API_URL);
        console.log('📤 With API Key:', API_KEY);
        
        const response = await sendToBot(formData);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success:', data);
            showSuccess();
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error('❌ Server error:', errorData);
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error submitting appeal:', error);
        
        let errorMsg = 'Failed to submit appeal. ';
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            errorMsg += 'Cannot connect to server.\n\n' +
                       'Please check:\n' +
                       '✓ Server is running (node server.js)\n' +
                       '✓ URL is correct: ' + BOT_API_URL + '\n' +
                       '✓ Check browser console (F12) for details';
        } else if (error.message.includes('API key')) {
            errorMsg += 'Authentication failed. API key may be incorrect.';
        } else if (error.message.includes('timeout')) {
            errorMsg += 'Server took too long to respond. Try again.';
        } else {
            errorMsg += error.message || 'Unknown error occurred.';
        }
        
        showError(errorMsg);
    } finally {
        isSubmitting = false;
    }
});

// ========== GET FORM DATA ==========
function getFormData() {
    return {
        username: document.getElementById('username').value.trim(),
        userId: document.getElementById('userId').value.trim(),
        serverName: document.getElementById('serverName').value.trim(),
        actionType: document.getElementById('actionType').value,
        reason: document.getElementById('reason').value.trim(),
        rulesUnderstood: document.getElementById('rulesUnderstood').value,
        future: document.getElementById('future').value.trim(),
        timestamp: new Date().toISOString(),
        submittedAt: new Date().toLocaleString()
    };
}

// ========== SEND TO BOT API ==========
async function sendToBot(formData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
        console.log('🔄 Making fetch request...');
        
        const response = await fetch(BOT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(formData),
            signal: controller.signal
        });
        
        console.log('📥 Response received:', response.status);
        
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('🔥 Fetch error:', error);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - server took too long to respond');
        }
        throw error;
    }
}

// ========== FORM VALIDATION ==========
function validateForm() {
    const username = document.getElementById('username').value.trim();
    const userId = document.getElementById('userId').value.trim();
    const serverName = document.getElementById('serverName').value.trim();
    const actionType = document.getElementById('actionType').value;
    const reason = document.getElementById('reason').value.trim();
    const rulesUnderstood = document.getElementById('rulesUnderstood').value;
    const future = document.getElementById('future').value.trim();

    if (!username || !userId || !serverName || !actionType || !reason || !rulesUnderstood || !future) {
        showError('Please fill in all required fields.');
        return false;
    }

    if (!username.includes('#') && !username.includes('@')) {
        showError('Please enter a valid Discord username (e.g., Username#1234)');
        return false;
    }

    if (!/^\d{17,19}$/.test(userId)) {
        showError('Please enter a valid Discord User ID (17-19 digits)');
        return false;
    }

    if (reason.length < 50) {
        showError('Please provide a more detailed explanation (minimum 50 characters)');
        return false;
    }

    if (future.length < 30) {
        showError('Please provide more detail about your future behavior (minimum 30 characters)');
        return false;
    }

    return true;
}

// ========== UI STATE FUNCTIONS ==========
function showLoading() {
    elements.submitBtn.style.display = 'none';
    elements.loadingState.style.display = 'block';
    elements.errorMessage.style.display = 'none';
}

function showSuccess() {
    elements.formContainer.style.display = 'none';
    elements.successContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    elements.loadingState.style.display = 'none';
    elements.submitBtn.style.display = 'flex';
    elements.errorMessage.style.display = 'flex';
    elements.errorText.textContent = message;
    elements.errorText.style.whiteSpace = 'pre-line';
    
    elements.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
        elements.errorMessage.style.display = 'none';
    }, 8000);
}

// ========== CHARACTER COUNTERS ==========
function setupCharacterCounter(textarea, counter, minLength) {
    textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        counter.textContent = `${length}/${minLength} characters minimum`;
        counter.style.color = length >= minLength ? '#00ff00' : '#ff6b6b';
    });
    
    textarea.dispatchEvent(new Event('input'));
}

setupCharacterCounter(elements.reasonTextarea, elements.reasonCounter, 50);
setupCharacterCounter(elements.futureTextarea, elements.futureCounter, 30);

// ========== SMOOTH SCROLL ON INVALID ==========
document.querySelectorAll('input, select, textarea').forEach(element => {
    element.addEventListener('invalid', (e) => {
        e.preventDefault();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
    });
});

// ========== CONNECTION TEST ON PAGE LOAD ==========
window.addEventListener('load', async () => {
    console.log('🌐 Page loaded, testing connection...');
    console.log('📍 Server URL:', BOT_API_URL);
    console.log('🔑 API Key:', API_KEY);
    
    try {
        const testUrl = BOT_API_URL.replace('/api/appeal', '/api/health');
        console.log('🧪 Testing health endpoint:', testUrl);
        
        const response = await fetch(testUrl, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server connection successful:', data);
        } else {
            console.warn('⚠️ Server responded but may not be healthy:', response.status);
        }
    } catch (error) {
        console.error('❌ Could not connect to server:', error);
        console.warn('📝 Make sure server is running: node server.js');
        console.warn('📝 Server should be at:', BOT_API_URL);
    }
});