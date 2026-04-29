async function loadComponents() {
    try {
        const headerResponse = await fetch('components/header.html');
        const headerHtml = await headerResponse.text();
        document.body.insertAdjacentHTML('afterbegin', headerHtml);
        
        const footerResponse = await fetch('components/footer.html');
        const footerHtml = await footerResponse.text();
        document.body.insertAdjacentHTML('beforeend', footerHtml);
        
        updateNavigation();
    } catch (error) {
        console.error('Ошибка загрузки компонентов:', error);
    }
}

function updateNavigation() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    
    if (auth.isAuthenticated()) {
        const user = auth.getCurrentUser();
        nav.innerHTML = `
            <li><a href="index.html"><i class="fas fa-home"></i> Главная</a></li>
            <li><a href="create-order.html"><i class="fas fa-plus"></i> Создать заявку</a></li>
            <li><a href="orders.html"><i class="fas fa-list"></i> Мои заявки</a></li>
            <li><a href="profile.html"><i class="fas fa-user"></i> Профиль</a></li>
            <li><a href="#" onclick="auth.logout(); return false;"><i class="fas fa-sign-out-alt"></i> Выход</a></li>
        `;
    } else {
        nav.innerHTML = `
            <li><a href="index.html"><i class="fas fa-home"></i> Главная</a></li>
            <li><a href="register.html"><i class="fas fa-user-plus"></i> Регистрация</a></li>
            <li><a href="login.html"><i class="fas fa-sign-in-alt"></i> Вход</a></li>
        `;
    }
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alert');
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

document.addEventListener('DOMContentLoaded', async () => {
    await db.init();
    await loadComponents();
    checkAuth();
});