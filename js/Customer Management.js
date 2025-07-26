// =====================================================
// مدیریت مشتریان (Customer Management)
// =====================================================

// مدل داده مشتری
window.customerManager = new CustomerManager();
class Customer {
    constructor(
        id = null,
        code = '',
        name = '',
        company = '',
        phone = '',
        email = '',
        address = '',
        city = '',
        country = '',
        notes = '',
        balance = 0,
        currency = 'AED',
        vatNumber = '',
        customerType = 'retail',
        isActive = true
    ) {
        this.id = id || Date.now(); // استفاده از timestamp برای id اگر null باشد
        this.code = code;
        this.name = name;
        this.company = company || '';
        this.phone = phone || '';
        this.email = email || '';
        this.address = address || '';
        this.city = city || '';
        this.country = country || '';
        this.notes = notes || '';
        this.balance = Number(balance) || 0;
        this.currency = currency || 'AED';
        this.vatNumber = vatNumber || '';
        this.customerType = customerType || 'retail';
        this.isActive = isActive;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // بروزرسانی مشتری
    update(data) {
        this.code = data.code || this.code;
        this.name = data.name || this.name;
        this.company = data.company !== undefined ? data.company : this.company;
        this.phone = data.phone !== undefined ? data.phone : this.phone;
        this.email = data.email !== undefined ? data.email : this.email;
        this.address = data.address !== undefined ? data.address : this.address;
        this.city = data.city !== undefined ? data.city : this.city;
        this.country = data.country !== undefined ? data.country : this.country;
        this.notes = data.notes !== undefined ? data.notes : this.notes;
        this.balance = data.balance !== undefined ? Number(data.balance) : this.balance;
        this.currency = data.currency || this.currency;
        this.vatNumber = data.vatNumber !== undefined ? data.vatNumber : this.vatNumber;
        this.customerType = data.customerType || this.customerType;
        this.isActive = data.isActive !== undefined ? data.isActive : this.isActive;
        this.updatedAt = new Date().toISOString();
    }

    // بروزرسانی موجودی
    updateBalance(amount) {
        this.balance += Number(amount);
        this.updatedAt = new Date().toISOString();
    }

    // دریافت نام کامل (شرکت + نام)
    getFullName() {
        if (this.company) {
            return `${this.name} (${this.company})`;
        }
        return this.name;
    }

    // دریافت نوع مشتری به فارسی
    getCustomerTypeText() {
        switch (this.customerType) {
            case 'retail': return 'خرده‌فروشی';
            case 'wholesale': return 'عمده‌فروشی';
            case 'distributor': return 'توزیع‌کننده';
            case 'corporate': return 'شرکتی';
            case 'vip': return 'ویژه';
            default: return 'نامشخص';
        }
    }
}

// مدیریت مشتریان
class CustomerManager {
    constructor() {
        this.customers = [];
        this.loadCustomers();
    }

    // بارگذاری مشتریان از localStorage
    loadCustomers() {
        const customersData = localStorage.getItem('shafi_customers');
        if (customersData) {
            try {
                const parsed = JSON.parse(customersData);
                this.customers = parsed.map(c => {
                    const customer = new Customer(
                        c.id,
                        c.code,
                        c.name,
                        c.company,
                        c.phone,
                        c.email,
                        c.address,
                        c.city,
                        c.country,
                        c.notes,
                        c.balance,
                        c.currency,
                        c.vatNumber,
                        c.customerType,
                        c.isActive
                    );
                    customer.createdAt = c.createdAt || customer.createdAt;
                    customer.updatedAt = c.updatedAt || customer.updatedAt;
                    return customer;
                });
            } catch (e) {
                console.error('Error loading customers:', e);
                this.customers = [];
            }
        }
    }

    // ذخیره مشتریان در localStorage
    saveCustomers() {
        localStorage.setItem('shafi_customers', JSON.stringify(this.customers));
    }

    // دریافت تمام مشتریان
    getAllCustomers() {
        return [...this.customers];
    }

    // دریافت مشتری با ID
    getCustomerById(id) {
        return this.customers.find(c => c.id === id);
    }

    // دریافت مشتری با کد
    getCustomerByCode(code) {
        return this.customers.find(c => c.code === code);
    }

