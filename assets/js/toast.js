const wrap = document.getElementById('toast-wrap');

function createIcon(type) {
    // simple emoji icons — replace with SVGs if you prefer
    switch (type) {
    case 'success': return '✔️';
    case 'error':   return '✖️';
    case 'warn':    return '⚠️';
    default:        return 'ℹ️';
    }
}

/**
 * Show a toast.
 * options: { title?, message, type = 'info', duration = 4000 }
 */
function showToast({ title = '', message = '', type = 'info', duration = 5000 } = {}) {
    if (!message && !title) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    // build inner markup
    toast.innerHTML = `
    <div class="icon" aria-hidden="true">${createIcon(type)}</div>
    <div class="content">
        ${title ? `<div class="title">${escapeHtml(title)}</div>` : ''}
        <div class="message">${escapeHtml(message)}</div>
    </div>
    <button class="close" aria-label="Close notification">&times;</button>
    <div class="progress" aria-hidden="true"></div>
    `;

    // append to wrapper (top = first child)
    wrap.prepend(toast);

    // small timeout to trigger CSS transition for entrance
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // auto-remove after duration (with hide animation)
    let removeTimer = null;
    let start = Date.now();
    const progressEl = toast.querySelector('.progress');

    function setProgressPct() {
        if (!progressEl) return;
        const elapsed = Date.now() - start;
        const pct = Math.min(1, elapsed / Math.max(1, duration));
        progressEl.style.transform = `scaleX(${1 - pct})`;
    }

    function scheduleRemove() {
        if (duration === Infinity) return;
        removeTimer = setTimeout(() => removeToast(), duration);
    }

    function clearRemove() {
        if (removeTimer) {
            clearTimeout(removeTimer);
            removeTimer = null;
        }
    }

    function removeToast() {
        clearRemove();
        toast.classList.remove('show');
        toast.classList.add('hide');

        // wait for CSS transition to finish before removing from DOM
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, { once: true });
    }

    // update progress every ~60ms
    let progressInterval = null;
        if (duration !== Infinity) {
        progressInterval = setInterval(() => {
            setProgressPct();
        }, 60);
    }

    // Pause on hover: stop timer & progress
    toast.addEventListener('mouseenter', () => {
        clearRemove();
    });
    toast.addEventListener('mouseleave', () => {  
        // recalculate remaining time
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, duration - elapsed);
        start = Date.now() - (duration - remaining); // keep progress consistent
        if (remaining > 0) {
            removeTimer = setTimeout(removeToast, remaining);
        } else {
            removeToast();
        }
    });

    // Close button
    const closeBtn = toast.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        removeToast();
    });

    // schedule removal
    scheduleRemove();

    // cleanup function to stop intervals if toast removed early
    const cleanup = () => {
        if (progressInterval) clearInterval(progressInterval);
        clearRemove();
        };
        toast.addEventListener('transitionend', () => {
        // If removed from DOM, cleanup
        if (!document.body.contains(toast)) cleanup();
    });

    return {
        element: toast,
        remove: removeToast
    };
}

// small helper to escape HTML in user input
function escapeHtml(str) {
    return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Expose a simple API
window.showToast = showToast;
window.toast = {
    success: (titleOrMsg, msg) => {
        if (!msg) return showToast({ message: titleOrMsg, type: 'success' });
        return showToast({ title: titleOrMsg, message: msg, type: 'success' });
    },
    error: (titleOrMsg, msg) => {
        if (!msg) return showToast({ message: titleOrMsg, type: 'error' });
        return showToast({ title: titleOrMsg, message: msg, type: 'error' });
    },
    info: (titleOrMsg, msg) => {
        if (!msg) return showToast({ message: titleOrMsg, type: 'info' });
        return showToast({ title: titleOrMsg, message: msg, type: 'info' });
    },
    warn: (titleOrMsg, msg) => {
        if (!msg) return showToast({ message: titleOrMsg, type: 'warn' });
        return showToast({ title: titleOrMsg, message: msg, type: 'warn' });
    }
};