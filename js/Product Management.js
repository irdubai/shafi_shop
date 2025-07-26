// =====================================================
// مدیریت محصولات (Product Management)
// =====================================================

// مدل داده محصول
class Product {
    constructor(
        id = null,
        sku = '',
        name = '',
        category = '',
        supplier = '',
        stock = 0,
        minStock = 0,
        purchasePrice = 0,
        sellingPrice = 0,
        unit = 'عدد',
        currency = 'AED',
        description = '',
        isActive = true
    ) {
        this.id = id || Date.now();
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.supplier = supplier || '';
        this.stock = Number(stock) || 0;
        this.minStock = Number(minStock) || 0;
        this.purchasePrice = Number(purchasePrice) || 0;
        this.sellingPrice = Number(sellingPrice) || 0;
        this.unit = unit || 'عدد';
        this.currency = currency || 'AED';
        this.description = description || '';
        this.isActive = isActive;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // محاسبه سود
    getProfitMargin() {
        if (this.purchasePrice <= 0) return 0;
        return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
    }

    // وضعیت موجودی
    getStockStatus() {
        if (this.stock <= 0) return 'ناموجود';
        if (this.stock <= this.minStock) return 'موجودی کم';
        return 'موجود';
    }

    // بروزرسانی محصول
    update(data) {
        this.sku = data.sku || this.sku;
        this.name = data.name || this.name;
        this.category = data.category || this.category;
        this.supplier = data.supplier !== undefined ? data.supplier : this.supplier;
        this.stock = data.stock !== undefined ? Number(data.stock) : this.stock;
        this.minStock = data.minStock !== undefined ? Number(data.minStock) : this.minStock;
        this.purchasePrice = data.purchasePrice !== undefined ? Number(data.purchasePrice) : this.purchasePrice;
        this.sellingPrice = data.sellingPrice !== undefined ? Number(data.sellingPrice) : this.sellingPrice;
        this.unit = data.unit || this.unit;
        this.currency = data.currency || this.currency;
        this.description = data.description !== undefined ? data.description : this.description;
        this.isActive = data.isActive !== undefined ? data.isActive : this.isActive;
        this.updatedAt = new Date().toISOString();
    }

    // بروزرسانی موجودی
    updateStock(quantity) {
        this.stock += Number(quantity);
        this.updatedAt = new Date().toISOString();
    }
}

// مدیریت محصولات
class ProductManager {
    constructor() {
        this.products = [];
        this.loadProducts();
    }

    // بارگذاری محصولات از localStorage
    loadProducts() {
        const productsData = localStorage.getItem('shafi_products');
        if (productsData) {
            try {
                const parsed = JSON.parse(productsData);
                this.products = parsed.map(p => {
                    const product = new Product(
                        p.id, p.sku, p.name, p.category, p.supplier,
                        p.stock, p.minStock, p.purchasePrice, p.sellingPrice,
                        p.unit, p.currency, p.description, p.isActive
                    );
                    product.createdAt = p.createdAt || product.createdAt;
                    product.updatedAt = p.updatedAt || product.updatedAt;
                    return product;
                });
            } catch (e) {
                console.error('Error loading products:', e);
                this.products = [];
            }
        }
    }

    // ذخیره محصولات در localStorage
    saveProducts() {
        localStorage.setItem('shafi_products', JSON.stringify(this.products));
    }

    // دریافت تمام محصولات
    getAllProducts() {
        return [...this.products];
    }

    // دریافت محصول با ID
    getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    // دریافت محصول با SKU
    getProductBySku(sku) {
        return this.products.find(p => p.sku === sku);
    }

    // افزودن محصول جدید
    addProduct(productData) {
        // بررسی تکراری نبودن SKU
        if (productData.sku && this.getProductBySku(productData.sku)) {
            throw new Error('کد محصول (SKU) تکراری است');
        }

        const product = new Product(
            null,
            productData.sku || this.generateNewSku(),
            productData.name,
            productData.category,
            productData.supplier,
            productData.stock,
            productData.minStock,
            productData.purchasePrice,
            productData.sellingPrice,
            productData.unit,
            productData.currency,
            productData.description,
            productData.isActive !== undefined ? productData.isActive : true
        );

        this.products.push(product);
        this.saveProducts();
        this.addActivity(`محصول جدید «${product.name}» اضافه شد.`);
        return product;
    }