    // افزودن مشتری جدید
    addCustomer(customerData) {
        // بررسی تکراری نبودن کد مشتری
        if (customerData.code && this.getCustomerByCode(customerData.code)) {
            throw new Error('کد مشتری تکراری است');
        }

        const customer = new Customer(
            null,
            customerData.code || this.generateNewCustomerCode(),
            customerData.name,
            customerData.company,
            customerData.phone,
            customerData.email,
            customerData.address,
            customerData.city,
            customerData.country,
            customerData.notes,
            customerData.balance,
            customerData.currency,
            customerData.vatNumber,
            customerData.customerType,
            customerData.isActive !== undefined ? customerData.isActive : true
        );

        this.customers.push(customer);
        this.saveCustomers();
        this.addActivity(`مشتری جدید «${customer.name}» اضافه شد.`);
        return customer;
    }

    // بروزرسانی مشتری
    updateCustomer(id, customerData) {
        const index = this.customers.findIndex(c => c.id === id);
        if (index === -1) {
            throw new Error('مشتری یافت نشد');
        }

        // بررسی تکراری نبودن کد مشتری اگر تغییر کرده باشد
        if (customerData.code !== this.customers[index].code) {
            const existingCustomer = this.getCustomerByCode(customerData.code);
            if (existingCustomer && existingCustomer.id !== id) {
                throw new Error('کد مشتری تکراری است');
            }
        }

        this.customers[index].update(customerData);
        this.saveCustomers();
        this.addActivity(`مشتری «${this.customers[index].name}» بروزرسانی شد.`);
        return this.customers[index];
    }

    // حذف مشتری
    deleteCustomer(id) {
        const index = this.customers.findIndex(c => c.id === id);
        if (index === -1) {
            throw new Error('مشتری یافت نشد');
        }

        const customerName = this.customers[index].name;
        this.customers.splice(index, 1);
        this.saveCustomers();
        this.addActivity(`مشتری «${customerName}» حذف شد.`);
        return true;
    }

    // بروزرسانی موجودی مشتری
    updateCustomerBalance(id, amount) {
        const customer = this.getCustomerById(id);
        if (!customer) {
            throw new Error('مشتری یافت نشد');
        }

        customer.updateBalance(Number(amount));
        this.saveCustomers();

        const action = amount >= 0 ? 'افزایش' : 'کاهش';
        this.addActivity(`موجودی مشتری «${customer.name}» ${action} یافت (${Math.abs(amount)} ${customer.currency}).`);

        return customer;
    }

    // جستجوی مشتریان
    searchCustomers(query = '', options = {}) {
        if (!query && !options.customerType && !options.city && options.balanceStatus === undefined) {
            return this.getAllCustomers();
        }

        return this.customers.filter(customer => {
            // جستجو بر اساس متن
            const matchesQuery = !query ||
                customer.name.toLowerCase().includes(query.toLowerCase()) ||
                customer.code.toLowerCase().includes(query.toLowerCase()) ||
                (customer.company && customer.company.toLowerCase().includes(query.toLowerCase())) ||
                (customer.phone && customer.phone.toLowerCase().includes(query.toLowerCase())) ||
                (customer.email && customer.email.toLowerCase().includes(query.toLowerCase()));

            // فیلتر بر اساس نوع مشتری
            const matchesCustomerType = !options.customerType || customer.customerType === options.customerType;

            // فیلتر بر اساس شهر
            const matchesCity = !options.city || customer.city === options.city;

            // فیلتر بر اساس وضعیت موجودی
            const matchesBalanceStatus = options.balanceStatus === undefined ||
                (options.balanceStatus === 'positive' && customer.balance > 0) ||
                (options.balanceStatus === 'negative' && customer.balance < 0) ||
                (options.balanceStatus === 'zero' && customer.balance === 0);

            // فیلتر بر اساس وضعیت فعال/غیرفعال
            const matchesActiveStatus = options.activeStatus === undefined ||
                (options.activeStatus === 'active' && customer.isActive) ||
                (options.activeStatus === 'inactive' && !customer.isActive);

            return matchesQuery && matchesCustomerType && matchesCity && matchesBalanceStatus && matchesActiveStatus;
        });
    }

    // دریافت مشتریان با موجودی منفی
    getCustomersWithNegativeBalance() {
        return this.customers.filter(c => c.isActive && c.balance < 0);
    }

    // دریافت مشتریان با موجودی مثبت
    getCustomersWithPositiveBalance() {
        return this.customers.filter(c => c.isActive && c.balance > 0);
    }

