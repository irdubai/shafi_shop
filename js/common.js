// =====================================================
// مقداردهی اولیه و مدیریت ورود
// =====================================================

// متغیرهای سراسری برای مدیران
window.productManager = null;
window.customerManager = null;
window.invoiceManager = null;
window.accountingManager = null;
window.activitiesManager = null;

// بارگذاری اولیه در هنگام آماده شدن DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // مقداردهی اولیه کلاس‌ها
    initializeManagers();
    
    // بررسی وضعیت ورود
    checkAuthStatus();
    
    // اتصال event listeners
    attachEventListeners();
});

// تابع مقداردهی اولیه مدیران
function initializeManagers() {
    try {
        // ابتدا باید کلاس‌ها تعریف شده باشند
        if (typeof ProductManager !== 'undefined') {
            window.productManager = new ProductManager();
        }
        
        if (typeof CustomerManager !== 'undefined') {
            window.customerManager = new CustomerManager();
        }
        
        if (typeof InvoiceManager !== 'undefined') {
            window.invoiceManager = new InvoiceManager();
        }
        
        if (typeof AccountingManager !== 'undefined') {
            window.accountingManager = new AccountingManager();
        }
        
        if (typeof ActivitiesManager !== 'undefined') {
            window.activitiesManager = new ActivitiesManager();
        }
        
        console.log('Managers initialized successfully');
    } catch (error) {
        console.error('Error initializing managers:', error);
    }
}

// تابع اتصال Event Listeners
function attachEventListeners() {
    // فرم ورود
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // دکمه‌های محصول
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            openProductModal();
        });
    }
    
    // فرم محصول
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProduct();
        });
    }
    
    // دکمه‌های مشتری
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function() {
            openCustomerModal();
        });
    }
    
    // فرم مشتری
    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveCustomer();
        });
    }
    
    // دکمه‌های فاکتور
    const addInvoiceBtn = document.getElementById('addInvoiceBtn');
    if (addInvoiceBtn) {
        addInvoiceBtn.addEventListener('click', function() {
            openInvoiceModal();
        });
    }
    
    // فرم فاکتور
    const invoiceForm = document.getElementById('invoiceForm');
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveInvoice();
        });
    }
    
    // دکمه‌های هزینه
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function() {
            openExpenseModal();
        });
    }
    
    // فرم هزینه
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveExpense();
        });
    }
    
    // جستجو محصولات
    const productSearch = document.getElementById('productSearch');
    if (productSearch) {
        productSearch.addEventListener('input', searchProducts);
    }
    
    // فیلتر دسته محصولات
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    // جستجو مشتریان
    const customerSearch = document.getElementById('customerSearch');
    if (customerSearch) {
        customerSearch.addEventListener('input', searchCustomers);
    }
    
    // فیلترهای مشتری
    const customerTypeFilter = document.getElementById('customerTypeFilter');
    if (customerTypeFilter) {
        customerTypeFilter.addEventListener('change', searchCustomers);
    }
    
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        cityFilter.addEventListener('change', searchCustomers);
    }
    
    const balanceFilter = document.getElementById('balanceFilter');
    if (balanceFilter) {
        balanceFilter.addEventListener('change', searchCustomers);
    }
    
    // بستن مودال‌ها با کلیک خارج از آنها
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    console.log('Event listeners attached');
}

// =====================================================
// مدیریت ورود و احراز هویت
// =====================================================

function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('shafi_logged_in');
    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');
    const loadingDiv = document.querySelector('.loading');
    
    // مخفی کردن loading
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
    
    if (isLoggedIn === 'true') {
        // کاربر وارد شده است
        if (loginSection) loginSection.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        
        // نمایش نام کاربر
        const username = localStorage.getItem('shafi_username') || 'مدیر سیستم';
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = username;
        }
        
        // بارگذاری داده‌ها
        loadInitialData();
    } else {
        // کاربر وارد نشده است
        if (loginSection) loginSection.style.display = 'block';
        if (mainApp) mainApp.style.display = 'none';
    }
}

function handleLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.login-button');
    const loginError = document.getElementById('loginError');
    
    // پاک کردن خطای قبلی
    if (loginError) {
        loginError.style.display = 'none';
        loginError.textContent = '';
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // نمایش حالت loading
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ورود...';
    }
    
    // شبیه‌سازی تاخیر برای بررسی
    setTimeout(() => {
        // بررسی اطلاعات ورود
        if (username === 'admin' && password === '123456') {
            // ورود موفق
            localStorage.setItem('shafi_logged_in', 'true');
            localStorage.setItem('shafi_username', username);
            localStorage.setItem('shafi_login_time', new Date().toISOString());
            
            // نمایش پیام موفقیت
            showNotification('ورود با موفقیت انجام شد', 'success');
            
            // مخفی کردن فرم ورود و نمایش برنامه
            const loginSection = document.getElementById('loginSection');
            const mainApp = document.getElementById('mainApp');
            
            if (loginSection) loginSection.style.display = 'none';
            if (mainApp) mainApp.style.display = 'block';
            
            // نمایش نام کاربر
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = username;
            }
            
            // مقداردهی مجدد مدیران در صورت نیاز
            if (!window.productManager || !window.customerManager) {
                initializeManagers();
            }
            
            // بارگذاری داده‌های اولیه
            loadInitialData();
            
        } else {
            // ورود ناموفق
            if (loginError) {
                loginError.textContent = 'نام کاربری یا رمز عبور اشتباه است';
                loginError.style.display = 'block';
            } else {
                showNotification('نام کاربری یا رمز عبور اشتباه است', 'error');
            }
            
            // پاک کردن فیلد رمز عبور
            passwordInput.value = '';
            passwordInput.focus();
        }
        
        // برگرداندن دکمه به حالت عادی
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.innerHTML = 'ورود';
        }
        
    }, 1000);
}

