class Auth {
    constructor() {
        this.currentUser = null;
    }

    async register(userData) {
        const existingUser = await db.getUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('Пользователь с таким email уже существует');
        }

        if (userData.password !== userData.confirmPassword) {
            throw new Error('Пароли не совпадают');
        }

        if (userData.password.length < 6) {
            throw new Error('Пароль должен быть не менее 6 символов');
        }

        const userId = await db.addUser({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            role: userData.role,
            createdAt: new Date().toISOString()
        });

        const user = await db.getUserById(userId);
        this.setSession(user);
        return user;
    }

    async login(email, password) {
        const user = await db.getUserByEmail(email);
        
        if (!user || user.password !== password) {
            throw new Error('Неверный email или пароль');
        }

        this.setSession(user);
        return user;
    }

    setSession(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        }));
    }

    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            return this.currentUser;
        }
        return null;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    isAuthenticated() {
        return !!this.getCurrentUser();
    }

    async resetPassword(email, newPassword) {
        const user = await db.getUserByEmail(email);
        if (!user) {
            throw new Error('Пользователь с таким email не найден');
        }
        
        if (newPassword.length < 6) {
            throw new Error('Пароль должен быть не менее 6 символов');
        }

        await db.updateUser(user.id, { password: newPassword });
        return true;
    }

    async updateProfile(userId, updates) {
        const updatedUser = await db.updateUser(userId, updates);
        this.setSession(updatedUser);
        return updatedUser;
    }

    async deleteAccount(userId) {
        const orders = await db.getOrdersByCustomer(userId);
        for (const order of orders) {
            await db.deleteOrder(order.id);
        }
        await db.deleteUser(userId);
        this.logout();
    }
}

const auth = new Auth();

function checkAuth() {
    const protectedPages = ['profile.html', 'my-orders.html', 'create-order.html', 'available-orders.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    
    if ((currentPage === 'login.html' || currentPage === 'register.html' || currentPage === 'forgot-password.html') && auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}