    // دریافت لیست شهرهای موجود
    getCities() {
        const cities = new Set();
        this.customers.forEach(c => {
            if (c.city) cities.add(c.city);
        });
        return [...cities].sort();
    }

    // محاسبه کل بدهی مشتریان
    calculateTotalDebt() {
        return this.customers.reduce((sum, customer) => {
            if (customer.balance < 0) {
                return sum + Math.abs(customer.balance);
            }
            return sum;
        }, 0);
    }

    // محاسبه کل طلب از مشتریان
    calculateTotalCredit() {
        return this.customers.reduce((sum, customer) => {
            if (customer.balance > 0) {
                return sum + customer.balance;
            }
            return sum;
        }, 0);
    }

    // ثبت فعالیت
    addActivity(description) {
        try {
            const activitiesManager = new ActivitiesManager();
            activitiesManager.addActivity({
                module: 'customers',
                description,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            // اگر ActivitiesManager موجود نباشد، خطا را نادیده بگیر
            console.log('Activity logged:', description);
        }
    }

    // تولید کد مشتری جدید
    generateNewCustomerCode() {
        const prefix = 'C';
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}${timestamp}`;
    }

    // دریافت آمار مشتریان
    getCustomersStats() {
        const totalCustomers = this.customers.length;
        const activeCustomers = this.customers.filter(c => c.isActive).length;
        const inactiveCustomers = totalCustomers - activeCustomers;
        const creditorsCount = this.customers.filter(c => c.balance > 0).length;
        const debtorsCount = this.customers.filter(c => c.balance < 0).length;
        const totalCredit = this.calculateTotalCredit();
        const totalDebt = this.calculateTotalDebt();

        return {
            total: totalCustomers,
            active: activeCustomers,
            inactive: inactiveCustomers,
            creditors: creditorsCount,
            debtors: debtorsCount,
            totalCredit,
            totalDebt,
            netBalance: totalCredit - totalDebt
        };
    }

    // خروجی گرفتن از مشتریان
    exportCustomers() {
        const exportData = this.customers.map(c => ({
            کد: c.code,
            نام: c.name,
            شرکت: c.company,
            تلفن: c.phone,
            ایمیل: c.email,
            آدرس: c.address,
            شهر: c.city,
            کشور: c.country,
            یادداشت: c.notes,
            موجودی: c.balance,
            ارز: c.currency,
            'شماره مالیاتی': c.vatNumber,
            'نوع مشتری': c.getCustomerTypeText(),
            وضعیت: c.isActive ? 'فعال' : 'غیرفعال',
            'تاریخ ایجاد': c.createdAt,
            'تاریخ بروزرسانی': c.updatedAt
        }));

        return JSON.stringify(exportData, null, 2);
    }

    // وارد کردن مشتریان
    importCustomers(data) {
        try {
            const importedCustomers = JSON.parse(data);

            let addedCount = 0;
            let updatedCount = 0;
            let errorCount = 0;

            importedCustomers.forEach(item => {
                try {
                    let customerType = 'retail';
                    if (item['نوع مشتری'] === 'عمده‌فروشی' || item.customerType === 'wholesale') customerType = 'wholesale';
                    if (item['نوع مشتری'] === 'توزیع‌کننده' || item.customerType === 'distributor') customerType = 'distributor';
                    if (item['نوع مشتری'] === 'شرکتی' || item.customerType === 'corporate') customerType = 'corporate';
                    if (item['نوع مشتری'] === 'ویژه' || item.customerType === 'vip') customerType = 'vip';

                    const customerData = {
                        code: item.کد || item.code,
                        name: item.نام || item.name,
                        company: item.شرکت || item.company || '',
                        phone: item.تلفن || item.phone || '',
                        email: item.ایمیل || item.email || '',
                        address: item.آدرس || item.address || '',
                        city: item.شهر || item.city || '',
                        country: item.کشور || item.country || '',
                        notes: item.یادداشت || item.notes || '',
                        balance: Number(item.موجودی || item.balance || 0),
                        currency: item.ارز || item.currency || 'AED',
                        vatNumber: item['شماره مالیاتی'] || item.vatNumber || '',
                        customerType: customerType,
                        isActive: (item.وضعیت === 'فعال' || item.isActive === true) ? true : false
                    };

                    const existingCustomer = this.getCustomerByCode(customerData.code);
                    if (existingCustomer) {
                        this.updateCustomer(existingCustomer.id, customerData);
                        updatedCount++;
                    } else {
                        this.addCustomer(customerData);
                        addedCount++;
                    }
                } catch (e) {
                    console.error('Error importing customer:', e);
                    errorCount++;
                }
            });

            return { addedCount, updatedCount, errorCount };
        } catch (e) {
            throw new Error('فرمت داده‌های وارد شده نامعتبر است');
        }
    }
}

// =====================================================
// توابع UI مدیریت مشتریان
// =====================================================

// مدیریت مودال مشتری
function openCustomerModal(customerId = null) {
    const modal = document.getElementById('customerModal');
    const modalTitle = document.getElementById('customerModalTitle');
    const form = document.getElementById('customerForm');

    // پاک کردن فرم
    form.reset();

    if (customerId) {
        // حالت ویرایش
        const customerManager = new CustomerManager();
        const customer = customerManager.getCustomerById(customerId);

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

            // تنظیم نوع موجودی (بدهکار/بستانکار)
            if (customer.balance < 0) {
                form.elements.balanceType.value = 'debit';
                form.elements.balance.value = Math.abs(customer.balance);
            } else {
                form.elements.balanceType.value = 'credit';
                form.elements.balance.value = customer.balance;
            }

            form.elements.currency.value = customer.currency;
            form.elements.vatNumber.value = customer.vatNumber || '';
            form.elements.customerType.value = customer.customerType;
            form.elements.isActive.checked = customer.isActive;
        }
    } else {
        // حالت افزودن
        modalTitle.textContent = 'مشتری جدید';

        // تولید کد مشتری جدید
        const customerManager = new CustomerManager();
        form.elements.code.value = customerManager.generateNewCustomerCode();
        form.elements.currency.value = 'AED';
        form.elements.customerType.value = 'retail';
        form.elements.balance.value = '0';
        form.elements.balanceType.value = 'credit';
    }

    // نمایش مودال
    modal.style.display = 'block';
}

// بستن مودال مشتری
function closeCustomerModal() {
    const modal = document.getElementById('customerModal');
    modal.style.display = 'none';
}

// ذخیره مشتری
function saveCustomer() {
    const form = document.getElementById('customerForm');

    // اعتبارسنجی فرم
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        const customerManager = new CustomerManager();

        // تعیین مقدار موجودی بر اساس نوع بدهکار/بستانکار
        let balanceAmount = Number(form.elements.balance.value);
        if (form.elements.balanceType.value === 'debit') {
            balanceAmount = -balanceAmount; // منفی برای بدهکار
        }

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
            balance: balanceAmount,
            currency: form.elements.currency.value,
            vatNumber: form.elements.vatNumber.value.trim(),
            customerType: form.elements.customerType.value,
            isActive: form.elements.isActive.checked
        };

        const customerId = form.elements.customerId.value;

        if (customerId) {
            // بروزرسانی مشتری موجود
            customerManager.updateCustomer(Number(customerId), customerData);
            showNotification('مشتری با موفقیت بروزرسانی شد', 'success');
        } else {
            // افزودن مشتری جدید
            customerManager.addCustomer(customerData);
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

// حذف مشتری
function deleteCustomer(customerId) {
    if (!confirm('آیا از حذف این مشتری اطمینان دارید؟')) {
        return;
    }

    try {
        const customerManager = new CustomerManager();
        customerManager.deleteCustomer(Number(customerId));

        showNotification('مشتری با موفقیت حذف شد', 'success');
        loadCustomersTable();
        updateDashboard();

    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// جستجو و فیلتر مشتریان
function searchCustomers() {
    const searchQuery = document.getElementById('customerSearch').value;
    const customerTypeFilter = document.getElementById('customerTypeFilter').value;
    const cityFilter = document.getElementById('cityFilter').value;
    const balanceFilter = document.getElementById('balanceFilter').value;

    filterCustomers(searchQuery, customerTypeFilter, cityFilter, balanceFilter);
}

// فیلتر مشتریان
function filterCustomers(searchQuery, customerTypeFilter, cityFilter, balanceFilter) {
    const searchInput = document.getElementById('customerSearch');
    const customerTypeSelect = document.getElementById('customerTypeFilter');
    const citySelect = document.getElementById('cityFilter');
    const balanceSelect = document.getElementById('balanceFilter');

    // اگر پارامترها تعریف نشده باشند، از مقادیر فعلی استفاده می‌شود
    const query = searchQuery !== undefined ? searchQuery : (searchInput ? searchInput.value : '');
    const customerType = customerTypeFilter !== undefined ? customerTypeFilter : (customerTypeSelect ? customerTypeSelect.value : '');
    const city = cityFilter !== undefined ? cityFilter : (citySelect ? citySelect.value : '');
    const balanceStatus = balanceFilter !== undefined ? balanceFilter : (balanceSelect ? balanceSelect.value : '');

    const customerManager = new CustomerManager();
    const filteredCustomers = customerManager.searchCustomers(query, {
        customerType: customerType,
        city: city,
        balanceStatus: balanceStatus
    });

    renderCustomersTable(filteredCustomers);
}

// بارگذاری جدول مشتریان
function loadCustomersTable() {
    const customerManager = new CustomerManager();
    const customers = customerManager.getAllCustomers();

    renderCustomersTable(customers);

    // بروزرسانی شهرها در فیلتر
    updateCityFilter();
}

// بروزرسانی فیلتر شهر
function updateCityFilter() {
    const customerManager = new CustomerManager();
    const cities = customerManager.getCities();
    const cityFilter = document.getElementById('cityFilter');

    if (!cityFilter) return;

    // ذخیره انتخاب فعلی
    const currentSelection = cityFilter.value;

    // پاک کردن همه گزینه‌ها به جز اولی (همه شهرها)
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

// نمایش جدول مشتریان
function renderCustomersTable(customers) {
    const tableBody = document.getElementById('customersTableBody');

    if (!tableBody) return;

    // پاک کردن جدول
    tableBody.innerHTML = '';

    if (customers.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="text-center">هیچ مشتری یافت نشد</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    // اضافه کردن ردیف‌ها
    customers.forEach(customer => {
        const row = document.createElement('tr');

        // تعیین رنگ ردیف بر اساس وضعیت موجودی
        if (customer.balance < 0) {
            row.classList.add('table-danger');
        } else if (customer.balance > 0) {
            row.classList.add('table-success');
        }

        row.innerHTML = `
            <td>${customer.code}</td>
            <td>
                ${customer.name}
                ${customer.company ? `<br><small class="text-muted">${customer.company}</small>` : ''}
            </td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.getCustomerTypeText()}</td>
            <td>
                <span class="badge ${customer.balance < 0 ? 'badge-danger' : customer.balance > 0 ? 'badge-success' : 'badge-secondary'}">
                    ${customer.balance.toLocaleString()} ${customer.currency}
                </span>
            </td>
            <td>
                <span class="badge ${customer.isActive ? 'badge-success' : 'badge-secondary'}">
                    ${customer.isActive ? 'فعال' : 'غیرفعال'}
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-primary" onclick="openCustomerModal(${customer.id})" title="ویرایش">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="openAddBalanceModal(${customer.id})" title="تغییر موجودی">
                        <i class="fas fa-money-bill-wave"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// مرتب‌سازی جدول
function sortCustomersTable(column) {
    const customerManager = new CustomerManager();
    const customers = customerManager.getAllCustomers();

    // تعیین ترتیب مرتب‌سازی
    const currentOrder = localStorage.getItem('customers_sort_order') || 'asc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

    // ذخیره ترتیب جدید
    localStorage.setItem('customers_sort_order', newOrder);

    // مرتب‌سازی مشتریان
    customers.sort((a, b) => {
        let valueA, valueB;

        switch (column) {
            case 0: // کد
                valueA = a.code;
                valueB = b.code;
                break;
            case 1: // نام
                valueA = a.name;
                valueB = b.name;
                break;
            case 2: // تلفن
                valueA = a.phone || '';
                valueB = b.phone || '';
                break;
            case 3: // نوع مشتری
                valueA = a.customerType;
                valueB = b.customerType;
                break;
            case 4: // موجودی
                valueA = a.balance;
                valueB = b.balance;
                break;
            case 5: // وضعیت
                valueA = a.isActive ? 1 : 0;
                valueB = b.isActive ? 1 : 0;
                break;
            default:
                valueA = a.id;
                valueB = b.id;
        }

        // مقایسه
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            if (newOrder === 'asc') {
                return valueA.localeCompare(valueB);
            } else {
                return valueB.localeCompare(valueA);
            }
        } else {
            if (newOrder === 'asc') {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        }
    });

    // بروزرسانی جدول
    renderCustomersTable(customers);
}

// مودال تغییر موجودی
function openAddBalanceModal(customerId) {
    const customerManager = new CustomerManager();
    const customer = customerManager.getCustomerById(customerId);

    if (!customer) {
        showNotification('مشتری یافت نشد', 'error');
        return;
    }

    const modal = document.getElementById('addBalanceModal');
    if (!modal) {
        console.error('مودال تغییر موجودی یافت نشد');
        return;
    }

    const form = document.getElementById('addBalanceForm');

    document.getElementById('balanceCustomerName').textContent = customer.getFullName();
    document.getElementById('balanceCustomerCode').textContent = customer.code;
    document.getElementById('currentBalance').textContent = `${customer.balance.toLocaleString()} ${customer.currency}`;

    form.elements.customerId.value = customer.id;
    form.elements.balanceCurrency.value = customer.currency;
    form.elements.balanceAmount.value = '';
    form.elements.balanceType.value = 'deposit';

    modal.style.display = 'block';
}

// بستن مودال تغییر موجودی
function closeAddBalanceModal() {
    const modal = document.getElementById('addBalanceModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ذخیره تغییر موجودی
function saveAddBalance() {
    const form = document.getElementById('addBalanceForm');

    // اعتبارسنجی فرم
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        const customerManager = new CustomerManager();
        const customerId = Number(form.elements.customerId.value);
        const amount = Number(form.elements.balanceAmount.value);
        const balanceType = form.elements.balanceType.value;

        // تعیین مقدار نهایی بر اساس نوع تراکنش
        const finalAmount = balanceType === 'deposit' ? Math.abs(amount) : -Math.abs(amount);

        customerManager.updateCustomerBalance(customerId, finalAmount);

        showNotification('موجودی مشتری با موفقیت بروزرسانی شد', 'success');
        
        // بستن مودال و بروزرسانی جدول
        closeAddBalanceModal();
        loadCustomersTable();
        updateDashboard();

    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// بروزرسانی آمار داشبورد مشتریان
function updateCustomersDashboardStats() {
    const customerManager = new CustomerManager();
    const stats = customerManager.getCustomersStats();

    // تعداد کل مشتریان
    const totalCustomersElement = document.getElementById('totalCustomers');
    if (totalCustomersElement) {
        totalCustomersElement.textContent = stats.total;
    }

    // مشتریان فعال
    const activeCustomersElement = document.getElementById('activeCustomers');
    if (activeCustomersElement) {
        activeCustomersElement.textContent = stats.active;
    }

    // کل طلب
    const totalCreditElement = document.getElementById('totalCredit');
    if (totalCreditElement) {
        totalCreditElement.textContent = `${stats.totalCredit.toLocaleString()} AED`;
    }

    // کل بدهی
    const totalDebtElement = document.getElementById('totalDebt');
    if (totalDebtElement) {
        totalDebtElement.textContent = `${stats.totalDebt.toLocaleString()} AED`;
    }
}

// خروجی گرفتن از مشتریان
function exportCustomersData() {
    const customerManager = new CustomerManager();
    const exportData = customerManager.exportCustomers();
    const filename = `مشتریان-${new Date().toISOString().split('T')[0]}.json`;
    
    downloadFile(exportData, filename, 'application/json');
    showNotification('فایل خروجی مشتریان آماده شد', 'success');
}

// وارد کردن مشتریان
function importCustomersData(fileContent) {
    try {
        const customerManager = new CustomerManager();
        const result = customerManager.importCustomers(fileContent);
        
        const message = `
            ${result.addedCount} مشتری جدید اضافه شد
            ${result.updatedCount} مشتری بروزرسانی شد
            ${result.errorCount} خطا رخ داد
        `;
        
        showNotification(message, 'success');
        loadCustomersTable();
        updateDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
    // بارگذاری جدول مشتریان
    if (document.getElementById('customersTableBody')) {
        loadCustomersTable();
    }
    
    // بروزرسانی آمار داشبورد
    updateCustomersDashboardStats();
});

// تعریف متغیر سراسری
if (typeof window !== 'undefined') {
    window.customerManager = new CustomerManager();
}