function logout() {
    if (confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟')) {
        // پاک کردن اطلاعات ورود
        localStorage.removeItem('shafi_logged_in');
        localStorage.removeItem('shafi_username');
        localStorage.removeItem('shafi_login_time');
        
        // نمایش پیام
        showNotification('با موفقیت خارج شدید', 'info');
        
        // بارگذاری مجدد صفحه
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
}

// =====================================================
// مدیریت محصولات
// =====================================================

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    
    if (!modal || !form) {
        console.error('Product modal or form not found');
        return;
    }
    
    // پاک کردن فرم
    form.reset();
    
    if (productId) {
        // حالت ویرایش
        const product = window.productManager.getProductById(productId);
        
        if (product) {
            modalTitle.textContent = 'ویرایش محصول';
            
            // پر کردن فرم با داده‌های محصول
            form.elements.productId.value = product.id;
            form.elements.code.value = product.code;
            form.elements.name.value = product.name;
            form.elements.category.value = product.category;
            form.elements.unit.value = product.unit;
            form.elements.price.value = product.price;
            form.elements.cost.value = product.cost;
            form.elements.stock.value = product.stock;
            form.elements.minStock.value = product.minStock;
            form.elements.description.value = product.description || '';
        }
    } else {
        // حالت افزودن
        modalTitle.textContent = 'محصول جدید';
        
        // تولید کد محصول جدید
        form.elements.code.value = window.productManager.generateNewProductCode();
    }
    
    // نمایش مودال
    modal.style.display = 'block';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveProduct() {
    const form = document.getElementById('productForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const productData = {
            code: form.elements.code.value.trim(),
            name: form.elements.name.value.trim(),
            category: form.elements.category.value,
            unit: form.elements.unit.value,
            price: Number(form.elements.price.value),
            cost: Number(form.elements.cost.value),
            stock: Number(form.elements.stock.value),
            minStock: Number(form.elements.minStock.value),
            description: form.elements.description.value.trim()
        };
        
        const productId = form.elements.productId.value;
        
        if (productId) {
            // بروزرسانی محصول موجود
            window.productManager.updateProduct(Number(productId), productData);
            showNotification('محصول با موفقیت بروزرسانی شد', 'success');
        } else {
            // افزودن محصول جدید
            window.productManager.addProduct(productData);
            showNotification('محصول جدید با موفقیت اضافه شد', 'success');
        }
        
        // بستن مودال و بروزرسانی جدول
        closeProductModal();
        loadProductsTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function deleteProduct(productId) {
    if (!confirm('آیا از حذف این محصول اطمینان دارید؟')) {
        return;
    }
    
    try {
        window.productManager.deleteProduct(Number(productId));
        
        showNotification('محصول با موفقیت حذف شد', 'success');
        loadProductsTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function searchProducts() {
    const searchQuery = document.getElementById('productSearch').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    filterProducts(searchQuery, categoryFilter);
}

function filterProducts(searchQuery, categoryFilter) {
    const query = searchQuery !== undefined ? searchQuery : document.getElementById('productSearch').value;
    const category = categoryFilter !== undefined ? categoryFilter : document.getElementById('categoryFilter').value;
    
    const filteredProducts = window.productManager.searchProducts(query, { category });
    
    renderProductsTable(filteredProducts);
}

function loadProductsTable() {
    const products = window.productManager.getAllProducts();
    renderProductsTable(products);
    updateCategoryFilter();
}

function updateCategoryFilter() {
    const categories = window.productManager.getCategories();
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (!categoryFilter) return;
    
    const currentSelection = categoryFilter.value;
    
    // پاک کردن همه گزینه‌ها به جز اولی
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // اضافه کردن دسته‌ها
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // بازگرداندن انتخاب قبلی
    if (categories.includes(currentSelection)) {
        categoryFilter.value = currentSelection;
    }
}

function renderProductsTable(products) {
    const tableBody = document.getElementById('productsTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="8" class="text-center">هیچ محصولی یافت نشد</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // رنگ ردیف بر اساس موجودی
        if (product.stock <= 0) {
            row.classList.add('stock-empty');
        } else if (product.stock <= product.minStock) {
            row.classList.add('stock-warning');
        }
        
        row.innerHTML = `
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.unit}</td>
            <td>${product.price.toLocaleString()}</td>
            <td>${product.cost.toLocaleString()}</td>
            <td>
                <span class="${product.stock <= product.minStock ? 'text-danger' : ''}">
                    ${product.stock}
                </span>
            </td>
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

// =====================================================
// مدیریت مشتریان
// =====================================================

function openCustomerModal(customerId = null) {
    const modal = document.getElementById('customerModal');
    const modalTitle = document.getElementById('customerModalTitle');
    const form = document.getElementById('customerForm');
    
    if (!modal || !form) {
        console.error('Customer modal or form not found');
        return;
    }
    
    // پاک کردن فرم
    form.reset();
    
    if (customerId) {
        // حالت ویرایش
        const customer = window.customerManager.getCustomerById(customerId);
        
        if (customer) {
            modalTitle.textContent = 'ویرایش مشتری';
            
            // پر کردن فرم با داده‌های مشتری
            form.elements.customerId.value = customer.id;
            form.elements.code.value = customer.code;
            form.elements.name.value = customer.name;
            form.elements.company.value = customer.company || '';
            form.elements.phone.value = customer.phone || '';
            form.elements.email.value = customer.email || '';
            form.elements.address.value = customer.address || '';
            form.elements.city.value = customer.city || '';
            form.elements.country.value = customer.country || '';
            form.elements.notes.value = customer.notes || '';
            form.elements.balance.value = customer.balance;
            form.elements.currency.value = customer.currency;
            form.elements.vatNumber.value = customer.vatNumber || '';
            form.elements.customerType.value = customer.customerType;
            form.elements.isActive.checked = customer.isActive;
        }
    } else {
        // حالت افزودن
        modalTitle.textContent = 'مشتری جدید';
        
        // تولید کد مشتری جدید
        form.elements.code.value = window.customerManager.generateNewCustomerCode();
        form.elements.currency.value = 'AED';
        form.elements.customerType.value = 'retail';
        form.elements.balance.value = '0';
    }
    
    // نمایش مودال
    modal.style.display = 'block';
}

function closeCustomerModal() {
    const modal = document.getElementById('customerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveCustomer() {
    const form = document.getElementById('customerForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const customerData = {
            code: form.elements.code.value.trim(),
            name: form.elements.name.value.trim(),
            company: form.elements.company.value.trim(),
            phone: form.elements.phone.value.trim(),
            email: form.elements.email.value.trim(),
            address: form.elements.address.value.trim(),
            city: form.elements.city.value.trim(),
            country: form.elements.country.value.trim(),
            notes: form.elements.notes.value.trim(),
            balance: Number(form.elements.balance.value),
            currency: form.elements.currency.value,
            vatNumber: form.elements.vatNumber.value.trim(),
            customerType: form.elements.customerType.value,
            isActive: form.elements.isActive.checked
        };
        
        const customerId = form.elements.customerId.value;
        
        if (customerId) {
            // بروزرسانی مشتری موجود
            window.customerManager.updateCustomer(Number(customerId), customerData);
            showNotification('مشتری با موفقیت بروزرسانی شد', 'success');
        } else {
            // افزودن مشتری جدید
            window.customerManager.addCustomer(customerData);
            showNotification('مشتری جدید با موفقیت اضافه شد', 'success');
        }
        
        // بستن مودال و بروزرسانی جدول
        closeCustomerModal();
        loadCustomersTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function deleteCustomer(customerId) {
    if (!confirm('آیا از حذف این مشتری اطمینان دارید؟')) {
        return;
    }
    
    try {
        window.customerManager.deleteCustomer(Number(customerId));
        
        showNotification('مشتری با موفقیت حذف شد', 'success');
        loadCustomersTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function searchCustomers() {
    const searchQuery = document.getElementById('customerSearch').value;
    const customerTypeFilter = document.getElementById('customerTypeFilter').value;
    const cityFilter = document.getElementById('cityFilter').value;
    const balanceFilter = document.getElementById('balanceFilter').value;
    
    filterCustomers(searchQuery, customerTypeFilter, cityFilter, balanceFilter);
}

function filterCustomers(searchQuery, customerTypeFilter, cityFilter, balanceFilter) {
    const query = searchQuery !== undefined ? searchQuery : document.getElementById('customerSearch').value;
    const customerType = customerTypeFilter !== undefined ? customerTypeFilter : document.getElementById('customerTypeFilter').value;
    const city = cityFilter !== undefined ? cityFilter : document.getElementById('cityFilter').value;
    const balanceStatus = balanceFilter !== undefined ? balanceFilter : document.getElementById('balanceFilter').value;
    
    const filteredCustomers = window.customerManager.searchCustomers(query, {
        customerType: customerType,
        city: city,
        balanceStatus: balanceStatus
    });
    
    renderCustomersTable(filteredCustomers);
}

function loadCustomersTable() {
    const customers = window.customerManager.getAllCustomers();
    renderCustomersTable(customers);
    updateCityFilter();
}

function updateCityFilter() {
    const cities = window.customerManager.getCities();
    const cityFilter = document.getElementById('cityFilter');
    
    if (!cityFilter) return;
    
    const currentSelection = cityFilter.value;
    
    // پاک کردن همه گزینه‌ها به جز اولی
    while (cityFilter.options.length > 1) {
        cityFilter.remove(1);
    }
    
    // اضافه کردن شهرها
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });
    
    // بازگرداندن انتخاب قبلی
    if (cities.includes(currentSelection)) {
        cityFilter.value = currentSelection;
    }
}

function renderCustomersTable(customers) {
    const tableBody = document.getElementById('customersTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="text-center">هیچ مشتری یافت نشد</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        
        // رنگ ردیف بر اساس موجودی
        if (customer.balance < 0) {
            row.classList.add('bg-danger', 'text-white');
        } else if (customer.balance > 0) {
            row.classList.add('bg-success', 'text-white');
        }
        
        row.innerHTML = `
            <td>${customer.code}</td>
            <td>
                ${customer.name}
                ${customer.company ? `<br><small>${customer.company}</small>` : ''}
            </td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.getCustomerTypeText()}</td>
            <td>
                <span class="status-badge ${customer.balance < 0 ? 'status-inactive' : customer.balance > 0 ? 'status-active' : ''}">
                    ${customer.balance.toLocaleString()} ${customer.currency}
                </span>
            </td>
            <td>
                <span class="status-badge ${customer.isActive ? 'status-active' : 'status-inactive'}">
                    ${customer.isActive ? 'فعال' : 'غیرفعال'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openCustomerModal(${customer.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="openAddBalanceModal(${customer.id})">
                    <i class="fas fa-money-bill-wave"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function openAddBalanceModal(customerId) {
    const customer = window.customerManager.getCustomerById(customerId);
    
    if (!customer) {
        showNotification('مشتری یافت نشد', 'error');
        return;
    }
    
    const modal = document.getElementById('addBalanceModal');
    const form = document.getElementById('addBalanceForm');
    
    if (!modal || !form) return;
    
    document.getElementById('balanceCustomerName').textContent = customer.getFullName();
    document.getElementById('balanceCustomerCode').textContent = customer.code;
    document.getElementById('currentBalance').textContent = `${customer.balance.toLocaleString()} ${customer.currency}`;
    
    form.elements.customerId.value = customer.id;
    form.elements.balanceCurrency.value = customer.currency;
    form.elements.balanceAmount.value = '';
    
    modal.style.display = 'block';
}

function closeAddBalanceModal() {
    const modal = document.getElementById('addBalanceModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveAddBalance() {
    const form = document.getElementById('addBalanceForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const customerId = Number(form.elements.customerId.value);
        const amount = Number(form.elements.balanceAmount.value);
        const balanceType = form.elements.balanceType.value;
        
        // تعیین مقدار نهایی بر اساس نوع تراکنش
        const finalAmount = balanceType === 'deposit' ? Math.abs(amount) : -Math.abs(amount);
        
        window.customerManager.updateCustomerBalance(customerId, finalAmount);
        
        showNotification('موجودی مشتری با موفقیت بروزرسانی شد', 'success');
        
        // بستن مودال و بروزرسانی جدول
        closeAddBalanceModal();
        loadCustomersTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// =====================================================
// مدیریت فاکتورها
// =====================================================

function openInvoiceModal(invoiceId = null) {
    const modal = document.getElementById('invoiceModal');
    const modalTitle = document.getElementById('invoiceModalTitle');
    const form = document.getElementById('invoiceForm');
    
    if (!modal || !form) {
        console.error('Invoice modal or form not found');
        return;
    }
    
    // پاک کردن فرم
    form.reset();
    
    // پاک کردن آیتم‌های قبلی
    const itemsContainer = document.getElementById('invoiceItemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
    }
    
    if (invoiceId) {
        // حالت ویرایش
        const invoice = window.invoiceManager.getInvoiceById(invoiceId);
        
        if (invoice) {
            modalTitle.textContent = 'ویرایش فاکتور';
            
            // پر کردن فرم با داده‌های فاکتور
            form.elements.invoiceId.value = invoice.id;
            form.elements.invoiceNumber.value = invoice.invoiceNumber;
            form.elements.invoiceDate.value = invoice.date;
            form.elements.customerId.value = invoice.customerId || '';
            form.elements.invoiceType.value = invoice.invoiceType;
            form.elements.currency.value = invoice.currency;
            form.elements.status.value = invoice.status;
            form.elements.paymentMethod.value = invoice.paymentMethod;
            form.elements.discount.value = invoice.discount;
            form.elements.tax.value = invoice.tax;
            form.elements.paidAmount.value = invoice.paidAmount;
            form.elements.notes.value = invoice.notes || '';
            
            // بارگذاری آیتم‌های فاکتور
            invoice.items.forEach(item => {
                addInvoiceItem(item);
            });
            
            // محاسبه مجدد
            calculateInvoiceTotals();
        }
    } else {
        // حالت افزودن
        modalTitle.textContent = 'فاکتور جدید';
        
        // تولید شماره فاکتور جدید
        form.elements.invoiceNumber.value = window.invoiceManager.generateInvoiceNumber('فروش');
        form.elements.invoiceDate.value = new Date().toISOString().split('T')[0];
        form.elements.currency.value = 'AED';
        form.elements.status.value = 'در انتظار';
        form.elements.paymentMethod.value = 'نقدی';
        
        // افزودن یک آیتم خالی
        addInvoiceItem();
    }
    
    // بارگذاری لیست مشتریان
    loadCustomersList();
    
    // نمایش مودال
    modal.style.display = 'block';
}

function closeInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadCustomersList() {
    const customerSelect = document.getElementById('customerId');
    if (!customerSelect) return;
    
    const customers = window.customerManager.getAllCustomers();
    
    // پاک کردن گزینه‌های قبلی
    customerSelect.innerHTML = '<option value="">انتخاب مشتری...</option>';
    
    // اضافه کردن مشتریان
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.getFullName();
        customerSelect.appendChild(option);
    });
}

function addInvoiceItem(itemData = null) {
    const container = document.getElementById('invoiceItemsContainer');
    if (!container) return;
    
    const itemIndex = container.children.length;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'invoice-item';
    itemDiv.innerHTML = `
        <div class="row">
            <div class="col-md-3">
                <select class="form-control product-select" onchange="onProductSelect(this, ${itemIndex})">
                    <option value="">انتخاب محصول...</option>
                    ${getProductOptions()}
                </select>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control quantity-input" placeholder="تعداد" value="${itemData ? itemData.quantity : 1}" min="1" onchange="calculateInvoiceTotals()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control unit-price-input" placeholder="قیمت واحد" value="${itemData ? itemData.unitPrice : ''}" min="0" onchange="calculateInvoiceTotals()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control discount-input" placeholder="تخفیف" value="${itemData ? itemData.discount : 0}" min="0" onchange="calculateInvoiceTotals()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control tax-input" placeholder="مالیات" value="${itemData ? itemData.tax : 0}" min="0" onchange="calculateInvoiceTotals()">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm" onclick="removeInvoiceItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="row mt-2">
            <div class="col-md-12">
                <span class="item-total">مجموع: <span class="total-amount">0</span></span>
            </div>
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    // اگر داده‌ای وجود دارد، محصول را انتخاب کن
    if (itemData && itemData.productId) {
        const productSelect = itemDiv.querySelector('.product-select');
        productSelect.value = itemData.productId;
    }
}

function removeInvoiceItem(button) {
    button.closest('.invoice-item').remove();
    calculateInvoiceTotals();
}

function getProductOptions() {
    const products = window.productManager.getAllProducts();
    return products.map(p => `<option value="${p.id}">${p.name} - ${p.code}</option>`).join('');
}

function onProductSelect(select, itemIndex) {
    const productId = Number(select.value);
    if (!productId) return;
    
    const product = window.productManager.getProductById(productId);
    if (!product) return;
    
    const itemDiv = select.closest('.invoice-item');
    const unitPriceInput = itemDiv.querySelector('.unit-price-input');
    
    // قیمت واحد را از محصول بگیر
    unitPriceInput.value = product.price;
    
    // محاسبه مجدد
    calculateInvoiceTotals();
}

function calculateInvoiceTotals() {
    const items = document.querySelectorAll('.invoice-item');
    let subtotal = 0;
    
    items.forEach(itemDiv => {
        const quantity = Number(itemDiv.querySelector('.quantity-input').value) || 0;
        const unitPrice = Number(itemDiv.querySelector('.unit-price-input').value) || 0;
        const discount = Number(itemDiv.querySelector('.discount-input').value) || 0;
        const tax = Number(itemDiv.querySelector('.tax-input').value) || 0;
        
        const lineTotal = (quantity * unitPrice) - discount + tax;
        
        itemDiv.querySelector('.total-amount').textContent = lineTotal.toLocaleString();
        
        subtotal += (quantity * unitPrice);
    });
    
    // محاسبه مجموع نهایی
    const form = document.getElementById('invoiceForm');
    const totalDiscount = Number(form.elements.discount.value) || 0;
    const totalTax = Number(form.elements.tax.value) || 0;
    const paidAmount = Number(form.elements.paidAmount.value) || 0;
    
    const total = subtotal - totalDiscount + totalTax;
    const remaining = total - paidAmount;
    
    // نمایش مقادیر
    document.getElementById('invoiceSubtotal').textContent = subtotal.toLocaleString();
    document.getElementById('invoiceTotal').textContent = total.toLocaleString();
    document.getElementById('invoiceRemaining').textContent = remaining.toLocaleString();
}

function saveInvoice() {
    const form = document.getElementById('invoiceForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // جمع‌آوری آیتم‌ها
    const items = [];
    const itemDivs = document.querySelectorAll('.invoice-item');
    
    itemDivs.forEach(itemDiv => {
        const productSelect = itemDiv.querySelector('.product-select');
        const productId = Number(productSelect.value);
        
        if (productId) {
            const product = window.productManager.getProductById(productId);
            
            items.push({
                productId: productId,
                productName: product.name,
                productCode: product.code,
                quantity: Number(itemDiv.querySelector('.quantity-input').value) || 0,
                unitPrice: Number(itemDiv.querySelector('.unit-price-input').value) || 0,
                discount: Number(itemDiv.querySelector('.discount-input').value) || 0,
                tax: Number(itemDiv.querySelector('.tax-input').value) || 0
            });
        }
    });
    
    if (items.length === 0) {
        showNotification('لطفاً حداقل یک محصول اضافه کنید', 'error');
        return;
    }
    
    try {
        const customerId = form.elements.customerId.value ? Number(form.elements.customerId.value) : null;
        let customerName = '';
        
        if (customerId) {
            const customer = window.customerManager.getCustomerById(customerId);
            if (customer) {
                customerName = customer.name;
            }
        }
        
        const invoiceData = {
            invoiceNumber: form.elements.invoiceNumber.value.trim(),
            date: form.elements.invoiceDate.value,
            customerId: customerId,
            customerName: customerName,
            invoiceType: form.elements.invoiceType.value,
            currency: form.elements.currency.value,
            status: form.elements.status.value,
            paymentMethod: form.elements.paymentMethod.value,
            items: items,
            discount: Number(form.elements.discount.value) || 0,
            tax: Number(form.elements.tax.value) || 0,
            paidAmount: Number(form.elements.paidAmount.value) || 0,
            notes: form.elements.notes.value.trim()
        };
        
        const invoiceId = form.elements.invoiceId.value;
        
        if (invoiceId) {
            // بروزرسانی فاکتور موجود
            window.invoiceManager.updateInvoice(Number(invoiceId), invoiceData);
            showNotification('فاکتور با موفقیت بروزرسانی شد', 'success');
        } else {
            // افزودن فاکتور جدید
            window.invoiceManager.addInvoice(invoiceData);
            showNotification('فاکتور جدید با موفقیت ایجاد شد', 'success');
        }
        
        // بستن مودال و بروزرسانی جدول
        closeInvoiceModal();
        loadInvoicesTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function deleteInvoice(invoiceId) {
    if (!confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
        return;
    }
    
    try {
        window.invoiceManager.deleteInvoice(Number(invoiceId));
        
        showNotification('فاکتور با موفقیت حذف شد', 'success');
        loadInvoicesTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function loadInvoicesTable() {
    const invoices = window.invoiceManager.getAllInvoices();
    renderInvoicesTable(invoices);
}

function renderInvoicesTable(invoices) {
    const tableBody = document.getElementById('invoicesTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (invoices.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="8" class="text-center">هیچ فاکتوری یافت نشد</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${invoice.invoiceNumber}</td>
            <td>${formatPersianDate(invoice.date)}</td>
            <td>${invoice.customerName || '-'}</td>
            <td>${invoice.invoiceType}</td>
            <td>
                <span class="status-badge status-${getStatusBadgeClass(invoice.status)}">
                    ${invoice.status}
                </span>
            </td>
            <td>${invoice.total.toLocaleString()} ${invoice.currency}</td>
            <td>${invoice.remainingAmount.toLocaleString()} ${invoice.currency}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewInvoiceDetails(${invoice.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="openInvoiceModal(${invoice.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${invoice.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function viewInvoiceDetails(invoiceId) {
    const invoice = window.invoiceManager.getInvoiceById(invoiceId);
    if (!invoice) {
        showNotification('فاکتور یافت نشد', 'error');
        return;
    }
    
    const customer = invoice.customerId ? window.customerManager.getCustomerById(invoice.customerId) : null;
    
    const modal = document.getElementById('invoiceDetailsModal');
    const content = document.getElementById('invoiceDetailsContent');
    
    if (!modal || !content) return;
    
    content.innerHTML = `
        <div class="invoice-details">
            <div class="details-header">
                <h3>جزئیات فاکتور ${invoice.invoiceNumber}</h3>
            </div>
            
            <div class="details-info-section">
                <div class="detail-section">
                    <h4>اطلاعات فاکتور</h4>
                    <div class="detail-item">
                        <span class="label">شماره فاکتور:</span>
                        <span class="value">${invoice.invoiceNumber}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">تاریخ:</span>
                        <span class="value">${formatPersianDate(invoice.date)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">نوع فاکتور:</span>
                        <span class="value">${invoice.invoiceType}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">وضعیت:</span>
                        <span class="value">
                            <span class="status-badge status-${getStatusBadgeClass(invoice.status)}">
                                ${invoice.status}
                            </span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="label">روش پرداخت:</span>
                        <span class="value">${invoice.paymentMethod || '-'}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>اطلاعات مشتری</h4>
                    ${customer ? `
                        <div class="detail-item">
                            <span class="label">نام مشتری:</span>
                            <span class="value">${customer.name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">شرکت:</span>
                            <span class="value">${customer.company || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">تلفن:</span>
                            <span class="value">${customer.phone || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">وضعیت حساب:</span>
                            <span class="value">${formatMoney(customer.balance)} ${customer.currency || ''}</span>
                        </div>
                    ` : '<div class="detail-item text-danger">مشتری انتخاب نشده</div>'}
                </div>
            </div>
            
            <div class="details-products-section">
                <h4>اقلام فاکتور</h4>
                ${invoice.items && invoice.items.length > 0 ? `
                    <table class="invoice-items-table">
                        <thead>
                            <tr>
                                <th>محصول</th>
                                <th>تعداد</th>
                                <th>قیمت واحد</th>
                                <th>تخفیف</th>
                                <th>مالیات</th>
                                <th>جمع</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => `
                                <tr>
                                    <td>${item.productName}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatMoney(item.unitPrice)}</td>
                                    <td>${item.discount ? formatMoney(item.discount) : '-'}</td>
                                    <td>${item.tax ? formatMoney(item.tax) : '-'}</td>
                                    <td><b>${formatMoney(item.total)}</b></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<div class="text-muted">هیچ محصولی ثبت نشده است.</div>`}
            </div>
            
            <div class="details-summary-section">
                <h4>خلاصه مالی</h4>
                <div class="summary-grid">
                    <div><span>جمع کل:</span><span>${formatMoney(invoice.subtotal)} ${invoice.currency}</span></div>
                    <div><span>تخفیف:</span><span>${formatMoney(invoice.discount)} ${invoice.currency}</span></div>
                    <div><span>مالیات:</span><span>${formatMoney(invoice.tax)} ${invoice.currency}</span></div>
                    <div><span>مبلغ نهایی:</span><span class="text-bold">${formatMoney(invoice.total)} ${invoice.currency}</span></div>
                    <div><span>پرداختی:</span><span>${formatMoney(invoice.paidAmount)} ${invoice.currency}</span></div>
                    <div><span>مانده:</span><span class="${invoice.remainingAmount === 0 ? 'text-success' : 'text-danger'}">
                        ${formatMoney(invoice.remainingAmount)} ${invoice.currency}
                    </span></div>
                </div>
            </div>
            
            <div class="details-notes-section">
                <h4>یادداشت‌ها</h4>
                <div>${invoice.notes ? sanitizeHTML(invoice.notes).replace(/\n/g, '<br>') : '<span class="text-muted">-</span>'}</div>
            </div>
        </div>
        <div class="details-actions mt-3">
            <button class="btn btn-secondary ms-2" onclick="closeInvoiceDetailsDialog()">بستن</button>
            <button class="btn btn-primary" onclick="printInvoice('${invoice.id}')">
                <i class="fa fa-print"></i> چاپ
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeInvoiceDetailsDialog() {
    const modal = document.getElementById('invoiceDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// =====================================================
// مدیریت هزینه‌ها
// =====================================================

function openExpenseModal(expenseId = null) {
    const modal = document.getElementById('expenseModal');
    const modalTitle = document.getElementById('expenseModalTitle');
    const form = document.getElementById('expenseForm');
    
    if (!modal || !form) {
        console.error('Expense modal or form not found');
        return;
    }
    
    // پاک کردن فرم
    form.reset();
    
    if (expenseId) {
        // حالت ویرایش
        const expense = window.accountingManager.getExpenseById(expenseId);
        
        if (expense) {
            modalTitle.textContent = 'ویرایش هزینه';
            
            // پر کردن فرم با داده‌های هزینه
            form.elements.expenseId.value = expense.id;
            form.elements.expenseCode.value = expense.code;
            form.elements.expenseDate.value = expense.date;
            form.elements.category.value = expense.category;
            form.elements.description.value = expense.description;
            form.elements.amount.value = expense.amount;
            form.elements.paymentMethod.value = expense.paymentMethod;
            form.elements.reference.value = expense.reference || '';
            form.elements.notes.value = expense.notes || '';
        }
    } else {
        // حالت افزودن
        modalTitle.textContent = 'ثبت هزینه جدید';
        
        // تولید کد هزینه جدید
        form.elements.expenseCode.value = window.accountingManager.generateExpenseCode();
        form.elements.expenseDate.value = new Date().toISOString().split('T')[0];
        form.elements.paymentMethod.value = 'نقدی';
    }
    
    // نمایش مودال
    modal.style.display = 'block';
}

function closeExpenseModal() {
    const modal = document.getElementById('expenseModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveExpense() {
    const form = document.getElementById('expenseForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const expenseData = {
            code: form.elements.expenseCode.value.trim(),
            date: form.elements.expenseDate.value,
            category: form.elements.category.value,
            description: form.elements.description.value.trim(),
            amount: Number(form.elements.amount.value),
            paymentMethod: form.elements.paymentMethod.value,
            reference: form.elements.reference.value.trim(),
            notes: form.elements.notes.value.trim()
        };
        
        const expenseId = form.elements.expenseId.value;
        
        if (expenseId) {
            // بروزرسانی هزینه موجود
            window.accountingManager.updateExpense(Number(expenseId), expenseData);
            showNotification('هزینه با موفقیت بروزرسانی شد', 'success');
        } else {
            // افزودن هزینه جدید
            window.accountingManager.addExpense(expenseData);
            showNotification('هزینه جدید با موفقیت ثبت شد', 'success');
        }
        
        // بستن مودال و بروزرسانی جدول
        closeExpenseModal();
        loadExpensesTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function deleteExpense(expenseId) {
    if (!confirm('آیا از حذف این هزینه اطمینان دارید؟')) {
        return;
    }
    
    try {
        window.accountingManager.deleteExpense(Number(expenseId));
        
        showNotification('هزینه با موفقیت حذف شد', 'success');
        loadExpensesTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function loadExpensesTable() {
    const expenses = window.accountingManager.getAllExpenses();
    renderExpensesTable(expenses);
}

function renderExpensesTable(expenses) {
    const tableBody = document.getElementById('expensesTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (expenses.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="text-center">هیچ هزینه‌ای ثبت نشده است</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    expenses.forEach(expense => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${expense.code}</td>
            <td>${formatPersianDate(expense.date)}</td>
            <td>${expense.category}</td>
            <td>${expense.description}</td>
            <td>${expense.amount.toLocaleString()} AED</td>
            <td>${expense.paymentMethod}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openExpenseModal(${expense.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// =====================================================
// توابع کمکی و عمومی
// =====================================================

function loadInitialData() {
    console.log('Loading initial data...');
    
    // مقداردهی اولیه به مدیران در صورت نیاز
    if (!window.productManager || !window.customerManager || !window.invoiceManager || !window.accountingManager) {
        initializeManagers();
    }
    
    // بارگذاری داده‌ها بر اساس صفحه فعلی
    const currentPage = getCurrentPage();
    
    switch (currentPage) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'products':
            loadProductsTable();
            break;
        case 'customers':
            loadCustomersTable();
            break;
        case 'invoices':
            loadInvoicesTable();
            break;
        case 'expenses':
            loadExpensesTable();
            break;
        case 'accounting':
            loadAccountingData();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

function getCurrentPage() {
    // بر اساس URL یا کلاس active در منو
    const activeMenuItem = document.querySelector('.sidebar .nav-link.active');
    if (activeMenuItem) {
        const href = activeMenuItem.getAttribute('href');
        if (href.includes('dashboard')) return 'dashboard';
        if (href.includes('products')) return 'products';
        if (href.includes('customers')) return 'customers';
        if (href.includes('invoices')) return 'invoices';
        if (href.includes('expenses')) return 'expenses';
        if (href.includes('accounting')) return 'accounting';
        if (href.includes('reports')) return 'reports';
    }
    
    return 'dashboard';
}

function updateDashboard() {
    console.log('Updating dashboard...');
    
    // بروزرسانی آمار محصولات
    if (window.productManager) {
        const productStats = window.productManager.getProductStats();
        
        const totalProductsElement = document.getElementById('totalProducts');
        if (totalProductsElement) {
            totalProductsElement.textContent = productStats.total;
        }
        
        const lowStockElement = document.getElementById('lowStockProducts');
        if (lowStockElement) {
            lowStockElement.textContent = productStats.lowStock;
        }
    }
    
    // بروزرسانی آمار مشتریان
    if (window.customerManager) {
        const customers = window.customerManager.getAllCustomers();
        
        const totalCustomersElement = document.getElementById('totalCustomers');
        if (totalCustomersElement) {
            totalCustomersElement.textContent = customers.length;
        }
        
        const activeCustomersElement = document.getElementById('activeCustomers');
        if (activeCustomersElement) {
            const activeCount = customers.filter(c => c.isActive).length;
            activeCustomersElement.textContent = activeCount;
        }
    }
    
    // بروزرسانی آمار فاکتورها
    if (window.invoiceManager) {
        const invoiceStats = window.invoiceManager.getInvoiceStats();
        
        const totalInvoicesElement = document.getElementById('totalInvoices');
        if (totalInvoicesElement) {
            totalInvoicesElement.textContent = invoiceStats.total;
        }
        
        const pendingInvoicesElement = document.getElementById('pendingInvoices');
        if (pendingInvoicesElement) {
            pendingInvoicesElement.textContent = invoiceStats.byStatus['در انتظار'] || 0;
        }
    }
    
    // بروزرسانی آمار مالی
    if (window.accountingManager) {
        const financialStats = window.accountingManager.getFinancialSummary();
        
        const totalRevenueElement = document.getElementById('totalRevenue');
        if (totalRevenueElement) {
            totalRevenueElement.textContent = formatMoney(financialStats.totalRevenue) + ' AED';
        }
        
        const totalExpensesElement = document.getElementById('totalExpenses');
        if (totalExpensesElement) {
            totalExpensesElement.textContent = formatMoney(financialStats.totalExpenses) + ' AED';
        }
        
        const netProfitElement = document.getElementById('netProfit');
        if (netProfitElement) {
            netProfitElement.textContent = formatMoney(financialStats.netProfit) + ' AED';
        }
    }
}

function showNotification(message, type = 'info') {
    // ایجاد المان نوتیفیکیشن
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    
    // آیکون بر اساس نوع
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error' || type === 'danger') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span style="margin-left: 10px;">${message}</span>
        <button type="button" class="close" style="margin-left: 15px;" onclick="this.parentElement.remove()">
            <span>&times;</span>
        </button>
    `;
    
    // اضافه کردن به صفحه
    document.body.appendChild(notification);
    
    // حذف خودکار بعد از 5 ثانیه
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// توابع کمکی برای فرمت کردن
function formatMoney(amount) {
    if (typeof amount !== 'number') {
        amount = Number(amount) || 0;
    }
    return amount.toLocaleString('fa-IR');
}

function formatPersianDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fa-IR', options);
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'پرداخت شده':
        case 'فعال':
            return 'success';
        case 'در انتظار':
        case 'پیش‌نویس':
            return 'warning';
        case 'لغو شده':
        case 'غیرفعال':
            return 'danger';
        default:
            return 'secondary';
    }
}

function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// =====================================================
// مدیریت حسابداری
// =====================================================

function loadAccountingData() {
    if (window.accountingManager) {
        loadChartOfAccounts();
        loadJournalEntries();
        updateAccountingDashboardStats();
    }
}

function loadChartOfAccounts() {
    const accounts = window.accountingManager.getAllAccounts();
    renderAccountsTable(accounts);
}

function renderAccountsTable(accounts) {
    const tableBody = document.getElementById('accountsTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (accounts.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="text-center">هیچ حسابی یافت نشد</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    accounts.forEach(account => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${account.code}</td>
            <td>${account.name}</td>
            <td>${account.getAccountTypeText()}</td>
            <td>${account.getAccountSubTypeText()}</td>
            <td>${account.balance.toLocaleString()} ${account.currency}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="showAccountLedger(${account.id})">
                    <i class="fas fa-book"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="openAccountModal(${account.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount(${account.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function loadJournalEntries() {
    const entries = window.accountingManager.getAllJournalEntries();
    renderJournalEntriesTable(entries);
}

function renderJournalEntriesTable(entries) {
    const tableBody = document.getElementById('journalEntriesTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (entries.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="text-center">هیچ سندی یافت نشد</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    entries.forEach(entry => {
        const row = document.createElement('tr');
        
        let statusBadge = '';
        let actions = '';
        
        if (entry.status === 'draft') {
            statusBadge = '<span class="status-badge status-warning">پیش‌نویس</span>';
            actions = `
                <button class="btn btn-sm btn-primary" onclick="openJournalEntryModal(${entry.id})" title="ویرایش">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="postJournalEntry(${entry.id})" title="ثبت">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteJournalEntry(${entry.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else if (entry.status === 'posted') {
            statusBadge = '<span class="status-badge status-success">ثبت شده</span>';
            actions = `
                <button class="btn btn-sm btn-warning" onclick="unpostJournalEntry(${entry.id})" title="لغو ثبت">
                    <i class="fas fa-undo"></i>
                </button>
            `;
        }
        
        row.innerHTML = `
            <td>${entry.entryNumber}</td>
            <td>${entry.date}</td>
            <td>${entry.description}</td>
            <td>${entry.reference}</td>
            <td>${entry.totalDebit.toLocaleString()} درهم</td>
            <td>${statusBadge}</td>
            <td>${actions}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateAccountingDashboardStats() {
    const stats = window.accountingManager.getAccountingStats();
    
    // تعداد کل حساب‌ها
    const totalAccountsElement = document.getElementById('totalAccounts');
    if (totalAccountsElement) {
        totalAccountsElement.textContent = stats.accounts.total;
    }
    
    // تعداد اسناد ثبت شده
    const postedEntriesElement = document.getElementById('postedEntries');
    if (postedEntriesElement) {
        postedEntriesElement.textContent = stats.entries.posted;
    }
    
    // تعداد اسناد پیش‌نویس
    const draftEntriesElement = document.getElementById('draftEntries');
    if (draftEntriesElement) {
        draftEntriesElement.textContent = stats.entries.draft;
    }
}

// =====================================================
// مدیریت گزارشات
// =====================================================

function loadReports() {
    console.log('Loading reports...');
    
    // بارگذاری گزارشات مختلف بر اساس نیاز
    if (document.getElementById('salesReportChart')) {
        loadSalesReport();
    }
    
    if (document.getElementById('inventoryReportChart')) {
        loadInventoryReport();
    }
    
    if (document.getElementById('financialReportChart')) {
        loadFinancialReport();
    }
}

function loadSalesReport() {
    // این تابع باید نمودار فروش را بارگذاری کند
    console.log('Loading sales report...');
}

function loadInventoryReport() {
    // این تابع باید گزارش موجودی را بارگذاری کند
    console.log('Loading inventory report...');
}

function loadFinancialReport() {
    // این تابع باید گزارش مالی را بارگذاری کند
    console.log('Loading financial report...');
}

// =====================================================
// افزودن استایل‌های انیمیشن
// =====================================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        padding: 15px 20px;
        display: flex;
        align-items: center;
    }
    
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0, 0, 0, 0.4);
    }
    
    .modal-content {
        background-color: #fefefe;
        margin: 5% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 80%;
        max-width: 800px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
    }
    
    .close:hover,
    .close:focus {
        color: black;
        text-decoration: none;
    }
    
    .status-badge {
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
    }
    
    .status-active,
    .status-success {
        background-color: #28a745;
        color: white;
    }
    
    .status-inactive,
    .status-danger {
        background-color: #dc3545;
        color: white;
    }
    
    .status-warning {
        background-color: #ffc107;
        color: #212529;
    }
    
    .status-secondary {
        background-color: #6c757d;
        color: white;
    }
    
    .stock-empty {
        background-color: #ffe6e6;
    }
    
    .stock-warning {
        background-color: #fff3cd;
    }
    
    .invoice-item {
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 10px;
        background-color: #f8f9fa;
    }
    
    .item-total {
        font-weight: bold;
        color: #333;
    }
    
    .loading {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        color: #007bff;
    }
    
    /* استایل‌های فرم ورود */
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f0f2f5;
    }
    
    .login-box {
        background: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
    }
    
    .login-box h1 {
        text-align: center;
        margin-bottom: 10px;
        color: #333;
    }
    
    .login-box p {
        text-align: center;
        color: #666;
        margin-bottom: 30px;
    }
    
    .login-info {
        margin-top: 20px;
        padding: 15px;
        background-color: #f8f9fa;
        border-radius: 5px;
        text-align: center;
    }
    
    .login-info p {
        margin: 5px 0;
        font-size: 14px;
    }
    
    .login-button {
        width: 100%;
        padding: 12px;
        font-size: 16px;
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// =====================================================
// کلاس‌های اصلی (در صورتی که هنوز لود نشده باشند)
// =====================================================

// بررسی و تعریف کلاس ActivitiesManager اگر وجود ندارد
if (typeof ActivitiesManager === 'undefined') {
    window.ActivitiesManager = class ActivitiesManager {
        constructor() {
            this.activities = [];
            this.loadActivities();
        }
        
        loadActivities() {
            const stored = localStorage.getItem('shafi_activities');
            if (stored) {
                try {
                    this.activities = JSON.parse(stored);
                } catch (e) {
                    this.activities = [];
                }
            }
        }
        
        saveActivities() {
            localStorage.setItem('shafi_activities', JSON.stringify(this.activities));
        }
        
        addActivity(activity) {
            this.activities.unshift({
                ...activity,
                id: Date.now(),
                timestamp: new Date().toISOString()
            });
            
            // نگه داشتن فقط 100 فعالیت آخر
            if (this.activities.length > 100) {
                this.activities = this.activities.slice(0, 100);
            }
            
            this.saveActivities();
        }
        
        getRecentActivities(limit = 10) {
            return this.activities.slice(0, limit);
        }
    };
}

// تابع چاپ فاکتور
function printInvoice(invoiceId) {
    const invoice = window.invoiceManager.getInvoiceById(Number(invoiceId));
    if (!invoice) {
        showNotification('فاکتور یافت نشد', 'error');
        return;
    }
    
    // ایجاد پنجره جدید برای چاپ
    const printWindow = window.open('', 'PRINT', 'height=600,width=800');
    
    // محتوای HTML برای چاپ
    const printContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <title>چاپ فاکتور ${invoice.invoiceNumber}</title>
            <style>
                body {
                    font-family: 'Tahoma', 'Arial', sans-serif;
                    direction: rtl;
                    margin: 20px;
                }
                .invoice-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .invoice-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .invoice-table th, .invoice-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: right;
                }
                .invoice-table th {
                    background-color: #f4f4f4;
                }
                .invoice-summary {
                    float: left;
                    width: 300px;
                }
                .invoice-summary table {
                    width: 100%;
                }
                .invoice-summary td {
                    padding: 5px;
                }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <h1>فاکتور ${invoice.invoiceType}</h1>
                <p>شماره: ${invoice.invoiceNumber}</p>
            </div>
            
            <div class="invoice-info">
                <div>
                    <strong>تاریخ:</strong> ${formatPersianDate(invoice.date)}<br>
                    <strong>مشتری:</strong> ${invoice.customerName || '-'}<br>
                    <strong>وضعیت:</strong> ${invoice.status}
                </div>
                <div>
                    <strong>روش پرداخت:</strong> ${invoice.paymentMethod}<br>
                    <strong>ارز:</strong> ${invoice.currency}
                </div>
            </div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>ردیف</th>
                        <th>محصول</th>
                        <th>تعداد</th>
                        <th>قیمت واحد</th>
                        <th>تخفیف</th>
                        <th>مالیات</th>
                        <th>جمع</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.productName}</td>
                            <td>${item.quantity}</td>
                            <td>${formatMoney(item.unitPrice)}</td>
                            <td>${formatMoney(item.discount)}</td>
                            <td>${formatMoney(item.tax)}</td>
                            <td>${formatMoney(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="invoice-summary">
                <table>
                    <tr>
                        <td>جمع کل:</td>
                        <td>${formatMoney(invoice.subtotal)} ${invoice.currency}</td>
                    </tr>
                    <tr>
                        <td>تخفیف:</td>
                        <td>${formatMoney(invoice.discount)} ${invoice.currency}</td>
                    </tr>
                    <tr>
                        <td>مالیات:</td>
                        <td>${formatMoney(invoice.tax)} ${invoice.currency}</td>
                    </tr>
                    <tr style="font-weight: bold;">
                        <td>مبلغ نهایی:</td>
                        <td>${formatMoney(invoice.total)} ${invoice.currency}</td>
                    </tr>
                    <tr>
                        <td>پرداختی:</td>
                        <td>${formatMoney(invoice.paidAmount)} ${invoice.currency}</td>
                    </tr>
                    <tr>
                        <td>مانده:</td>
                        <td>${formatMoney(invoice.remainingAmount)} ${invoice.currency}</td>
                    </tr>
                </table>
            </div>
            
            <div style="clear: both;"></div>
            
            ${invoice.notes ? `
                <div style="margin-top: 30px;">
                    <strong>یادداشت:</strong><br>
                    ${invoice.notes}
                </div>
            ` : ''}
            
            <div style="margin-top: 50px; text-align: center;">
                <button onclick="window.print()">چاپ</button>
                <button onclick="window.close()">بستن</button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
}

// آماده‌سازی نهایی
console.log('Main application script loaded successfully');
