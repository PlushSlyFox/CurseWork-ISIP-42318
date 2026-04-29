// Load header and footer
async function loadComponents() {
    try {
        const headerResponse = await fetch('components/header.html');
        const headerHtml = await headerResponse.text();
        document.getElementById('header-placeholder').innerHTML = headerHtml;
        
        const footerResponse = await fetch('components/footer.html');
        const footerHtml = await footerResponse.text();
        document.getElementById('footer-placeholder').innerHTML = footerHtml;
        
        updateNavigation();
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// Update navigation based on auth status and role
function updateNavigation() {
    const nav = document.getElementById('mainNav');
    if (!nav) return;
    
    if (auth.isAuthenticated()) {
        const user = auth.getCurrentUser();
        
        if (user.role === 'customer') {
            nav.innerHTML = `
                <li><a href="index.html"><i class="fas fa-home"></i> Главная</a></li>
                <li><a href="create-order.html"><i class="fas fa-plus"></i> Создать заявку</a></li>
                <li><a href="my-orders.html"><i class="fas fa-list"></i> Мои заказы</a></li>
                <li><a href="profile.html"><i class="fas fa-user"></i> Профиль</a></li>
                <li><a href="#" onclick="auth.logout(); return false;"><i class="fas fa-sign-out-alt"></i> Выход</a></li>
            `;
        } else {
            nav.innerHTML = `
                <li><a href="index.html"><i class="fas fa-home"></i> Главная</a></li>
                <li><a href="available-orders.html"><i class="fas fa-truck"></i> Доступные заказы</a></li>
                <li><a href="my-orders.html"><i class="fas fa-list"></i> Мои заказы</a></li>
                <li><a href="profile.html"><i class="fas fa-user"></i> Профиль</a></li>
                <li><a href="#" onclick="auth.logout(); return false;"><i class="fas fa-sign-out-alt"></i> Выход</a></li>
            `;
        }
    } else {
        nav.innerHTML = `
            <li><a href="index.html"><i class="fas fa-home"></i> Главная</a></li>
            <li><a href="register.html"><i class="fas fa-user-plus"></i> Регистрация</a></li>
            <li><a href="login.html"><i class="fas fa-sign-in-alt"></i> Вход</a></li>
        `;
    }
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.textContent = message;
        alertDiv.className = `alert ${type}`;
        alertDiv.style.display = 'flex';
        
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadComponents();
    
    setTimeout(() => {
        checkAuth();
        
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        setTimeout(() => {
            const links = document.querySelectorAll('nav ul li a');
            links.forEach(link => {
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                }
            });
        }, 100);
    }, 100);
});