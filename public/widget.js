(function () {
    // Styles for the modal
    const styles = `
        @keyframes saas-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes saas-slide-up {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .saas-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            animation: saas-fade-in 0.4s ease-out;
        }
        .saas-modal-container {
            width: 95%;
            height: 90%;
            max-width: 1000px;
            max-height: 90vh;
            background: rgba(10, 10, 10, 0.75);
            position: relative;
            overflow: hidden;
            border-radius: 40px;
            box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8), 
                        inset 0 0 0 1px rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            animation: saas-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            margin: 20px;
        }
        @media (max-width: 768px) {
            .saas-modal-container {
                width: 100%;
                height: 100%;
                max-width: 100%;
                max-height: 100%;
                margin: 0;
                border-radius: 0;
            }
        }
        .saas-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
        }
        .saas-close-btn {
            position: absolute;
            top: 32px;
            right: 32px;
            z-index: 1000001;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(15px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .saas-close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: rotate(90deg);
        }
        .saas-close-btn svg {
            width: 20px;
            height: 20px;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // Create Modal Elements
    const overlay = document.createElement('div');
    overlay.className = 'saas-modal-overlay';

    const container = document.createElement('div');
    container.className = 'saas-modal-container';

    // External close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'saas-close-btn';
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.onclick = closeVisualizer;

    const iframe = document.createElement('iframe');
    iframe.className = 'saas-iframe';
    iframe.setAttribute('allow', 'camera');

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const BASE_URL = "https://api.visualizalo.es"; // In production this would be our domain

    function openVisualizer(params) {
        const { imageUrl, name, category, apiKey } = params;
        const API_BASE = 'https://api.visualizalo.es';
        const APP_BASE = 'https://www.visualizalo.es';

        if (!apiKey) {
            console.error('API Key missing');
            alert('Error: API Key missing.');
            return;
        }

        fetch(`${API_BASE}/api/widget/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey })
        })
            .then(res => res.json())
            .then(data => {
                if (!data.valid) {
                    alert(`Error: ${data.message}`);
                    return;
                }
                const query = new URLSearchParams({
                    imageUrl,
                    name: name || '',
                    category: category || 'Anillo',
                    apiKey: apiKey || '',
                    options: params.options || ''
                }).toString();

                iframe.src = `${APP_BASE}/#/widget?${query}`;
                overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            })
            .catch(err => {
                console.error('[SaaS] Validation error:', err);
                alert('Error al validar acceso.');
            });
    }

    function closeVisualizer() {
        overlay.style.display = 'none';
        iframe.src = 'about:blank';
        document.body.style.overflow = '';
    }

    // Listen for events from iframe
    window.addEventListener('message', (event) => {
        if (event.data.type === 'WIDGET_CLOSE') {
            closeVisualizer();
        }
        if (event.data.type === 'TRYON_SUCCESS') {
            console.log('[SaaS] Success:', event.data.image);
            // Here the client could handle the success event (e.g. tracking)
        }
    });

    // Auto-detect buttons
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-try-on]');
        if (target) {
            e.preventDefault();
            const imageUrl = target.getAttribute('data-image');
            const name = target.getAttribute('data-name');
            const category = target.getAttribute('data-category');
            const apiKey = target.getAttribute('data-api-key');

            // Collect generic options (data-opt-*)
            const options = {};
            Array.from(target.attributes).forEach(attr => {
                if (attr.name.startsWith('data-opt-')) {
                    const key = attr.name.replace('data-opt-', '');
                    options[key] = attr.value;
                }
            });

            if (imageUrl) {
                openVisualizer({
                    imageUrl,
                    name,
                    category,
                    apiKey,
                    options: Object.keys(options).length > 0 ? JSON.stringify(options) : null
                });
            } else {
                console.error('[SaaS] Missing data-image attribute');
            }
        }
    });

    // Public API
    window.SaaS = {
        open: openVisualizer,
        close: closeVisualizer
    };

    console.log('[SaaS] Widget Loaded');
})();
