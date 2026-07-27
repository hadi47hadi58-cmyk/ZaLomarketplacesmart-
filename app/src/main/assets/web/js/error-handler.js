/**
 * ZaLo Smart - Global Error Handler
 * Prevents silent failures by catching unhandled promise rejections and errors.
 */

function showZaLoErrorAlert(message, title = "خطأ في النظام") {
    // If SweetAlert2 is available, use it for better UI
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'حسناً'
        });
    } else {
        alert(`${title}\n\n${message}`);
    }
}

// Catch unhandled Promise rejections (e.g. failed Supabase network calls)
window.addEventListener('unhandledrejection', function (event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    let message = 'حدث خطأ غير متوقع أثناء معالجة طلبك.';
    
    if (event.reason) {
        if (event.reason.message && event.reason.message.includes('Failed to fetch')) {
            message = 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.';
        } else if (event.reason.code && event.reason.details) {
            // Likely a Supabase error
            message = `خطأ في قاعدة البيانات: ${event.reason.message}`;
        }
    }
    
    showZaLoErrorAlert(message);
});

// Catch synchronous errors
window.addEventListener('error', function (event) {
    console.error('Global error caught:', event.error);
    // Ignore harmless script errors that don't need user interruption, 
    // but log them. We only alert for critical failures if needed.
});

window.zaloErrorHandler = {
    showError: showZaLoErrorAlert
};
