// Database class for IndexedDB
class Database {
    constructor() {
        this.dbName = 'BGP_Database';
        this.dbVersion = 4;
        this.db = null;
        this.isReady = false;
        this.initPromise = null;
    }

    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                console.log('Database ready');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Creating database tables version 4...');
                
                // Удаляем старые таблицы если есть
                if (db.objectStoreNames.contains('users')) {
                    db.deleteObjectStore('users');
                }
                if (db.objectStoreNames.contains('orders')) {
                    db.deleteObjectStore('orders');
                }
                
                // Таблица пользователей
                const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                userStore.createIndex('email', 'email', { unique: true });
                userStore.createIndex('role', 'role', { unique: false });
                console.log('Users table created with indexes');
                
                // Таблица заказов
                const orderStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
                orderStore.createIndex('customerId', 'customerId', { unique: false });
                orderStore.createIndex('carrierId', 'carrierId', { unique: false });
                orderStore.createIndex('status', 'status', { unique: false });
                console.log('Orders table created with indexes');
            };
        });

        return this.initPromise;
    }

    async ensureReady() {
        if (!this.isReady) {
            await this.init();
        }
        return this.db;
    }

    // ========== USER METHODS ==========
    async addUser(user) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.add(user);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserByEmail(email) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('email');
            const request = index.get(email);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserById(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(parseInt(id));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateUser(id, updates) {
        await this.ensureReady();
        return new Promise(async (resolve, reject) => {
            try {
                const user = await this.getUserById(id);
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }
                Object.assign(user, updates);
                const transaction = this.db.transaction(['users'], 'readwrite');
                const store = transaction.objectStore('users');
                const request = store.put(user);
                request.onsuccess = () => resolve(user);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async deleteUser(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllUsers() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getUsersByRole(role) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('role');
            const request = index.getAll(role);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // ========== ORDER METHODS ==========
    async addOrder(order) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const newOrder = {
                customerId: parseInt(order.customerId),
                carrierId: null,
                pickup: order.pickup,
                delivery: order.delivery,
                weight: parseFloat(order.weight),
                vehicle: order.vehicle,
                description: order.description || '',
                price: parseFloat(order.price),
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const transaction = this.db.transaction(['orders'], 'readwrite');
            const store = transaction.objectStore('orders');
            const request = store.add(newOrder);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllOrders() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['orders'], 'readonly');
            const store = transaction.objectStore('orders');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getOrdersByCustomer(customerId) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['orders'], 'readonly');
            const store = transaction.objectStore('orders');
            const index = store.index('customerId');
            const request = index.getAll(parseInt(customerId));
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getOrdersByCarrier(carrierId) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['orders'], 'readonly');
            const store = transaction.objectStore('orders');
            const index = store.index('carrierId');
            const request = index.getAll(parseInt(carrierId));
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingOrders() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['orders'], 'readonly');
                const store = transaction.objectStore('orders');
                const index = store.index('status');
                const request = index.getAll('pending');
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('Error getting pending orders:', error);
                resolve([]);
            }
        });
    }

    async getOrderById(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['orders'], 'readonly');
            const store = transaction.objectStore('orders');
            const request = store.get(parseInt(id));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async acceptOrder(orderId, carrierId) {
        await this.ensureReady();
        return new Promise(async (resolve, reject) => {
            try {
                const order = await this.getOrderById(orderId);
                if (!order) {
                    reject(new Error('Заказ не найден'));
                    return;
                }
                if (order.status !== 'pending') {
                    reject(new Error('Заказ уже взят другим перевозчиком'));
                    return;
                }
                
                order.carrierId = parseInt(carrierId);
                order.status = 'in_progress';
                order.updatedAt = new Date().toISOString();
                
                const transaction = this.db.transaction(['orders'], 'readwrite');
                const store = transaction.objectStore('orders');
                const request = store.put(order);
                request.onsuccess = () => resolve(order);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async completeOrder(orderId) {
        await this.ensureReady();
        return new Promise(async (resolve, reject) => {
            try {
                const order = await this.getOrderById(orderId);
                if (!order) {
                    reject(new Error('Заказ не найден'));
                    return;
                }
                
                order.status = 'completed';
                order.updatedAt = new Date().toISOString();
                
                const transaction = this.db.transaction(['orders'], 'readwrite');
                const store = transaction.objectStore('orders');
                const request = store.put(order);
                request.onsuccess = () => resolve(order);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async cancelOrder(orderId) {
        await this.ensureReady();
        return new Promise(async (resolve, reject) => {
            try {
                const order = await this.getOrderById(orderId);
                if (!order) {
                    reject(new Error('Заказ не найден'));
                    return;
                }
                
                order.status = 'cancelled';
                order.updatedAt = new Date().toISOString();
                
                const transaction = this.db.transaction(['orders'], 'readwrite');
                const store = transaction.objectStore('orders');
                const request = store.put(order);
                request.onsuccess = () => resolve(order);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }
}

const db = new Database();

// Initialize database and clear old data
(async function initDatabase() {
    try {
        // Очищаем старую базу данных если есть
        const databases = await indexedDB.databases();
        const oldDb = databases.find(db => db.name === 'BGP_Database');
        if (oldDb && oldDb.version < 4) {
            console.log('Deleting old database...');
            indexedDB.deleteDatabase('BGP_Database');
        }
        
        await db.init();
        console.log('Database initialized');
        
        // Create test users if not exists
        const testCustomer = await db.getUserByEmail('customer@test.com');
        if (!testCustomer) {
            await db.addUser({
                name: 'Тестовый Заказчик',
                email: 'customer@test.com',
                phone: '+7 (999) 111-22-33',
                password: '123456',
                role: 'customer',
                createdAt: new Date().toISOString()
            });
            console.log('Test customer created: customer@test.com / 123456');
        }
        
        const testCarrier = await db.getUserByEmail('carrier@test.com');
        if (!testCarrier) {
            await db.addUser({
                name: 'Тестовый Перевозчик',
                email: 'carrier@test.com',
                phone: '+7 (999) 444-55-66',
                password: '123456',
                role: 'carrier',
                createdAt: new Date().toISOString()
            });
            console.log('Test carrier created: carrier@test.com / 123456');
        }
        
        // Create sample order if no orders
        const allOrders = await db.getAllOrders();
        if (allOrders.length === 0) {
            const customer = await db.getUserByEmail('customer@test.com');
            if (customer) {
                await db.addOrder({
                    customerId: customer.id,
                    pickup: 'Москва, ул. Тверская 1',
                    delivery: 'Санкт-Петербург, Невский пр. 10',
                    weight: 500,
                    vehicle: 'gas',
                    description: 'Хрупкий груз, требуется осторожная перевозка',
                    price: 3500
                });
                console.log('Sample order created');
                
                // Create another sample order
                await db.addOrder({
                    customerId: customer.id,
                    pickup: 'Казань, ул. Баумана 20',
                    delivery: 'Екатеринбург, пр. Ленина 50',
                    weight: 1200,
                    vehicle: 'small_truck',
                    description: 'Строительные материалы',
                    price: 8500
                });
                console.log('Second sample order created');
            }
        }
        
        console.log('Database initialization complete');
    } catch (error) {
        console.error('Database init error:', error);
    }
})();