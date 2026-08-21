/**
 * ZaLo Smart - Global Error Handler
 * Manages errors safely and prevents intrusive blocking popups during background operations.
 */

function showZaLoErrorAlert(message, title = "تنبيه") {
    // Show non-blocking toast or clean modal only for user-initiated critical actions
    if (typeof window.showToast === 'function') {
        window.showToast(message);
    } else if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'warning',
            title: title,
            text: message,
            confirmButtonColor: '#d4af37',
            confirmButtonText: 'حسناً'
        });
    } else {
        console.warn(`[ZaLo Alert] ${title}: ${message}`);
    }
}

// Log unhandled Promise rejections safely to console without blocking the UI
window.addEventListener('unhandledrejection', function (event) {
    console.warn('[ZaLo Background Event Handled]:', event.reason);
    // Do not pop up alerts for background retries, network hiccups, or guest checks
    event.preventDefault();
});

// Catch synchronous errors without blocking the user
window.addEventListener('error', function (event) {
    console.warn('[ZaLo Script Notice]:', event.message || event.error);
});

window.zaloErrorHandler = {
    showError: showZaLoErrorAlert
};