    // بروزرسانی محصول
    updateProduct(id, productData) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) {
            throw new Error('محصول یافت نشد');
        }

        // بررسی تکراری نبودن SKU
        if (productData.sku !== this.products[index].sku) {
            const existingProduct = this.getProductBySku(productData.sku);
            if (existingProduct && existingProduct.id !== id) {
                throw new Error('کد محصول (SKU) تکراری است');
            }
        }

        this.products[index].update(productData);
        this.saveProducts();
        this.addActivity(`محصول «${this.products[index].name}» بروزرسانی شد.`);
        return this.products[index];
    }

    // حذف محصول
    deleteProduct(id) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) {
            throw new Error('محصول یافت نشد');
        }

        const productName = this.products[index].name;
        this.products.splice(index, 1);
        this.saveProducts();
        this.addActivity(`محصول «${productName}» حذف شد.`);
        return true;
    }

    // جستجوی محصولات
    searchProducts(query = '', options = {}) {
        if (!query && !options.category && !options.stockStatus) {
            return this.getAllProducts();
        }

        return this.products.filter(product => {
            const matchesQuery = !query ||
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.sku.toLowerCase().includes(query.toLowerCase()) ||
                product.category.toLowerCase().includes(query.toLowerCase());

            const matchesCategory = !options.category || product.category === options.category;

            const matchesStockStatus = !options.stockStatus ||
                (options.stockStatus === 'inStock' && product.stock > product.minStock) ||
                (options.stockStatus === 'lowStock' && product.stock <= product.minStock && product.stock > 0) ||
                (options.stockStatus === 'outOfStock' && product.stock <= 0);

            return matchesQuery && matchesCategory && matchesStockStatus;
        });
    }

    // تولید SKU جدید
    generateNewSku() {
        const prefix = 'PRD';
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}${timestamp}`;
    }

    // ثبت فعالیت
    addActivity(description) {
        if (typeof ActivitiesManager !== 'undefined') {
            const activitiesManager = new ActivitiesManager();
            activitiesManager.addActivity({
                module: 'products',
                description,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// UI Functions
function loadProductsTable() {
    if (!productManager) return;
    
    const products = productManager.getAllProducts();
    const tableBody = document.getElementById('productsTableBody');
    
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">هیچ محصولی یافت نشد</td></tr>';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        const stockStatus = product.getStockStatus();
        let statusClass = '';
        
        if (stockStatus === 'ناموجود') statusClass = 'text-danger';
        else if (stockStatus === 'موجودی کم') statusClass = 'text-warning';
        else statusClass = 'text-success';

        row.innerHTML = `
            <td>${product.sku}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td class="${statusClass}">${product.stock} ${product.unit}</td>
            <td>${product.purchasePrice.toLocaleString()} ${product.currency}</td>
            <td>${product.sellingPrice.toLocaleString()} ${product.currency}</td>
            <td><span class="badge ${product.isActive ? 'badge-success' : 'badge-secondary'}">${product.isActive ? 'فعال' : 'غیرفعال'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openProductModal(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function searchProducts() {
    if (!productManager) return;
    
    const searchQuery = document.getElementById('productSearch').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;

    const filteredProducts = productManager.searchProducts(searchQuery, {
        category: categoryFilter,
        stockStatus: stockFilter
    });

    renderProductsTable(filteredProducts);
}

function renderProductsTable(products) {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">هیچ محصولی یافت نشد</td></tr>';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        const stockStatus = product.getStockStatus();
        let statusClass = '';
        
        if (stockStatus === 'ناموجود') statusClass = 'text-danger';
        else if (stockStatus === 'موجودی کم') statusClass = 'text-warning';
        else statusClass = 'text-success';

        row.innerHTML = `
            <td>${product.sku}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td class="${statusClass}">${product.stock} ${product.unit}</td>
            <td>${product.purchasePrice.toLocaleString()} ${product.currency}</td>
            <td>${product.sellingPrice.toLocaleString()} ${product.currency}</td>
            <td><span class="badge ${product.isActive ? 'badge-success' : 'badge-secondary'}">${product.isActive ? 'فعال' : 'غیرفعال'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openProductModal(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}
