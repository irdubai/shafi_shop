// =====================================================
// مدیریت فاکتورها (Invoice Management)
// =====================================================

// مدل داده آیتم فاکتور
window.invoiceManager = new InvoiceManager();
class InvoiceItem {
    constructor(
        productId,
        productName,
        productCode = '',
        quantity,
        unitPrice,
        discount = 0,
        tax = 0,
        total = null
    ) {
        this.productId = productId;
        this.productName = productName;
        this.productCode = productCode;
        this.quantity = Number(quantity);
        this.unitPrice = Number(unitPrice);
        this.discount = Number(discount);
        this.tax = Number(tax);
        this.total = total !== null ? Number(total) : this.calculateTotal();
    }

    // محاسبه مجموع آیتم
    calculateTotal() {
        const lineTotal = this.quantity * this.unitPrice;
                const totalInRial = lineTotal - this.discount + this.tax;
        this.totalYuan = (totalInRial / 35000).toFixed(2);
        this.totalDirham = (totalInRial / 80000).toFixed(2);
        return totalInRial;
    }

    // بروزرسانی مجموع
    updateTotal() {
        this.total = this.calculateTotal();
        return this.total;
    }

    // محاسبه مبلغ خالص (بدون تخفیف و مالیات)
    getNetAmount() {
        return this.quantity * this.unitPrice;
    }
}

// مدل داده فاکتور
class Invoice {
    constructor(
        id = null,
        invoiceNumber = '',
        date = new Date().toISOString().split('T')[0],
        customerId = null,
        customerName = '',
        invoiceType = 'فروش',
        currency = 'AED',
        status = 'در انتظار',
        paymentMethod = 'نقدی',
        items = [],
        subtotal = 0,
        discount = 0,
        tax = 0,
        total = 0,
        paidAmount = 0,
        notes = ''
    ) {
        this.id = id || Date.now();
        this.invoiceNumber = invoiceNumber;
        this.date = date;
        this.customerId = customerId;
        this.customerName = customerName;
        this.invoiceType = invoiceType;
        this.currency = currency;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.items = items.map(item => new InvoiceItem(
            item.productId,
            item.productName,
            item.productCode,
            item.quantity,
            item.unitPrice,
            item.discount,
            item.tax,
            item.total
        ));
        this.subtotal = Number(subtotal);
        this.discount = Number(discount);
        this.tax = Number(tax);
        this.total = Number(total);
        this.paidAmount = Number(paidAmount);
        this.remainingAmount = this.total - this.paidAmount;
        this.notes = notes;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // محاسبه مجموع فرعی
    calculateSubtotal() {
        this.subtotal = this.items.reduce((sum, item) => sum + item.getNetAmount(), 0);
        return this.subtotal;
    }

    // محاسبه مجموع نهایی
    calculateTotal() {
        this.calculateSubtotal();
        this.total = this.subtotal - this.discount + this.tax;
        this.remainingAmount = this.total - this.paidAmount;
        return this.total;
    }

    // افزودن آیتم
    addItem(item) {
        this.items.push(new InvoiceItem(
            item.productId,
            item.productName,
            item.productCode,
            item.quantity,
            item.unitPrice,
            item.discount || 0,
            item.tax || 0
        ));
        this.calculateTotal();
        this.updatedAt = new Date().toISOString();
    }

    // حذف آیتم
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            this.calculateTotal();
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // بروزرسانی آیتم
    updateItem(index, itemData) {
        if (index >= 0 && index < this.items.length) {
            const item = this.items[index];
            item.quantity = Number(itemData.quantity || item.quantity);
            item.unitPrice = Number(itemData.unitPrice || item.unitPrice);
            item.discount = Number(itemData.discount || item.discount);
            item.tax = Number(itemData.tax || item.tax);
            item.updateTotal();
            this.calculateTotal();
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // بروزرسانی پرداخت
    updatePayment(paidAmount, paymentMethod = null) {
        this.paidAmount = Number(paidAmount);
        if (paymentMethod) {
            this.paymentMethod = paymentMethod;
        }
        this.remainingAmount = this.total - this.paidAmount;

        // بروزرسانی وضعیت بر اساس پرداخت
        if (this.remainingAmount <= 0) {
            this.status = 'پرداخت شده';
        } else if (this.paidAmount > 0) {
            this.status = 'پرداخت جزئی';
        }

        this.updatedAt = new Date().toISOString();
    }

    // دریافت وضعیت پرداخت
    getPaymentStatus() {
        if (this.remainingAmount <= 0) {
            return 'تسویه شده';
        } else if (this.paidAmount > 0) {
            return 'پرداخت جزئی';
        } else {
            return 'پرداخت نشده';
        }
    }

    // دریافت نوع فاکتور به انگلیسی
    getInvoiceTypePrefix() {
        switch (this.invoiceType) {
            case 'فروش': return 'FS';
            case 'خرید': return 'FP';
            case 'مرجوعی فروش': return 'RS';
            case 'مرجوعی خرید': return 'RP';
            default: return 'IN';
        }
    }

    // بروزرسانی فاکتور
    update(data) {
        this.invoiceNumber = data.invoiceNumber || this.invoiceNumber;
        this.date = data.date || this.date;
        this.customerId = data.customerId !== undefined ? data.customerId : this.customerId;
        this.customerName = data.customerName || this.customerName;
        this.invoiceType = data.invoiceType || this.invoiceType;
        this.currency = data.currency || this.currency;
        this.status = data.status || this.status;
        this.paymentMethod = data.paymentMethod || this.paymentMethod;
        this.discount = Number(data.discount !== undefined ? data.discount : this.discount);
        this.tax = Number(data.tax !== undefined ? data.tax : this.tax);
        this.paidAmount = Number(data.paidAmount !== undefined ? data.paidAmount : this.paidAmount);
        this.notes = data.notes !== undefined ? data.notes : this.notes;

        this.calculateTotal();
        this.updatedAt = new Date().toISOString();
    }
}

// مدیریت فاکتورها
class InvoiceManager {
    constructor() {
        this.invoices = [];
        this.loadInvoices();
    }

    // بارگذاری فاکتورها از localStorage
    loadInvoices() {
        const invoicesData = localStorage.getItem('shafi_invoices');
        if (invoicesData) {
            try {
                const parsed = JSON.parse(invoicesData);
                this.invoices = parsed.map(i => {
                    const invoice = new Invoice(
                        i.id,
                        i.invoiceNumber,
                        i.date,
                        i.customerId,
                        i.customerName,
                        i.invoiceType,
                        i.currency,
                        i.status,
                        i.paymentMethod,
                        i.items,
                        i.subtotal,
                        i.discount,
                        i.tax,
                        i.total,
                        i.paidAmount,
                        i.notes
                    );
                    invoice.createdAt = i.createdAt || invoice.createdAt;
                    invoice.updatedAt = i.updatedAt || invoice.updatedAt;
                    return invoice;
                });
            } catch (e) {
                console.error('Error loading invoices:', e);
                this.invoices = [];
            }
        }
    }

    // ذخیره فاکتورها در localStorage
    saveInvoices() {
        localStorage.setItem('shafi_invoices', JSON.stringify(this.invoices));
    }

    // دریافت تمام فاکتورها
    getAllInvoices() {
        return [...this.invoices];
    }

    // دریافت فاکتور با ID
    getInvoiceById(id) {
        return this.invoices.find(i => i.id === id);
    }

    // دریافت فاکتور با شماره
    getInvoiceByNumber(invoiceNumber) {
        return this.invoices.find(i => i.invoiceNumber === invoiceNumber);
    }

    // افزودن فاکتور جدید
    addInvoice(invoiceData) {
        // بررسی تکراری نبودن شماره فاکتور
        if (invoiceData.invoiceNumber && this.getInvoiceByNumber(invoiceData.invoiceNumber)) {
            throw new Error('شماره فاکتور تکراری است');
        }

        const invoice = new Invoice(
            null,
            invoiceData.invoiceNumber || this.generateInvoiceNumber(invoiceData.invoiceType),
            invoiceData.date,
            invoiceData.customerId,
            invoiceData.customerName,
            invoiceData.invoiceType,
            invoiceData.currency,
            invoiceData.status,
            invoiceData.paymentMethod,
            invoiceData.items || [],
            0, // subtotal محاسبه می‌شود
            invoiceData.discount || 0,
            invoiceData.tax || 0,
            0, // total محاسبه می‌شود
            invoiceData.paidAmount || 0,
            invoiceData.notes
        );

        // محاسبه مجاميع
        invoice.calculateTotal();

        this.invoices.push(invoice);
        this.saveInvoices();
        this.addActivity(`فاکتور جدید «${invoice.invoiceNumber}» ایجاد شد.`);

        // بروزرسانی موجودی محصولات
        this.updateProductStock(invoice);

        // بروزرسانی موجودی مشتری
        this.updateCustomerBalance(invoice);

        return invoice;
    }

    // بروزرسانی فاکتور
    updateInvoice(id, invoiceData) {
        const index = this.invoices.findIndex(i => i.id === id);
        if (index === -1) {
            throw new Error('فاکتور یافت نشد');
        }

        const invoice = this.invoices[index];
        const oldTotal = invoice.total;
        const oldStatus = invoice.status;

        // بررسی تکراری نبودن شماره فاکتور اگر تغییر کرده باشد
        if (invoiceData.invoiceNumber !== invoice.invoiceNumber) {
            const existingInvoice = this.getInvoiceByNumber(invoiceData.invoiceNumber);
            if (existingInvoice && existingInvoice.id !== id) {
                throw new Error('شماره فاکتور تکراری است');
            }
        }

        // بازگرداندن موجودی قبلی محصولات
        this.revertProductStock(invoice);
        this.revertCustomerBalance(invoice);

        // بروزرسانی فاکتور
        invoice.update(invoiceData);

        // اعمال موجودی جدید
        this.updateProductStock(invoice);
        this.updateCustomerBalance(invoice);

        this.saveInvoices();
        this.addActivity(`فاکتور «${invoice.invoiceNumber}» بروزرسانی شد.`);

        return invoice;
    }

    // حذف فاکتور
    deleteInvoice(id) {
        const index = this.invoices.findIndex(i => i.id === id);
        if (index === -1) {
            throw new Error('فاکتور یافت نشد');
        }

        const invoice = this.invoices[index];

        // بازگرداندن موجودی محصولات
        this.revertProductStock(invoice);
        this.revertCustomerBalance(invoice);

        this.invoices.splice(index, 1);
        this.saveInvoices();
        this.addActivity(`فاکتور «${invoice.invoiceNumber}» حذف شد.`);

        return true;
    }

    // جستجوی فاکتورها
    searchInvoices(query = '', options = {}) {
        if (!query && !options.invoiceType && !options.status && !options.dateFrom && !options.dateTo) {
            return this.getAllInvoices();
        }

        return this.invoices.filter(invoice => {
            // جستجو بر اساس متن
            const matchesQuery = !query ||
                invoice.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
                invoice.customerName.toLowerCase().includes(query.toLowerCase()) ||
                (invoice.notes && invoice.notes.toLowerCase().includes(query.toLowerCase()));

            // فیلتر بر اساس نوع فاکتور
            const matchesType = !options.invoiceType || invoice.invoiceType === options.invoiceType;

            // فیلتر بر اساس وضعیت
            const matchesStatus = !options.status || invoice.status === options.status;

            // فیلتر بر اساس تاریخ از
            const matchesDateFrom = !options.dateFrom || invoice.date >= options.dateFrom;

            // فیلتر بر اساس تاریخ تا
            const matchesDateTo = !options.dateTo || invoice.date <= options.dateTo;

            // فیلتر بر اساس مشتری
            const matchesCustomer = !options.customerId || invoice.customerId === options.customerId;

            return matchesQuery && matchesType && matchesStatus &&
                   matchesDateFrom && matchesDateTo && matchesCustomer;
        });
    }

    // بروزرسانی موجودی محصولات
    updateProductStock(invoice) {
        const productManager = new ProductManager();

        invoice.items.forEach(item => {
            const product = productManager.getProductById(item.productId);
            if (product) {
                let stockChange = 0;

                // تعیین تغییر موجودی بر اساس نوع فاکتور
                switch (invoice.invoiceType) {
                    case 'فروش':
                        stockChange = -item.quantity; // کاهش موجودی
                        break;
                    case 'خرید':
                        stockChange = item.quantity; // افزایش موجودی
                        break;
                    case 'مرجوعی فروش':
                        stockChange = item.quantity; // افزایش موجودی (برگشت)
                        break;
                    case 'مرجوعی خرید':
                        stockChange = -item.quantity; // کاهش موجودی (برگشت)
                        break;
                }

                if (stockChange !== 0) {
                    productManager.updateProductStock(item.productId, stockChange);
                }
            }
        });
    }

    // بازگرداندن موجودی محصولات
    revertProductStock(invoice) {
        const productManager = new ProductManager();

        invoice.items.forEach(item => {
            const product = productManager.getProductById(item.productId);
            if (product) {
                let stockChange = 0;

                // معکوس تغییر موجودی
                switch (invoice.invoiceType) {
                    case 'فروش':
                        stockChange = item.quantity; // افزایش موجودی (برگشت)
                        break;
                    case 'خرید':
                        stockChange = -item.quantity; // کاهش موجودی (برگشت)
                        break;
                    case 'مرجوعی فروش':
                        stockChange = -item.quantity; // کاهش موجودی (برگشت)
                        break;
                    case 'مرجوعی خرید':
                        stockChange = item.quantity; // افزایش موجودی (برگشت)
                        break;
                }

                if (stockChange !== 0) {
                    productManager.updateProductStock(item.productId, stockChange);
                }
            }
        });
    }

    // بروزرسانی موجودی مشتری
    updateCustomerBalance(invoice) {
        if (!invoice.customerId) return;

        const customerManager = new CustomerManager();
        const customer = customerManager.getCustomerById(invoice.customerId);

        if (customer) {
            let balanceChange = 0;

            // تعیین تغییر موجودی بر اساس نوع فاکتور
            switch (invoice.invoiceType) {
                case 'فروش':
                    balanceChange = -(invoice.total - invoice.paidAmount); // کاهش موجودی (بدهی)
                    break;
                case 'خرید':
                    balanceChange = invoice.total - invoice.paidAmount; // افزایش موجودی (طلب)
                    break;
                case 'مرجوعی فروش':
                    balanceChange = invoice.total - invoice.paidAmount; // افزایش موجودی (برگشت)
                    break;
                case 'مرجوعی خرید':
                    balanceChange = -(invoice.total - invoice.paidAmount); // کاهش موجودی (برگشت)
                    break;
            }

            if (balanceChange !== 0) {
                customerManager.updateCustomerBalance(invoice.customerId, balanceChange);
            }
        }
    }

    // بازگرداندن موجودی مشتری
    revertCustomerBalance(invoice) {
        if (!invoice.customerId) return;

        const customerManager = new CustomerManager();
        const customer = customerManager.getCustomerById(invoice.customerId);

        if (customer) {
            let balanceChange = 0;

            // معکوس تغییر موجودی
            switch (invoice.invoiceType) {
                case 'فروش':
                    balanceChange = invoice.total - invoice.paidAmount; // افزایش موجودی (برگشت بدهی)
                    break;
                case 'خرید':
                    balanceChange = -(invoice.total - invoice.paidAmount); // کاهش موجودی (برگشت طلب)
                    break;
                case 'مرجوعی فروش':
                    balanceChange = -(invoice.total - invoice.paidAmount); // کاهش موجودی (برگشت)
                    break;
                case 'مرجوعی خرید':
                    balanceChange = invoice.total - invoice.paidAmount; // افزایش موجودی (برگشت)
                    break;
            }

            if (balanceChange !== 0) {
                customerManager.updateCustomerBalance(invoice.customerId, balanceChange);
            }
        }
    }

    // تولید شماره فاکتور جدید
    generateInvoiceNumber(invoiceType = 'فروش') {
        const now = new Date();
        const prefix = this.getInvoicePrefix(invoiceType);
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');

        return `${prefix}-${year}${month}${day}-${hour}${minute}`;
    }

    // دریافت پیشوند شماره فاکتور
    getInvoicePrefix(invoiceType) {
        switch (invoiceType) {
            case 'فروش': return 'FS';
            case 'خرید': return 'FP';
            case 'مرجوعی فروش': return 'RS';
            case 'مرجوعی خرید': return 'RP';
            default: return 'IN';
        }
    }

    // دریافت آمار فاکتورها
    getInvoiceStats() {
        const stats = {
            total: this.invoices.length,
            byType: {},
            byStatus: {},
            totalAmount: 0,
            paidAmount: 0,
            remainingAmount: 0
        };

        this.invoices.forEach(invoice => {
            // آمار بر اساس نوع
            stats.byType[invoice.invoiceType] = (stats.byType[invoice.invoiceType] || 0) + 1;

            // آمار بر اساس وضعیت
            stats.byStatus[invoice.status] = (stats.byStatus[invoice.status] || 0) + 1;

            // مبالغ
            stats.totalAmount += invoice.total;
            stats.paidAmount += invoice.paidAmount;
            stats.remainingAmount += invoice.remainingAmount;
        });

        return stats;
    }

    // دریافت فاکتورهای امروز
    getTodayInvoices() {
        const today = new Date().toISOString().split('T')[0];
        return this.invoices.filter(i => i.date === today);
    }

    // دریافت فاکتورهای ماه جاری
    getCurrentMonthInvoices() {
        const now = new Date();
        const currentMonth = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
        return this.invoices.filter(i => i.date.startsWith(currentMonth));
    }

    // دریافت فاکتورهای معوق
    getOverdueInvoices() {
        const today = new Date().toISOString().split('T')[0];
        return this.invoices.filter(i =>
            i.remainingAmount > 0 &&
            i.date < today &&
            i.status !== 'لغو شده'
        );
    }

    // ثبت فعالیت
    addActivity(description) {
        const activitiesManager = new ActivitiesManager();
        activitiesManager.addActivity({
            module: 'invoices',
            description,
            timestamp: new Date().toISOString()
        });
    }

    // خروجی گرفتن از فاکتورها
    exportInvoices() {
        const exportData = this.invoices.map(i => ({
            'شماره فاکتور': i.invoiceNumber,
            'تاریخ': i.date,
            'مشتری': i.customerName,
            'نوع فاکتور': i.invoiceType,
            'وضعیت': i.status,
            'روش پرداخت': i.paymentMethod,
            'جمع فرعی': i.subtotal,
            'تخفیف': i.discount,
            'مالیات': i.tax,
            'مجموع': i.total,
            'پرداخت شده': i.paidAmount,
            'مانده': i.remainingAmount,
            'ارز': i.currency,
            'یادداشت': i.notes,
            'اقلام': i.items.map(item => `${item.productName} (${item.quantity})`).join(', ')
        }));

        return JSON.stringify(exportData, null, 2);
    }

    // وارد کردن فاکتورها
    importInvoices(data) {
        try {
            const importedInvoices = JSON.parse(data);

            let addedCount = 0;
            let errorCount = 0;

            importedInvoices.forEach(item => {
                try {
                    const invoiceData = {
                        invoiceNumber: item['شماره فاکتور'] || item.invoiceNumber,
                        date: item.تاریخ || item.date,
                        customerName: item.مشتری || item.customerName,
                        invoiceType: item['نوع فاکتور'] || item.invoiceType || 'فروش',
                        status: item.وضعیت || item.status || 'در انتظار',
                        paymentMethod: item['روش پرداخت'] || item.paymentMethod || 'نقدی',
                        discount: Number(item.تخفیف || item.discount || 0),
                        tax: Number(item.مالیات || item.tax || 0),
                        paidAmount: Number(item['پرداخت شده'] || item.paidAmount || 0),
                        currency: item.ارز || item.currency || 'AED',
                        notes: item.یادداشت || item.notes || '',
                        items: [] // باید به صورت جداگانه تعریف شود
                    };

                    this.addInvoice(invoiceData);
                    addedCount++;
                } catch (e) {
                    console.error('Error importing invoice:', e);
                    errorCount++;
                }
            });

            return { addedCount, errorCount };
        } catch (e) {
            throw new Error('فرمت داده‌های وارد شده نامعتبر است');
        }
    }
}

// کدهای مدیریت UI فاکتورها

// متغیر سراسری برای نگهداری فاکتور در حال ویرایش
let currentInvoice = null;

// باز کردن مودال فاکتور
function openInvoiceModal(invoiceId = null) {
    const modal = document.getElementById('invoiceModal');
    const modalTitle = document.getElementById('invoiceModalTitle');

    // پاک کردن فرم
    resetInvoiceForm();

    if (invoiceId) {
        // حالت ویرایش
        const invoiceManager = new InvoiceManager();
        const invoice = invoiceManager.getInvoiceById(invoiceId);

        if (invoice) {
            modalTitle.textContent = 'ویرایش فاکتور';
            currentInvoice = invoice;
            loadInvoiceToForm(invoice);
        }
    } else {
        // حالت افزودن
        modalTitle.textContent = 'فاکتور جدید';
        currentInvoice = new Invoice();

        // تولید شماره فاکتور جدید
        const invoiceManager = new InvoiceManager();
        currentInvoice.invoiceNumber = invoiceManager.generateInvoiceNumber();
        document.getElementById('invoiceNumber').value = currentInvoice.invoiceNumber;
    }

    // نمایش مودال
    modal.style.display = 'block';
    updateInvoiceCalculations();
}

// بستن مودال فاکتور
function closeInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    modal.style.display = 'none';
    currentInvoice = null;
}

// پاک کردن فرم فاکتور
function resetInvoiceForm() {
    const form = document.getElementById('invoiceForm');
    form.reset();

    // پاک کردن جدول اقلام
    const itemsTableBody = document.getElementById('invoiceItemsTableBody');
    itemsTableBody.innerHTML = '';

    // تنظیم مقادیر پیش‌فرض
    document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceType').value = 'فروش';
    document.getElementById('invoiceCurrency').value = 'AED';
    document.getElementById('invoiceStatus').value = 'در انتظار';
    document.getElementById('paymentMethod').value = 'نقدی';
    document.getElementById('discountAmount').value = '0';
    document.getElementById('taxAmount').value = '0';
    document.getElementById('paidAmount').value = '0';

    // پاک کردن انتخاب مشتری
    clearSelectedCustomer();
}

// بارگذاری فاکتور در فرم
function loadInvoiceToForm(invoice) {
    document.getElementById('invoiceNumber').value = invoice.invoiceNumber;
    document.getElementById('invoiceDate').value = invoice.date;
    document.getElementById('invoiceType').value = invoice.invoiceType;
    document.getElementById('invoiceCurrency').value = invoice.currency;
    document.getElementById('invoiceStatus').value = invoice.status;
    document.getElementById('paymentMethod').value = invoice.paymentMethod;
    document.getElementById('discountAmount').value = invoice.discount;
    document.getElementById('taxAmount').value = invoice.tax;
    document.getElementById('paidAmount').value = invoice.paidAmount;
    document.getElementById('invoiceNotes').value = invoice.notes;

    // بارگذاری مشتری
    if (invoice.customerId) {
        const customerManager = new CustomerManager();
        const customer = customerManager.getCustomerById(invoice.customerId);
        if (customer) {
            selectCustomerForInvoice(customer);
        }
    }

    // بارگذاری اقلام
    renderInvoiceItems();
}

// انتخاب مشتری برای فاکتور
function selectCustomerForInvoice(customer) {
    currentInvoice.customerId = customer.id;
    currentInvoice.customerName = customer.name;

    // نمایش اطلاعات مشتری
    const customerInfo = document.getElementById('selectedCustomerInfo');
    customerInfo.innerHTML = `
        <div class="customer-card">
            <div class="customer-header">
                <h4>${customer.getFullName()}</h4>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="clearSelectedCustomer()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="customer-details">
                <span>کد: ${customer.code}</span>
                <span>تلفن: ${customer.phone || '-'}</span>
                <span>موجودی: ${customer.balance.toLocaleString()} ${customer.currency}</span>
            </div>
        </div>
    `;
    customerInfo.style.display = 'block';

    document.getElementById('customerSelectionPlaceholder').style.display = 'none';
}

// پاک کردن انتخاب مشتری
function clearSelectedCustomer() {
    if (currentInvoice) {
        currentInvoice.customerId = null;
        currentInvoice.customerName = '';
    }

    document.getElementById('selectedCustomerInfo').style.display = 'none';
    document.getElementById('customerSelectionPlaceholder').style.display = 'block';
}
// افزودن آیتم جدید به فاکتور
function addInvoiceItem() {
    if (!currentInvoice) return;

    const newItem = new InvoiceItem(
        null,           // productId
        '',             // productName
        '',             // productCode
        1,              // quantity
        0,              // unitPrice
        0,              // discount
        0               // tax
    );

    currentInvoice.addItem(newItem);
    renderInvoiceItems();
    updateInvoiceCalculations();
}

// حذف آیتم از فاکتور
function removeInvoiceItem(index) {
    if (!currentInvoice) return;

    if (confirm('آیا از حذف این آیتم اطمینان دارید؟')) {
        currentInvoice.removeItem(index);
        renderInvoiceItems();
        updateInvoiceCalculations();
    }
}

// نمایش آیتم‌های فاکتور
function renderInvoiceItems() {
    if (!currentInvoice) return;

    const tableBody = document.getElementById('invoiceItemsTableBody');
    tableBody.innerHTML = '';

    currentInvoice.items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="form-control product-select" onchange="selectProductForItem(this, ${index})">
                    <option value="">انتخاب کالا</option>
                    ${getProductOptions(item.productId)}
                </select>
            </td>
            <td>
                <input type="text" class="form-control" value="${item.productCode}" readonly>
            </td>
            <td>
                <input type="number" class="form-control" min="1" value="${item.quantity}" 
                       onchange="updateItemField(${index}, 'quantity', this.value)">
            </td>
            <td>
                <input type="number" class="form-control" step="0.01" value="${item.unitPrice}" 
                       onchange="updateItemField(${index}, 'unitPrice', this.value)">
            </td>
            <td>
                <select class="form-control" onchange="updateItemCurrency(${index}, this.value)">
                    <option value="AED" ${currentInvoice.currency === 'AED' ? 'selected' : ''}>درهم</option>
                    <option value="IRR" ${currentInvoice.currency === 'IRR' ? 'selected' : ''}>ریال</option>
                    <option value="USD" ${currentInvoice.currency === 'USD' ? 'selected' : ''}>دلار</option>
                    <option value="EUR" ${currentInvoice.currency === 'EUR' ? 'selected' : ''}>یورو</option>
                </select>
            </td>
            <td>
                <input type="number" class="form-control" step="0.01" value="${item.discount}" 
                       onchange="updateItemField(${index}, 'discount', this.value)">
            </td>
            <td>
                <input type="number" class="form-control" step="0.01" value="${item.tax}" 
                       onchange="updateItemField(${index}, 'tax', this.value)">
            </td>
            <td>
                <input type="text" class="form-control" value="${item.total.toLocaleString()} ${currentInvoice.currency}" readonly>
            </td>
            <td>
                <button type="button" class="btn btn-danger btn-sm" onclick="removeInvoiceItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// دریافت گزینه‌های محصولات برای select
function getProductOptions(selectedProductId = null) {
    const productManager = new ProductManager();
    const products = productManager.getAllProducts();

    return products.map(product => 
        `<option value="${product.id}" ${product.id === selectedProductId ? 'selected' : ''}>
            ${product.name} - ${product.code}
        </option>`
    ).join('');
}

// انتخاب محصول برای آیتم
function selectProductForItem(selectElement, itemIndex) {
    const productId = selectElement.value;
    if (!productId || !currentInvoice) return;

    const productManager = new ProductManager();
    const product = productManager.getProductById(Number(productId));

    if (product) {
        const item = currentInvoice.items[itemIndex];
        item.productId = product.id;
        item.productName = product.name;
        item.productCode = product.code;
        item.unitPrice = product.salePrice;

        // تبدیل ارز اگر متفاوت باشد
        if (product.currency !== currentInvoice.currency) {
            const exchangeManager = new ExchangeRateManager();
            item.unitPrice = exchangeManager.convert(product.salePrice, product.currency, currentInvoice.currency);
        }

        item.updateTotal();
        renderInvoiceItems();
        updateInvoiceCalculations();
    }
}

// بروزرسانی فیلد آیتم
function updateItemField(itemIndex, field, value) {
    if (!currentInvoice || !currentInvoice.items[itemIndex]) return;

    const item = currentInvoice.items[itemIndex];
    item[field] = Number(value);
    item.updateTotal();

    renderInvoiceItems();
    updateInvoiceCalculations();
}

// بروزرسانی ارز آیتم
function updateItemCurrency(itemIndex, newCurrency) {
    if (!currentInvoice || !currentInvoice.items[itemIndex]) return;

    const item = currentInvoice.items[itemIndex];
    const oldCurrency = currentInvoice.currency;

    if (oldCurrency !== newCurrency) {
        const exchangeManager = new ExchangeRateManager();
        item.unitPrice = exchangeManager.convert(item.unitPrice, oldCurrency, newCurrency);
        item.updateTotal();
    }

    renderInvoiceItems();
    updateInvoiceCalculations();
}

// بروزرسانی ارز فاکتور
function updateInvoiceCurrency() {
    if (!currentInvoice) return;

    const newCurrency = document.getElementById('invoiceCurrency').value;
    const oldCurrency = currentInvoice.currency;

    if (oldCurrency !== newCurrency) {
        const exchangeManager = new ExchangeRateManager();

        // تبدیل ارز همه آیتم‌ها
        currentInvoice.items.forEach(item => {
            item.unitPrice = exchangeManager.convert(item.unitPrice, oldCurrency, newCurrency);
            item.discount = exchangeManager.convert(item.discount, oldCurrency, newCurrency);
            item.tax = exchangeManager.convert(item.tax, oldCurrency, newCurrency);
            item.updateTotal();
        });

        // تبدیل تخفیف و مالیات کل
        const discountAmount = Number(document.getElementById('discountAmount').value);
        const taxAmount = Number(document.getElementById('taxAmount').value);
        const paidAmount = Number(document.getElementById('paidAmount').value);

        document.getElementById('discountAmount').value = exchangeManager.convert(discountAmount, oldCurrency, newCurrency);
        document.getElementById('taxAmount').value = exchangeManager.convert(taxAmount, oldCurrency, newCurrency);
        document.getElementById('paidAmount').value = exchangeManager.convert(paidAmount, oldCurrency, newCurrency);

        currentInvoice.currency = newCurrency;
        renderInvoiceItems();
        updateInvoiceCalculations();
    }
}

// محاسبه مجاميع فاکتور
function updateInvoiceCalculations() {
    if (!currentInvoice) return;

    // دریافت مقادیر از فرم
    const discountAmount = Number(document.getElementById('discountAmount').value) || 0;
    const taxAmount = Number(document.getElementById('taxAmount').value) || 0;
    const paidAmount = Number(document.getElementById('paidAmount').value) || 0;

    // بروزرسانی فاکتور
    currentInvoice.discount = discountAmount;
    currentInvoice.tax = taxAmount;
    currentInvoice.paidAmount = paidAmount;
    currentInvoice.calculateTotal();

    // نمایش مقادیر
    const currency = currentInvoice.currency;
    document.getElementById('invoiceSubtotal').textContent = `${currentInvoice.subtotal.toLocaleString()} ${currency}`;
    document.getElementById('invoiceTotal').textContent = `${currentInvoice.total.toLocaleString()} ${currency}`;
    document.getElementById('invoiceRemaining').textContent = `${currentInvoice.remainingAmount.toLocaleString()} ${currency}`;

    // بروزرسانی نمادهای ارز
    document.querySelectorAll('.currency-symbol').forEach(element => {
        element.textContent = currency;
    });
}

// ذخیره فاکتور
function saveInvoice() {
    if (!currentInvoice) return;

    const form = document.getElementById('invoiceForm');
    
    // اعتبارسنجی فرم
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // بررسی وجود حداقل یک آیتم
    if (currentInvoice.items.length === 0) {
        showNotification('حداقل یک کالا به فاکتور اضافه کنید', 'error');
        return;
    }

    // بررسی انتخاب مشتری
    if (!currentInvoice.customerId) {
        showNotification('لطفاً مشتری را انتخاب کنید', 'error');
        return;
    }

    try {
        // جمع‌آوری داده‌های فرم
        currentInvoice.invoiceNumber = document.getElementById('invoiceNumber').value;
        currentInvoice.date = document.getElementById('invoiceDate').value;
        currentInvoice.invoiceType = document.getElementById('invoiceType').value;
        currentInvoice.currency = document.getElementById('invoiceCurrency').value;
        currentInvoice.status = document.getElementById('invoiceStatus').value;
        currentInvoice.paymentMethod = document.getElementById('paymentMethod').value;
        currentInvoice.notes = document.getElementById('invoiceNotes').value;

        const invoiceManager = new InvoiceManager();

        if (currentInvoice.id && invoiceManager.getInvoiceById(currentInvoice.id)) {
            // بروزرسانی فاکتور موجود
            invoiceManager.updateInvoice(currentInvoice.id, currentInvoice);
            showNotification('فاکتور با موفقیت بروزرسانی شد', 'success');
        } else {
            // افزودن فاکتور جدید
            const newInvoice = invoiceManager.addInvoice(currentInvoice);
            currentInvoice = newInvoice;
            showNotification('فاکتور جدید با موفقیت ایجاد شد', 'success');
        }

        // نمایش دکمه‌های چاپ و اشتراک‌گذاری
        document.getElementById('invoiceShareActions').style.display = 'block';

        // بروزرسانی جدول فاکتورها
        loadInvoicesTable();
        updateDashboard();

    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// چاپ فاکتور
function printInvoice() {
    if (!currentInvoice) {
        showNotification('ابتدا فاکتور را ذخیره کنید', 'error');
        return;
    }

    const printContent = generateInvoicePrintContent(currentInvoice);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// صادرات فاکتور به Excel
function exportInvoiceToExcel() {
    if (!currentInvoice) {
        showNotification('ابتدا فاکتور را ذخیره کنید', 'error');
        return;
    }

    // ایجاد محتوای CSV
    const csvContent = generateInvoiceCSV(currentInvoice);
    downloadFile(csvContent, `invoice_${currentInvoice.invoiceNumber}.csv`, 'text/csv');
    showNotification('فاکتور با موفقیت به Excel صادر شد', 'success');
}

// صادرات فاکتور به PDF
function exportInvoiceToPDF() {
    if (!currentInvoice) {
        showNotification('ابتدا فاکتور را ذخیره کنید', 'error');
        return;
    }

    showNotification('قابلیت صادرات PDF در حال توسعه است', 'info');
}

// اشتراک‌گذاری فاکتور
function shareInvoice(platform) {
    if (!currentInvoice) {
        showNotification('ابتدا فاکتور را ذخیره کنید', 'error');
        return;
    }

    const shareText = generateInvoiceShareText(currentInvoice);

    switch (platform) {
        case 'whatsapp':
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
            break;
        case 'telegram':
            window.open(`https://t.me/share/url?url=${encodeURIComponent(shareText)}`);
            break;
        case 'rubika':
        case 'eitaa':
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('متن فاکتور کپی شد. آن را در اپلیکیشن مورد نظر پیست کنید.', 'success');
            });
            break;
    }
}

// تولید محتوای چاپ فاکتور
function generateInvoicePrintContent(invoice) {
    const customerManager = new CustomerManager();
    const customer = customerManager.getCustomerById(invoice.customerId);

    return `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>فاکتور ${invoice.invoiceNumber}</title>
            <style>
                body { font-family: Tahoma, Arial; font-size: 12px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .invoice-details { margin: 20px 0; }
                .customer-details { background: #f9f9f9; padding: 10px; border: 1px solid #ddd; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                th { background: #f0f0f0; }
                .totals { margin-top: 20px; text-align: left; }
                .totals div { margin: 5px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>شرکت شافی</h1>
                <p>فاکتور ${invoice.invoiceType}</p>
            </div>
            
            <div class="invoice-details">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>شماره فاکتور:</strong> ${invoice.invoiceNumber}<br>
                        <strong>تاریخ:</strong> ${invoice.date}<br>
                        <strong>وضعیت:</strong> ${invoice.status}
                    </div>
                    <div class="customer-details">
                        <strong>مشتری:</strong> ${customer ? customer.getFullName() : invoice.customerName}<br>
                        ${customer ? `<strong>کد:</strong> ${customer.code}<br>` : ''}
                        ${customer && customer.phone ? `<strong>تلفن:</strong> ${customer.phone}<br>` : ''}
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ردیف</th>
                        <th>کالا</th>
                        <th>کد</th>
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
                            <td>${item.productCode}</td>
                            <td>${item.quantity}</td>
                            <td>${item.unitPrice.toLocaleString()} ${invoice.currency}</td>
                            <td>${item.discount.toLocaleString()} ${invoice.currency}</td>
                            <td>${item.tax.toLocaleString()} ${invoice.currency}</td>
                            <td>${item.total.toLocaleString()} ${invoice.currency}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals">
                <div><strong>جمع فرعی:</strong> ${invoice.subtotal.toLocaleString()} ${invoice.currency}</div>
                <div><strong>تخفیف کل:</strong> ${invoice.discount.toLocaleString()} ${invoice.currency}</div>
                <div><strong>مالیات کل:</strong> ${invoice.tax.toLocaleString()} ${invoice.currency}</div>
                <div><strong>مجموع نهایی:</strong> ${invoice.total.toLocaleString()} ${invoice.currency}</div>
                <div><strong>پرداخت شده:</strong> ${invoice.paidAmount.toLocaleString()} ${invoice.currency}</div>
                <div><strong>مانده:</strong> ${invoice.remainingAmount.toLocaleString()} ${invoice.currency}</div>
            </div>

            ${invoice.notes ? `<div style="margin-top: 20px;"><strong>توضیحات:</strong><br>${invoice.notes}</div>` : ''}
        </body>
        </html>
    `;
}

// تولید CSV برای Excel
function generateInvoiceCSV(invoice) {
    let csv = 'شماره فاکتور,تاریخ,مشتری,نوع فاکتور,وضعیت,مجموع,ارز\n';
    csv += `"${invoice.invoiceNumber}","${invoice.date}","${invoice.customerName}","${invoice.invoiceType}","${invoice.status}","${invoice.total}","${invoice.currency}"\n\n`;
    
    csv += 'ردیف,کالا,کد,تعداد,قیمت واحد,تخفیف,مالیات,جمع\n';
    invoice.items.forEach((item, index) => {
        csv += `"${index + 1}","${item.productName}","${item.productCode}","${item.quantity}","${item.unitPrice}","${item.discount}","${item.tax}","${item.total}"\n`;
    });

    return csv;
}

// تولید متن اشتراک‌گذاری
function generateInvoiceShareText(invoice) {
    return `فاکتور شماره: ${invoice.invoiceNumber}
تاریخ: ${invoice.date}
مشتری: ${invoice.customerName}
نوع: ${invoice.invoiceType}
مبلغ کل: ${invoice.total.toLocaleString()} ${invoice.currency}
وضعیت: ${invoice.status}

شرکت شافی`;
}

// دانلود فایل
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// بارگذاری جدول فاکتورها
function loadInvoicesTable() {
    const invoiceManager = new InvoiceManager();
    const invoices = invoiceManager.getAllInvoices();
    const tableBody = document.getElementById('invoicesTableBody');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (invoices.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="text-center">هیچ فاکتوری یافت نشد</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.date}</td>
            <td>${invoice.customerName}</td>
            <td>${invoice.invoiceType}</td>
            <td>${invoice.total.toLocaleString()} ${invoice.currency}</td>
            <td><span class="badge badge-${getStatusBadgeClass(invoice.status)}">${invoice.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openInvoiceModal(${invoice.id})" title="ویرایش">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="viewInvoice(${invoice.id})" title="مشاهده">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${invoice.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// دریافت کلاس CSS برای نشان وضعیت
function getStatusBadgeClass(status) {
    switch (status) {
        case 'پرداخت شده': return 'success';
        case 'پرداخت جزئی': return 'warning';
        case 'در انتظار': return 'secondary';
        case 'لغو شده': return 'danger';
        default: return 'primary';
    }
}

// مشاهده فاکتور
function viewInvoice(invoiceId) {
    openInvoiceModal(invoiceId);
    
    // غیرفعال کردن فرم برای فقط مشاهده
    const form = document.getElementById('invoiceForm');
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        if (!input.classList.contains('btn-secondary')) {
            input.disabled = true;
        }
    });

    // تغییر عنوان مودال
    document.getElementById('invoiceModalTitle').textContent = 'مشاهده فاکتور';
    
    // مخفی کردن دکمه ذخیره
    document.getElementById('saveInvoiceBtn').style.display = 'none';
}

// حذف فاکتور
function deleteInvoice(invoiceId) {
    if (!confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
        return;
    }

    try {
        const invoiceManager = new InvoiceManager();
        invoiceManager.deleteInvoice(invoiceId);
        
        showNotification('فاکتور با موفقیت حذف شد', 'success');
        loadInvoicesTable();
        updateDashboard();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// بروزرسانی آمار فاکتورها در داشبورد
function updateInvoiceDashboardStats() {
    const invoiceManager = new InvoiceManager();
    const stats = invoiceManager.getInvoiceStats();

    // تعداد کل فاکتورها
    if (document.getElementById('totalInvoices')) {
        document.getElementById('totalInvoices').textContent = stats.total;
    }

    // فاکتورهای امروز
    const todayInvoices = invoiceManager.getTodayInvoices();
    if (document.getElementById('todayInvoices')) {
        document.getElementById('todayInvoices').textContent = todayInvoices.length;
    }

    // فاکتورهای معوق
    const overdueInvoices = invoiceManager.getOverdueInvoices();
    if (document.getElementById('overdueInvoices')) {
        document.getElementById('overdueInvoices').textContent = overdueInvoices.length;
    }

    // مجموع مبلغ فاکتورها
    if (document.getElementById('totalInvoiceAmount')) {
        document.getElementById('totalInvoiceAmount').textContent = `${stats.totalAmount.toLocaleString()} AED`;
    }
}

// اضافه کردن مودال فاکتور به صفحه
function addInvoiceModal() {
    const modalHTML = `
        <div class="modal" id="invoiceModal" style="display: none;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="invoiceModalTitle">فاکتور جدید</h3>
                        <button type="button" class="close" onclick="closeInvoiceModal()">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="invoiceForm">
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label for="invoiceNumber">شماره فاکتور</label>
                                        <input type="text" id="invoiceNumber" class="form-control" required readonly>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label for="invoiceDate">تاریخ</label>
                                        <input type="date" id="invoiceDate" class="form-control" required>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label for="invoiceType">نوع فاکتور</label>
                                        <select id="invoiceType" class="form-control" required>
                                            <option value="فروش">فروش</option>
                                            <option value="خرید">خرید</option>
                                            <option value="مرجوعی فروش">مرجوعی فروش</option>
                                            <option value="مرجوعی خرید">مرجوعی خرید</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label for="invoiceCurrency">ارز</label>
                                        <select id="invoiceCurrency" class="form-control" onchange="updateInvoiceCurrency()">
                                            <option value="AED">درهم (AED)</option>
                                            <option value="IRR">ریال (IRR)</option>
                                            <option value="USD">دلار (USD)</option>
                                            <option value="EUR">یورو (EUR)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- انتخاب مشتری -->
                            <div class="form-group">
                                <label>انتخاب مشتری</label>
                                <div id="customerSelectionPlaceholder">
                                    <button type="button" class="btn btn-outline-primary" onclick="openCustomerSelectionModal()">
                                        <i class="fas fa-search"></i> انتخاب مشتری
                                    </button>
                                </div>
                                <div id="selectedCustomerInfo" style="display: none;"></div>
                            </div>

                            <!-- آیتم‌های فاکتور -->
                            <div class="form-group">
                                <div class="d-flex justify-content-between align-items-center">
                                    <label>آیتم‌های فاکتور</label>
                                    <button type="button" class="btn btn-success btn-sm" onclick="addInvoiceItem()">
                                        <i class="fas fa-plus"></i> افزودن آیتم
                                    </button>
                                </div>
                                <table class="table table-bordered mt-2">
                                    <thead>
                                        <tr>
                                            <th>کالا</th>
                                            <th>کد</th>
                                            <th>تعداد</th>
                                            <th>قیمت واحد</th>
                                            <th>ارز</th>
                                            <th>تخفیف</th>
                                            <th>مالیات</th>
                                            <th>جمع</th>
                                            <th>عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody id="invoiceItemsTableBody">
                                    </tbody>
                                </table>
                            </div>

                            <!-- محاسبات فاکتور -->
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="invoiceNotes">توضیحات</label>
                                        <textarea id="invoiceNotes" class="form-control" rows="4"></textarea>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <table class="table table-borderless">
                                        <tr>
                                            <td>جمع فرعی:</td>
                                            <td id="invoiceSubtotal">0 <span class="currency-symbol">AED</span></td>
                                        </tr>
                                        <tr>
                                            <td>تخفیف کل:</td>
                                            <td>
                                                <div class="input-group">
                                                    <input type="number" id="discountAmount" class="form-control" step="0.01" value="0" onchange="updateInvoiceCalculations()">
                                                    <div class="input-group-append">
                                                        <span class="input-group-text currency-symbol">AED</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>مالیات کل:</td>
                                            <td>
                                                <div class="input-group">
                                                    <input type="number" id="taxAmount" class="form-control" step="0.01" value="0" onchange="updateInvoiceCalculations()">
                                                    <div class="input-group-append">
                                                        <span class="input-group-text currency-symbol">AED</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>مجموع نهایی:</strong></td>
                                            <td><strong id="invoiceTotal">0 <span class="currency-symbol">AED</span></strong></td>
                                        </tr>
                                        <tr>
                                            <td>پرداخت شده:</td>
                                            <td>
                                                <div class="input-group">
                                                    <input type="number" id="paidAmount" class="form-control" step="0.01" value="0" onchange="updateInvoiceCalculations()">
                                                    <div class="input-group-append">
                                                        <span class="input-group-text currency-symbol">AED</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>مانده:</td>
                                            <td id="invoiceRemaining">0 <span class="currency-symbol">AED</span></td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="invoiceStatus">وضعیت</label>
                                        <select id="invoiceStatus" class="form-control">
                                            <option value="در انتظار">در انتظار</option>
                                            <option value="پرداخت شده">پرداخت شده</option>
                                            <option value="پرداخت جزئی">پرداخت جزئی</option>
                                            <option value="لغو شده">لغو شده</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="paymentMethod">روش پرداخت</label>
                                        <select id="paymentMethod" class="form-control">
                                            <option value="نقدی">نقدی</option>
                                            <option value="چک">چک</option>
                                            <option value="کارت">کارت</option>
                                            <option value="حواله">حواله</option>
                                            <option value="اعتباری">اعتباری</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <!-- دکمه‌های چاپ و اشتراک‌گذاری -->
                        <div id="invoiceShareActions" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                            <h5>عملیات فاکتور</h5>
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-primary" onclick="printInvoice()">
                                    <i class="fas fa-print"></i> چاپ
                                </button>
                                <button type="button" class="btn btn-success" onclick="exportInvoiceToExcel()">
                                    <i class="fas fa-file-excel"></i> Excel
                                </button>
                                <button type="button" class="btn btn-danger" onclick="exportInvoiceToPDF()">
                                    <i class="fas fa-file-pdf"></i> PDF
                                </button>
                            </div>
                            <div class="btn-group ml-2" role="group">
                                <button type="button" class="btn btn-info dropdown-toggle" data-toggle="dropdown">
                                    <i class="fas fa-share-alt"></i> اشتراک‌گذاری
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item" href="javascript:void(0)" onclick="shareInvoice('whatsapp')">
                                        <i class="fab fa-whatsapp"></i> واتساپ
                                    </a>
                                    <a class="dropdown-item" href="javascript:void(0)" onclick="shareInvoice('telegram')">
                                        <i class="fab fa-telegram"></i> تلگرام
                                    </a>
                                    <a class="dropdown-item" href="javascript:void(0)" onclick="shareInvoice('rubika')">
                                        <i class="fas fa-comment"></i> روبیکا
                                    </a>
                                    <a class="dropdown-item" href="javascript:void(0)" onclick="shareInvoice('eitaa')">
                                        <i class="fas fa-comment-dots"></i> ایتا
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeInvoiceModal()">انصراف</button>
                        <button type="button" id="saveInvoiceBtn" class="btn btn-primary" onclick="saveInvoice()">ذخیره فاکتور</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('invoiceModal')) {
        addInvoiceModal();
    }

    // بارگذاری جدول فاکتورها اگر در صفحه فاکتورها هستیم
    if (document.getElementById('invoicesTableBody')) {
        loadInvoicesTable();
    }

    // بروزرسانی آمار فاکتورها در داشبورد
    updateInvoiceDashboardStats();
});
// باز کردن مودال انتخاب مشتری
function openCustomerSelectionModal() {
   const modalHTML = `
       <div class="modal" id="customerSelectionModal" style="display: block;">
           <div class="modal-dialog modal-lg">
               <div class="modal-content">
                   <div class="modal-header">
                       <h3>انتخاب مشتری</h3>
                       <button type="button" class="close" onclick="closeCustomerSelectionModal()">
                           <span>&times;</span>
                       </button>
                   </div>
                   <div class="modal-body">
                       <div class="form-group">
                           <input type="text" id="customerSearchInput" class="form-control" placeholder="جستجو مشتری..." onkeyup="searchCustomersInModal()">
                       </div>
                       <div style="max-height: 300px; overflow-y: auto;">
                           <table class="table table-bordered">
                               <thead>
                                   <tr>
                                       <th>انتخاب</th>
                                       <th>کد</th>
                                       <th>نام</th>
                                       <th>شرکت</th>
                                       <th>موجودی</th>
                                       <th>وضعیت مالی</th>
                                   </tr>
                               </thead>
                               <tbody id="customerSelectionTableBody">
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
           </div>
       </div>
   `;

   // حذف مودال قبلی اگر وجود دارد
   const existingModal = document.getElementById('customerSelectionModal');
   if (existingModal) {
       existingModal.remove();
   }

   document.body.insertAdjacentHTML('beforeend', modalHTML);
   loadCustomersInSelectionModal();
}

// بستن مودال انتخاب مشتری
function closeCustomerSelectionModal() {
   const modal = document.getElementById('customerSelectionModal');
   if (modal) {
       modal.remove();
   }
}

// بارگذاری مشتریان در مودال انتخاب
function loadCustomersInSelectionModal(searchQuery = '') {
   const customerManager = new CustomerManager();
   const customers = customerManager.searchCustomers(searchQuery);
   const tableBody = document.getElementById('customerSelectionTableBody');

   if (!tableBody) return;

   tableBody.innerHTML = '';

   customers.forEach(customer => {
       const balanceStatus = customer.balance >= 0 ? 'بستانکار' : 'بدهکار';
       const statusClass = customer.balance >= 0 ? 'text-success' : 'text-danger';

       const row = document.createElement('tr');
       row.innerHTML = `
           <td>
               <button type="button" class="btn btn-sm btn-primary" onclick="selectCustomer(${customer.id})">
                   انتخاب
               </button>
           </td>
           <td>${customer.code}</td>
           <td>${customer.name}</td>
           <td>${customer.company || '-'}</td>
           <td>${Math.abs(customer.balance).toLocaleString()} ${customer.currency}</td>
           <td><span class="${statusClass}">${balanceStatus}</span></td>
       `;
       tableBody.appendChild(row);
   });
}

// جستجو در مودال انتخاب مشتری
function searchCustomersInModal() {
   const searchInput = document.getElementById('customerSearchInput');
   const searchQuery = searchInput.value.trim();
   loadCustomersInSelectionModal(searchQuery);
}

// انتخاب مشتری
function selectCustomer(customerId) {
   const customerManager = new CustomerManager();
   const customer = customerManager.getCustomerById(customerId);

   if (customer && currentInvoice) {
       currentInvoice.customerId = customer.id;
       currentInvoice.customerName = customer.getFullName();

       // نمایش اطلاعات مشتری انتخاب شده
       const customerInfo = document.getElementById('selectedCustomerInfo');
       const customerPlaceholder = document.getElementById('customerSelectionPlaceholder');
       
       customerInfo.innerHTML = `
           <div class="alert alert-info">
               <div class="row">
                   <div class="col-md-8">
                       <strong>${customer.getFullName()}</strong><br>
                       <small>کد: ${customer.code}</small><br>
                       ${customer.phone ? `<small>تلفن: ${customer.phone}</small><br>` : ''}
                       <small>موجودی: ${customer.balance.toLocaleString()} ${customer.currency}</small>
                   </div>
                   <div class="col-md-4 text-right">
                       <button type="button" class="btn btn-sm btn-outline-secondary" onclick="clearSelectedCustomer()">
                           <i class="fas fa-times"></i> حذف انتخاب
                       </button>
                   </div>
               </div>
           </div>
       `;

       customerPlaceholder.style.display = 'none';
       customerInfo.style.display = 'block';

       closeCustomerSelectionModal();
   }
}

// پاک کردن مشتری انتخاب شده
function clearSelectedCustomer() {
   if (currentInvoice) {
       currentInvoice.customerId = null;
       currentInvoice.customerName = '';

       const customerInfo = document.getElementById('selectedCustomerInfo');
       const customerPlaceholder = document.getElementById('customerSelectionPlaceholder');
       
       customerInfo.style.display = 'none';
       customerPlaceholder.style.display = 'block';
   }
}

// باز کردن مودال فاکتور
function openInvoiceModal(invoiceId = null) {
   const modal = document.getElementById('invoiceModal');
   const modalTitle = document.getElementById('invoiceModalTitle');
   const form = document.getElementById('invoiceForm');

   // پاک کردن فرم
   form.reset();
   
   // فعال کردن همه فیلدها
   const inputs = form.querySelectorAll('input, select, textarea, button');
   inputs.forEach(input => {
       input.disabled = false;
   });

   // نمایش دکمه ذخیره
   document.getElementById('saveInvoiceBtn').style.display = 'inline-block';

   // مخفی کردن دکمه‌های چاپ و اشتراک‌گذاری
   document.getElementById('invoiceShareActions').style.display = 'none';

   // پاک کردن انتخاب مشتری
   clearSelectedCustomer();

   if (invoiceId) {
       // حالت ویرایش
       const invoiceManager = new InvoiceManager();
       const invoice = invoiceManager.getInvoiceById(invoiceId);

       if (invoice) {
           modalTitle.textContent = 'ویرایش فاکتور';
           currentInvoice = invoice;

           // پر کردن فرم با داده‌های فاکتور
           document.getElementById('invoiceNumber').value = invoice.invoiceNumber;
           document.getElementById('invoiceDate').value = invoice.date;
           document.getElementById('invoiceType').value = invoice.invoiceType;
           document.getElementById('invoiceCurrency').value = invoice.currency;
           document.getElementById('invoiceStatus').value = invoice.status;
           document.getElementById('paymentMethod').value = invoice.paymentMethod;
           document.getElementById('invoiceNotes').value = invoice.notes;
           document.getElementById('discountAmount').value = invoice.discount;
           document.getElementById('taxAmount').value = invoice.tax;
           document.getElementById('paidAmount').value = invoice.paidAmount;

           // انتخاب مشتری
           if (invoice.customerId) {
               selectCustomer(invoice.customerId);
           }

           // نمایش آیتم‌های فاکتور
           renderInvoiceItems();
           updateInvoiceCalculations();

           // نمایش دکمه‌های چاپ و اشتراک‌گذاری
           document.getElementById('invoiceShareActions').style.display = 'block';
       }
   } else {
       // حالت افزودن
       modalTitle.textContent = 'فاکتور جدید';
       
       // ایجاد فاکتور جدید
       const invoiceManager = new InvoiceManager();
       currentInvoice = new Invoice();
       currentInvoice.invoiceNumber = invoiceManager.generateInvoiceNumber('فروش');
       currentInvoice.date = new Date().toISOString().split('T')[0];

       // پر کردن فرم با مقادیر پیش‌فرض
       document.getElementById('invoiceNumber').value = currentInvoice.invoiceNumber;
       document.getElementById('invoiceDate').value = currentInvoice.date;
       document.getElementById('invoiceType').value = 'فروش';
       document.getElementById('invoiceCurrency').value = 'AED';
       document.getElementById('invoiceStatus').value = 'در انتظار';
       document.getElementById('paymentMethod').value = 'نقدی';

       // پاک کردن جدول آیتم‌ها
       document.getElementById('invoiceItemsTableBody').innerHTML = '';
       updateInvoiceCalculations();
   }

   // نمایش مودال
   modal.style.display = 'block';
}

// بستن مودال فاکتور
function closeInvoiceModal() {
   const modal = document.getElementById('invoiceModal');
   modal.style.display = 'none';
   currentInvoice = null;
}

// کلاس مدیریت نرخ ارز
class ExchangeRateManager {
   constructor() {
       this.rates = [];
       this.loadRates();
   }

   // بارگذاری نرخ‌ها از localStorage
   loadRates() {
       const ratesData = localStorage.getItem('shafi_exchange_rates');
       if (ratesData) {
           try {
               this.rates = JSON.parse(ratesData);
           } catch (e) {
               console.error('Error loading exchange rates:', e);
               this.rates = [];
           }
       }
   }

   // ذخیره نرخ‌ها در localStorage
   saveRates() {
       localStorage.setItem('shafi_exchange_rates', JSON.stringify(this.rates));
   }

   // افزودن نرخ ارز
   addExchangeRate(fromCurrency, toCurrency, rate) {
       // بررسی وجود نرخ قبلی
       const existingRateIndex = this.rates.findIndex(r => 
           r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
       );

       const rateData = {
           fromCurrency,
           toCurrency,
           rate: Number(rate),
           updatedAt: new Date().toISOString()
       };

       if (existingRateIndex !== -1) {
           this.rates[existingRateIndex] = rateData;
       } else {
           this.rates.push(rateData);
       }

       this.saveRates();
       return rateData;
   }

   // حذف نرخ ارز
   deleteExchangeRate(fromCurrency, toCurrency) {
       const index = this.rates.findIndex(r => 
           r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
       );

       if (index !== -1) {
           this.rates.splice(index, 1);
           this.saveRates();
           return true;
       }
       return false;
   }

   // دریافت نرخ ارز
   getExchangeRate(fromCurrency, toCurrency) {
       if (fromCurrency === toCurrency) {
           return 1;
       }

       const rate = this.rates.find(r => 
           r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
       );

       if (rate) {
           return rate.rate;
       }

       // جستجوی نرخ معکوس
       const reverseRate = this.rates.find(r => 
           r.fromCurrency === toCurrency && r.toCurrency === fromCurrency
       );

       if (reverseRate) {
           return 1 / reverseRate.rate;
       }

       // اگر نرخ پیدا نشد، از نرخ پیش‌فرض استفاده کن
       return this.getDefaultRate(fromCurrency, toCurrency);
   }

   // دریافت نرخ پیش‌فرض
   getDefaultRate(fromCurrency, toCurrency) {
       const defaultRates = {
           'AED_IRR': 12000,
           'USD_IRR': 45000,
           'EUR_IRR': 48000,
           'USD_AED': 3.67,
           'EUR_AED': 4.0,
           'EUR_USD': 1.09
       };

       const key = `${fromCurrency}_${toCurrency}`;
       const reverseKey = `${toCurrency}_${fromCurrency}`;

       if (defaultRates[key]) {
           return defaultRates[key];
       } else if (defaultRates[reverseKey]) {
           return 1 / defaultRates[reverseKey];
       }

       return 1; // نرخ پیش‌فرض
   }

   // تبدیل مبلغ
   convert(amount, fromCurrency, toCurrency) {
       const rate = this.getExchangeRate(fromCurrency, toCurrency);
       return Number(amount) * rate;
   }

   // دریافت تمام نرخ‌ها
   getAllExchangeRates() {
       return [...this.rates];
   }
}

// ذخیره نرخ ارز
function saveExchangeRate() {
   const form = document.getElementById('exchangeRateForm');

   // اعتبارسنجی فرم
   if (!form.checkValidity()) {
       form.reportValidity();
       return;
   }

   const fromCurrency = document.getElementById('fromCurrency').value;
   const toCurrency = document.getElementById('toCurrency').value;
   const rate = Number(document.getElementById('rate').value);

   // بررسی تکراری نبودن ارزها
   if (fromCurrency === toCurrency) {
       showNotification('ارز مبدأ و مقصد نمی‌توانند یکسان باشند', 'error');
       return;
   }

   try {
       const exchangeManager = new ExchangeRateManager();
       exchangeManager.addExchangeRate(fromCurrency, toCurrency, rate);

       showNotification('نرخ ارز با موفقیت ذخیره شد', 'success');
       loadExchangeRatesTable();

       // پاک کردن فرم
       document.getElementById('rate').value = '';

   } catch (error) {
       showNotification(error.message, 'error');
   }
}

// حذف نرخ ارز
function deleteExchangeRate(fromCurrency, toCurrency) {
   if (!confirm('آیا از حذف این نرخ ارز اطمینان دارید؟')) {
       return;
   }

   try {
       const exchangeManager = new ExchangeRateManager();
       exchangeManager.deleteExchangeRate(fromCurrency, toCurrency);

       showNotification('نرخ ارز با موفقیت حذف شد', 'success');
       loadExchangeRatesTable();

   } catch (error) {
       showNotification(error.message, 'error');
   }
}

// بارگذاری جدول نرخ‌های ارز
function loadExchangeRatesTable() {
   const exchangeManager = new ExchangeRateManager();
   const rates = exchangeManager.getAllExchangeRates();

   const tableBody = document.getElementById('exchangeRatesTableBody');
   if (!tableBody) return;

   tableBody.innerHTML = '';

   if (rates.length === 0) {
       const emptyRow = document.createElement('tr');
       emptyRow.innerHTML = `
           <td colspan="4" class="text-center">هیچ نرخ ارزی یافت نشد</td>
       `;
       tableBody.appendChild(emptyRow);
       return;
   }

   rates.forEach(rate => {
       const row = document.createElement('tr');
       row.innerHTML = `
           <td>${getCurrencyName(rate.fromCurrency)} (${rate.fromCurrency})</td>
           <td>${getCurrencyName(rate.toCurrency)} (${rate.toCurrency})</td>
           <td>${rate.rate.toLocaleString()}</td>
           <td>
               <button class="btn btn-sm btn-danger" onclick="deleteExchangeRate('${rate.fromCurrency}', '${rate.toCurrency}')" title="حذف">
                   <i class="fas fa-trash"></i>
               </button>
           </td>
       `;
       tableBody.appendChild(row);
   });
}

// دریافت نام ارز به فارسی
function getCurrencyName(currencyCode) {
   switch (currencyCode) {
       case 'AED': return 'درهم';
       case 'IRR': return 'ریال';
       case 'USD': return 'دلار';
       case 'EUR': return 'یورو';
       default: return currencyCode;
   }
}

// متغیر سراسری برای فاکتور جاری
let currentInvoice = null;

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
   // بارگذاری جدول نرخ‌های ارز
   if (document.getElementById('exchangeRatesTableBody')) {
       loadExchangeRatesTable();
   }
});
// ادامه کد مدیریت فاکتور

// افزودن آیتم جدید به فاکتور
function addInvoiceItem() {
   if (!currentInvoice) {
       showNotification('لطفاً ابتدا فاکتور را ایجاد کنید', 'error');
       return;
   }

   const newItem = {
       productId: null,
       productName: '',
       productCode: '',
       quantity: 1,
       unitPrice: 0,
       currency: document.getElementById('invoiceCurrency').value,
       discount: 0,
       tax: 0,
       total: 0
   };

   currentInvoice.items.push(newItem);
   renderInvoiceItems();
   updateInvoiceCalculations();
}

// حذف آیتم از فاکتور
function removeInvoiceItem(index) {
   if (!currentInvoice || !currentInvoice.items[index]) {
       return;
   }

   currentInvoice.items.splice(index, 1);
   renderInvoiceItems();
   updateInvoiceCalculations();
}

// نمایش آیتم‌های فاکتور
function renderInvoiceItems() {
   const tableBody = document.getElementById('invoiceItemsTableBody');
   if (!tableBody || !currentInvoice) return;

   tableBody.innerHTML = '';

   currentInvoice.items.forEach((item, index) => {
       const row = document.createElement('tr');
       row.innerHTML = `
           <td>
               <select class="form-control product-select" onchange="selectProductForItem(this, ${index})">
                   <option value="">انتخاب کالا</option>
                   ${getProductOptions(item.productId)}
               </select>
           </td>
           <td>
               <input type="text" class="form-control" readonly value="${item.productCode}" id="itemCode_${index}">
           </td>
           <td>
               <input type="number" class="form-control" min="1" value="${item.quantity}" 
                      onchange="updateItemField(${index}, 'quantity', this.value)" id="itemQuantity_${index}">
           </td>
           <td>
               <input type="number" class="form-control" step="0.01" value="${item.unitPrice}" 
                      onchange="updateItemField(${index}, 'unitPrice', this.value)" id="itemPrice_${index}">
           </td>
           <td>
               <select class="form-control" onchange="updateItemCurrency(${index}, this.value)" id="itemCurrency_${index}">
                   <option value="AED" ${item.currency === 'AED' ? 'selected' : ''}>درهم</option>
                   <option value="IRR" ${item.currency === 'IRR' ? 'selected' : ''}>ریال</option>
                   <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>دلار</option>
                   <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>یورو</option>
               </select>
           </td>
           <td>
               <input type="number" class="form-control" step="0.01" value="${item.discount}" 
                      onchange="updateItemField(${index}, 'discount', this.value)" id="itemDiscount_${index}">
           </td>
           <td>
               <input type="number" class="form-control" step="0.01" value="${item.tax}" 
                      onchange="updateItemField(${index}, 'tax', this.value)" id="itemTax_${index}">
           </td>
           <td>
               <input type="text" class="form-control" readonly value="${item.total.toLocaleString()}" id="itemTotal_${index}">
           </td>
           <td>
               <button type="button" class="btn btn-danger btn-sm" onclick="removeInvoiceItem(${index})" title="حذف">
                   <i class="fas fa-trash"></i>
               </button>
           </td>
       `;
       tableBody.appendChild(row);
   });
}

// دریافت گزینه‌های محصولات
function getProductOptions(selectedProductId = null) {
   const productManager = new ProductManager();
   const products = productManager.getAllProducts();
   
   let options = '';
   products.forEach(product => {
       const selected = product.id === selectedProductId ? 'selected' : '';
       options += `<option value="${product.id}" ${selected}>${product.name} - ${product.code}</option>`;
   });
   
   return options;
}

// انتخاب محصول برای آیتم
function selectProductForItem(selectElement, itemIndex) {
   const productId = Number(selectElement.value);
   
   if (!productId || !currentInvoice.items[itemIndex]) {
       return;
   }

   const productManager = new ProductManager();
   const product = productManager.getProductById(productId);
   
   if (product) {
       const item = currentInvoice.items[itemIndex];
       item.productId = product.id;
       item.productName = product.name;
       item.productCode = product.code;
       item.unitPrice = product.price;
       item.currency = product.currency || 'AED';
       
       // بروزرسانی فیلدها
       document.getElementById(`itemCode_${itemIndex}`).value = product.code;
       document.getElementById(`itemPrice_${itemIndex}`).value = product.price;
       document.getElementById(`itemCurrency_${itemIndex}`).value = item.currency;
       
       updateItemField(itemIndex, 'unitPrice', product.price);
   }
}

// بروزرسانی فیلد آیتم
function updateItemField(itemIndex, field, value) {
   if (!currentInvoice || !currentInvoice.items[itemIndex]) {
       return;
   }

   const item = currentInvoice.items[itemIndex];
   item[field] = Number(value);
   
   // محاسبه مجموع آیتم
   calculateItemTotal(itemIndex);
   
   // بروزرسانی مجموع فاکتور
   updateInvoiceCalculations();
}

// تغییر ارز آیتم
function updateItemCurrency(itemIndex, newCurrency) {
   if (!currentInvoice || !currentInvoice.items[itemIndex]) {
       return;
   }

   const item = currentInvoice.items[itemIndex];
   const oldCurrency = item.currency;
   
   if (oldCurrency === newCurrency) {
       return;
   }

   // تبدیل قیمت به ارز جدید
   const exchangeManager = new ExchangeRateManager();
   item.unitPrice = exchangeManager.convert(item.unitPrice, oldCurrency, newCurrency);
   item.currency = newCurrency;
   
   // بروزرسانی فیلد قیمت
   document.getElementById(`itemPrice_${itemIndex}`).value = item.unitPrice.toFixed(2);
   
   // محاسبه مجموع آیتم
   calculateItemTotal(itemIndex);
   
   // بروزرسانی مجموع فاکتور
   updateInvoiceCalculations();
}

// محاسبه مجموع آیتم
function calculateItemTotal(itemIndex) {
   if (!currentInvoice || !currentInvoice.items[itemIndex]) {
       return;
   }

   const item = currentInvoice.items[itemIndex];
   const invoiceCurrency = document.getElementById('invoiceCurrency').value;
   
   // تبدیل قیمت به ارز فاکتور
   const exchangeManager = new ExchangeRateManager();
   const convertedPrice = exchangeManager.convert(item.unitPrice, item.currency, invoiceCurrency);
   
   // محاسبه مجموع
   const lineTotal = item.quantity * convertedPrice;
   item.total = lineTotal - item.discount + item.tax;
   
   // نمایش مجموع
   const totalElement = document.getElementById(`itemTotal_${itemIndex}`);
   if (totalElement) {
       totalElement.value = item.total.toLocaleString();
   }
}

// بروزرسانی محاسبات فاکتور
function updateInvoiceCalculations() {
   if (!currentInvoice) return;

   const invoiceCurrency = document.getElementById('invoiceCurrency').value;
   
   // محاسبه مجموع آیتم‌ها
   let subtotal = 0;
   currentInvoice.items.forEach((item, index) => {
       calculateItemTotal(index);
       subtotal += item.total;
   });

   // دریافت تخفیف و مالیات
   const discountAmount = Number(document.getElementById('discountAmount').value) || 0;
   const taxAmount = Number(document.getElementById('taxAmount').value) || 0;
   const paidAmount = Number(document.getElementById('paidAmount').value) || 0;

   // محاسبه مجموع نهایی
   const total = subtotal - discountAmount + taxAmount;
   const remaining = total - paidAmount;

   // نمایش مقادیر
   document.getElementById('invoiceSubtotal').textContent = `${subtotal.toLocaleString()} ${invoiceCurrency}`;
   document.getElementById('invoiceTotal').textContent = `${total.toLocaleString()} ${invoiceCurrency}`;
   document.getElementById('invoiceRemaining').textContent = `${remaining.toLocaleString()} ${invoiceCurrency}`;

   // بروزرسانی برچسب‌های ارز
   document.getElementById('discountCurrency').textContent = invoiceCurrency;
   document.getElementById('taxCurrency').textContent = invoiceCurrency;
   document.getElementById('paidCurrency').textContent = invoiceCurrency;

   // بروزرسانی داده‌های فاکتور
   if (currentInvoice) {
       currentInvoice.subtotal = subtotal;
       currentInvoice.discount = discountAmount;
       currentInvoice.tax = taxAmount;
       currentInvoice.total = total;
       currentInvoice.paidAmount = paidAmount;
       currentInvoice.remainingAmount = remaining;
       currentInvoice.currency = invoiceCurrency;
   }
}

// تغییر ارز فاکتور
function updateInvoiceCurrency() {
   const newCurrency = document.getElementById('invoiceCurrency').value;
   
   if (currentInvoice) {
       currentInvoice.currency = newCurrency;
   }
   
   // بروزرسانی محاسبات
   updateInvoiceCalculations();
}

// ذخیره فاکتور
function saveInvoice() {
   if (!currentInvoice) {
       showNotification('خطا در ایجاد فاکتور', 'error');
       return;
   }

   const form = document.getElementById('invoiceForm');
   
   // اعتبارسنجی فرم
   if (!form.checkValidity()) {
       form.reportValidity();
       return;
   }

   // بررسی وجود حداقل یک آیتم
   if (currentInvoice.items.length === 0) {
       showNotification('حداقل یک کالا به فاکتور اضافه کنید', 'error');
       return;
   }

   // بررسی انتخاب مشتری
   if (!currentInvoice.customerId) {
       showNotification('لطفاً مشتری را انتخاب کنید', 'error');
       return;
   }

   try {
       const invoiceManager = new InvoiceManager();
       
       // جمع‌آوری داده‌های فرم
       currentInvoice.invoiceNumber = document.getElementById('invoiceNumber').value;
       currentInvoice.date = document.getElementById('invoiceDate').value;
       currentInvoice.invoiceType = document.getElementById('invoiceType').value;
       currentInvoice.status = document.getElementById('invoiceStatus').value;
       currentInvoice.paymentMethod = document.getElementById('paymentMethod').value;
       currentInvoice.notes = document.getElementById('invoiceNotes').value;

       let savedInvoice;
       
       if (currentInvoice.id && invoiceManager.getInvoiceById(currentInvoice.id)) {
           // بروزرسانی فاکتور موجود
           savedInvoice = invoiceManager.updateInvoice(currentInvoice.id, currentInvoice);
           showNotification('فاکتور با موفقیت بروزرسانی شد', 'success');
       } else {
           // افزودن فاکتور جدید
           savedInvoice = invoiceManager.addInvoice(currentInvoice);
           showNotification('فاکتور جدید با موفقیت ایجاد شد', 'success');
       }

       // بروزرسانی currentInvoice با داده‌های ذخیره شده
       currentInvoice = savedInvoice;

       // نمایش دکمه‌های چاپ و اشتراک‌گذاری
       document.getElementById('invoiceShareActions').style.display = 'block';

       // بروزرسانی جدول فاکتورها
       loadInvoicesTable();
       updateInvoiceDashboardStats();

   } catch (error) {
       showNotification(error.message, 'error');
   }
}

// چاپ فاکتور
function printInvoice() {
   if (!currentInvoice) {
       showNotification('فاکتور یافت نشد', 'error');
       return;
   }

   const printContent = generateInvoicePrintContent(currentInvoice);
   
   // ایجاد پنجره جدید برای چاپ
   const printWindow = window.open('', '_blank');
   printWindow.document.write(printContent);
   printWindow.document.close();
   
   // چاپ
   printWindow.print();
   
   // بستن پنجره بعد از چاپ
   printWindow.onafterprint = function() {
       printWindow.close();
   };
}

// تولید محتوای چاپ فاکتور
function generateInvoicePrintContent(invoice) {
   const customerManager = new CustomerManager();
   const customer = customerManager.getCustomerById(invoice.customerId);
   
   return `
       <!DOCTYPE html>
       <html dir="rtl">
       <head>
           <meta charset="UTF-8">
           <title>فاکتور ${invoice.invoiceNumber}</title>
           <style>
               body { font-family: Arial, sans-serif; margin: 20px; }
               .invoice-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
               .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
               .customer-info { background: #f5f5f5; padding: 15px; border-radius: 5px; }
               .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
               .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
               .items-table th { background: #f2f2f2; }
               .totals { text-align: left; margin-top: 20px; }
               .totals table { margin-left: auto; }
               .totals td { padding: 5px 10px; }
               .print-only { display: block; }
               @media print {
                   body { margin: 0; }
                   .no-print { display: none; }
               }
           </style>
       </head>
       <body>
           <div class="invoice-header">
               <h1>فاکتور ${invoice.invoiceType}</h1>
               <h2>شماره: ${invoice.invoiceNumber}</h2>
               <p>تاریخ: ${invoice.date}</p>
           </div>
           
           <div class="invoice-info">
               <div class="customer-info">
                   <h3>مشخصات مشتری</h3>
                   <p><strong>نام:</strong> ${customer ? customer.getFullName() : invoice.customerName}</p>
                   ${customer && customer.company ? `<p><strong>شرکت:</strong> ${customer.company}</p>` : ''}
                   ${customer && customer.phone ? `<p><strong>تلفن:</strong> ${customer.phone}</p>` : ''}
                   ${customer && customer.address ? `<p><strong>آدرس:</strong> ${customer.address}</p>` : ''}
               </div>
               
               <div class="invoice-details">
                   <p><strong>نوع فاکتور:</strong> ${invoice.invoiceType}</p>
                   <p><strong>وضعیت:</strong> ${invoice.status}</p>
                   <p><strong>روش پرداخت:</strong> ${invoice.paymentMethod}</p>
                   <p><strong>ارز:</strong> ${invoice.currency}</p>
               </div>
           </div>
           
           <table class="items-table">
               <thead>
                   <tr>
                       <th>ردیف</th>
                       <th>کالا</th>
                       <th>کد</th>
                       <th>تعداد</th>
                       <th>قیمت واحد</th>
                       <th>تخفیف</th>
                       <th>مالیات</th>
                       <th>مجموع</th>
                   </tr>
               </thead>
               <tbody>
                   ${invoice.items.map((item, index) => `
                       <tr>
                           <td>${index + 1}</td>
                           <td>${item.productName}</td>
                           <td>${item.productCode}</td>
                           <td>${item.quantity}</td>
                           <td>${item.unitPrice.toLocaleString()} ${item.currency}</td>
                           <td>${item.discount.toLocaleString()}</td>
                           <td>${item.tax.toLocaleString()}</td>
                           <td>${item.total.toLocaleString()}</td>
                       </tr>
                   `).join('')}
               </tbody>
           </table>
           
           <div class="totals">
               <table>
                   <tr>
                       <td><strong>جمع کل:</strong></td>
                       <td>${invoice.subtotal.toLocaleString()} ${invoice.currency}</td>
                   </tr>
                   <tr>
                       <td><strong>تخفیف:</strong></td>
                       <td>${invoice.discount.toLocaleString()} ${invoice.currency}</td>
                   </tr>
                   <tr>
                       <td><strong>مالیات:</strong></td>
                       <td>${invoice.tax.toLocaleString()} ${invoice.currency}</td>
                   </tr>
                   <tr>
                       <td><strong>مبلغ نهایی:</strong></td>
                       <td><strong>${invoice.total.toLocaleString()} ${invoice.currency}</strong></td>
                   </tr>
                   <tr>
                       <td><strong>پرداخت شده:</strong></td>
                       <td>${invoice.paidAmount.toLocaleString()} ${invoice.currency}</td>
                   </tr>
                   <tr>
                       <td><strong>مانده:</strong></td>
                       <td>${invoice.remainingAmount.toLocaleString()} ${invoice.currency}</td>
                   </tr>
               </table>
           </div>
           
           ${invoice.notes ? `<div style="margin-top: 20px;"><strong>توضیحات:</strong><br>${invoice.notes}</div>` : ''}
           
           <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
               چاپ شده در: ${new Date().toLocaleString('fa-IR')}
           </div>
       </body>
       </html>
   `;
}

// خروجی اکسل فاکتور
function exportInvoiceToExcel() {
   if (!currentInvoice) {
       showNotification('فاکتور یافت نشد', 'error');
       return;
   }

   const csvContent = generateInvoiceCSV(currentInvoice);
   const filename = `فاکتور-${currentInvoice.invoiceNumber}.csv`;
   
   downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// تولید CSV فاکتور
function generateInvoiceCSV(invoice) {
   const customerManager = new CustomerManager();
   const customer = customerManager.getCustomerById(invoice.customerId);
   
   let csv = '\uFEFF'; // BOM برای UTF-8
   csv += 'اطلاعات فاکتور\n';
   csv += `شماره فاکتور,${invoice.invoiceNumber}\n`;
   csv += `تاریخ,${invoice.date}\n`;
   csv += `نوع فاکتور,${invoice.invoiceType}\n`;
   csv += `مشتری,${customer ? customer.getFullName() : invoice.customerName}\n`;
   csv += `وضعیت,${invoice.status}\n`;
   csv += `روش پرداخت,${invoice.paymentMethod}\n`;
   csv += `ارز,${invoice.currency}\n\n`;
   
   csv += 'آیتم‌های فاکتور\n';
   csv += 'ردیف,نام کالا,کد کالا,تعداد,قیمت واحد,ارز,تخفیف,مالیات,مجموع\n';
   
   invoice.items.forEach((item, index) => {
       csv += `${index + 1},${item.productName},${item.productCode},${item.quantity},${item.unitPrice},${item.currency},${item.discount},${item.tax},${item.total}\n`;
   });
   
   csv += '\nخلاصه مالی\n';
   csv += `جمع کل,${invoice.subtotal}\n`;
   csv += `تخفیف,${invoice.discount}\n`;
   csv += `مالیات,${invoice.tax}\n`;
   csv += `مبلغ نهایی,${invoice.total}\n`;
   csv += `پرداخت شده,${invoice.paidAmount}\n`;
   csv += `مانده,${invoice.remainingAmount}\n`;
   
   if (invoice.notes) {
       csv += `\nتوضیحات,${invoice.notes}\n`;
   }
   
   return csv;
}

// دانلود فایل
function downloadFile(content, filename, mimeType) {
   const blob = new Blob([content], { type: mimeType });
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.href = url;
   link.download = filename;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   URL.revokeObjectURL(url);
}

// اشتراک‌گذاری فاکتور
function shareInvoice(platform) {
   if (!currentInvoice) {
       showNotification('فاکتور یافت نشد', 'error');
       return;
   }

   const shareText = generateInvoiceShareText(currentInvoice);
   
   switch (platform) {
       case 'whatsapp':
           const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
           window.open(whatsappUrl, '_blank');
           break;
           
       case 'telegram':
           const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareText)}`;
           window.open(telegramUrl, '_blank');
           break;
           
       case 'copy':
       default:
           navigator.clipboard.writeText(shareText).then(() => {
               showNotification('متن فاکتور کپی شد', 'success');
           }).catch(() => {
               showNotification('خطا در کپی کردن', 'error');
           });
           break;
   }
}

// تولید متن اشتراک‌گذاری
function generateInvoiceShareText(invoice) {
   const customerManager = new CustomerManager();
   const customer = customerManager.getCustomerById(invoice.customerId);
   
   let text = `📋 فاکتور ${invoice.invoiceType}\n`;
   text += `🔹 شماره: ${invoice.invoiceNumber}\n`;
   text += `🔹 تاریخ: ${invoice.date}\n`;
   text += `🔹 مشتری: ${customer ? customer.getFullName() : invoice.customerName}\n`;
   text += `🔹 وضعیت: ${invoice.status}\n\n`;
   
   text += `💰 خلاصه مالی:\n`;
   text += `• جمع کل: ${invoice.subtotal.toLocaleString()} ${invoice.currency}\n`;
   text += `• تخفیف: ${invoice.discount.toLocaleString()} ${invoice.currency}\n`;
   text += `• مالیات: ${invoice.tax.toLocaleString()} ${invoice.currency}\n`;
   text += `• مبلغ نهایی: ${invoice.total.toLocaleString()} ${invoice.currency}\n`;
   text += `• پرداخت شده: ${invoice.paidAmount.toLocaleString()} ${invoice.currency}\n`;
   text += `• مانده: ${invoice.remainingAmount.toLocaleString()} ${invoice.currency}\n`;
   
   if (invoice.notes) {
       text += `\n📝 توضیحات: ${invoice.notes}`;
   }
   
   return text;
}

// بارگذاری جدول فاکتورها
function loadInvoicesTable() {
   const invoiceManager = new InvoiceManager();
   const invoices = invoiceManager.getAllInvoices();
   
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
           <td>${invoice.date}</td>
           <td>${invoice.customerName}</td>
           <td>${invoice.invoiceType}</td>
           <td><span class="badge ${getStatusBadgeClass(invoice.status)}">${invoice.status}</span></td>
           <td>${invoice.total.toLocaleString()} ${invoice.currency}</td>
           <td>${invoice.remainingAmount.toLocaleString()} ${invoice.currency}</td>
           <td>
               <button class="btn btn-sm btn-primary" onclick="viewInvoice(${invoice.id})" title="مشاهده">
                   <i class="fas fa-eye"></i>
               </button>
               <button class="btn btn-sm btn-warning" onclick="openInvoiceModal(${invoice.id})" title="ویرایش">
                   <i class="fas fa-edit"></i>
               </button>
               <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${invoice.id})" title="حذف">
                   <i class="fas fa-trash"></i>
               </button>
           </td>
       `;
       tableBody.appendChild(row);
   });
}

// دریافت کلاس نشان وضعیت
function getStatusBadgeClass(status) {
   switch (status) {
       case 'پرداخت شده': return 'badge-success';
       case 'پرداخت جزئی': return 'badge-warning';
       case 'لغو شده': return 'badge-danger';
       default: return 'badge-secondary';
   }
}

// مشاهده فاکتور (فقط خواندنی)
function viewInvoice(invoiceId) {
   const invoiceManager = new InvoiceManager();
   const invoice = invoiceManager.getInvoiceById(invoiceId);
   
   if (!invoice) {
       showNotification('فاکتور یافت نشد', 'error');
       return;
   }

   // باز کردن مودال در حالت مشاهده
   openInvoiceModal(invoiceId);
   
   // غیرفعال کردن همه فیلدها
   const form = document.getElementById('invoiceForm');
   const inputs = form.querySelectorAll('input, select, textarea, button');
   inputs.forEach(input => {
       if (!input.classList.contains('no-disable')) {
           input.disabled = true;
       }
   });

   // مخفی کردن دکمه ذخیره
   document.getElementById('saveInvoiceBtn').style.display = 'none';
   
   // تغییر عنوان مودال
   document.getElementById('invoiceModalTitle').textContent = 'مشاهده فاکتور';
}

// حذف فاکتور
function deleteInvoice(invoiceId) {
   if (!confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
       return;
   }

   try {
       const invoiceManager = new InvoiceManager();
       invoiceManager.deleteInvoice(invoiceId);
       
       showNotification('فاکتور با موفقیت حذف شد', 'success');
       loadInvoicesTable();
       updateInvoiceDashboardStats();
       
   } catch (error) {
       showNotification(error.message, 'error');
   }
}

// بروزرسانی آمار داشبورد فاکتورها
function updateInvoiceDashboardStats() {
   const invoiceManager = new InvoiceManager();
   const stats = invoiceManager.getInvoiceStats();
   
   // تعداد کل فاکتورها
   const totalInvoicesElement = document.getElementById('totalInvoices');
   if (totalInvoicesElement) {
       totalInvoicesElement.textContent = stats.total;
   }
   
   // کل مبلغ فاکتورها
   const totalAmountElement = document.getElementById('totalInvoicesAmount');
   if (totalAmountElement) {
       totalAmountElement.textContent = `${stats.totalAmount.toLocaleString()} AED`;
   }
   
   // مبلغ دریافت شده
   const paidAmountElement = document.getElementById('paidAmount');
   if (paidAmountElement) {
       paidAmountElement.textContent = `${stats.paidAmount.toLocaleString()} AED`;
   }
   
   // مبلغ معوق
   const remainingAmountElement = document.getElementById('remainingAmount');
   if (remainingAmountElement) {
       remainingAmountElement.textContent = `${stats.remainingAmount.toLocaleString()} AED`;
   }
}

// افزودن مودال فاکتور به DOM
function addInvoiceModal() {
   const modalHTML = `
       <div class="modal" id="invoiceModal" style="display: none;">
           <div class="modal-dialog modal-xl">
               <div class="modal-content">
                   <div class="modal-header">
                       <h3 id="invoiceModalTitle">فاکتور جدید</h3>
                       <button type="button" class="close" onclick="closeInvoiceModal()">
                           <span>&times;</span>
                       </button>
                   </div>
                   <div class="modal-body">
                       <form id="invoiceForm">
                           <div class="row">
                               <div class="col-md-6">
                                   <div class="form-group">
                                       <label for="invoiceNumber">شماره فاکتور</label>
                                       <input type="text" id="invoiceNumber" class="form-control" required>
                                   </div>
                               </div>
                               <div class="col-md-6">
                                   <div class="form-group">
                                       <label for="invoiceDate">تاریخ</label>
                                       <input type="date" id="invoiceDate" class="form-control" required>
                                   </div>
                               </div>
                           </div>
                           
                           <div class="row">
                               <div class="col-md-3">
                                   <div class="form-group">
                                       <label for="invoiceType">نوع فاکتور</label>
                                       <select id="invoiceType" class="form-control">
                                           <option value="فروش">فروش</option>
                                           <option value="خرید">خرید</option>
                                           <option value="مرجوعی فروش">مرجوعی فروش</option>
                                           <option value="مرجوعی خرید">مرجوعی خرید</option>
                                       </select>
                                   </div>
                               </div>
                               <div class="col-md-3">
                                   <div class="form-group">
                                       <label for="invoiceCurrency">ارز</label>
                                       <select id="invoiceCurrency" class="form-control" onchange="updateInvoiceCurrency()">
                                           <option value="AED">درهم (AED)</option>
                                           <option value="IRR">ریال (IRR)</option>
                                           <option value="USD">دلار (USD)</option>
                                           <option value="EUR">یورو (EUR)</option>
                                       </select>
                                   </div>
                               </div>
                               <div class="col-md-3">
                                   <div class="form-group">
                                       <label for="invoiceStatus">وضعیت</label>
                                       <select id="invoiceStatus" class="form-control">
                                           <option value="در انتظار">در انتظار</option>
                                           <option value="پرداخت شده">پرداخت شده</option>
                                           <option value="پرداخت جزئی">پرداخت جزئی</option>
                                           <option value="لغو شده">لغو شده</option>
                                       </select>
                                   </div>
                               </div>
                               <div class="col-md-3">
                                   <div class="form-group">
                                       <label for="paymentMethod">روش پرداخت</label>
                                       <select id="paymentMethod" class="form-control">
                                           <option value="نقدی">نقدی</option>
                                           <option value="چک">چک</option>
                                           <option value="کارت">کارت</option>
                                           <option value="حواله">حواله</option>
                                       </select>
                                   </div>
                               </div>
                           </div>
                           
                           <!-- انتخاب مشتری -->
                           <div class="form-group">
                               <label>مشتری</label>
                               <div id="customerSelectionPlaceholder" class="customer-selection-placeholder">
                                   <button type="button" class="btn btn-outline-primary" onclick="openCustomerSelectionModal()">
                                       <i class="fas fa-plus"></i> انتخاب مشتری
                                   </button>
                               </div>
                               <div id="selectedCustomerInfo" style="display: none;"></div>
                           </div>
                           
                           <!-- آیتم‌های فاکتور -->
                           <div class="form-group">
                               <div class="d-flex justify-content-between align-items-center mb-3">
                                   <h5>آیتم‌های فاکتور</h5>
                                   <button type="button" class="btn btn-success" onclick="addInvoiceItem()">
                                       <i class="fas fa-plus"></i> افزودن آیتم
                                   </button>
                               </div>
                               
                               <div class="table-responsive">
                                   <table class="table table-bordered">
                                       <thead>
                                           <tr>
                                               <th>کالا</th>
                                               <th>کد</th>
                                               <th>تعداد</th>
                                               <th>قیمت واحد</th>
                                               <th>ارز</th>
                                               <th>تخفیف</th>
                                               <th>مالیات</th>
                                               <th>مجموع</th>
                                               <th>عملیات</th>
                                           </tr>
                                       </thead>
                                       <tbody id="invoiceItemsTableBody">
                                       </tbody>
                                   </table>
                               </div>
                           </div>
                           
                           <!-- مجموع فاکتور -->
                           <div class="row">
                               <div class="col-md-6">
                                   <div class="form-group">
                                       <label for="invoiceNotes">توضیحات</label>
                                       <textarea id="invoiceNotes" class="form-control" rows="4"></textarea>
                                   </div>
                               </div>
                               <div class="col-md-6">
                                   <table class="table table-borderless">
                                       <tr>
                                           <td><strong>جمع کل:</strong></td>
                                           <td><strong id="invoiceSubtotal">0</strong></td>
                                       </tr>
                                       <tr>
                                           <td>تخفیف:</td>
                                           <td>
                                               <div class="input-group">
                                                   <input type="number" id="discountAmount" class="form-control" step="0.01" value="0" onchange="updateInvoiceCalculations()">
                                                   <div class="input-group-append">
                                                       <span class="input-group-text" id="discountCurrency">AED</span>
                                                   </div>
                                               </div>
                                           </td>
                                       </tr>
                                       <tr>
                                           <td>مالیات:</td>
                                           <td>
                                               <div class="input-group">
                                                   <input type="number" id="taxAmount" class="form-control" step="0.01" value="0" onchange="updateInvoiceCalculations()">
                                                   <div class="input-group-append">
                                                       <span class="input-group-text" id="taxCurrency">AED</span>
                                                   </div>
                                               </div>
                                           </td>
                                       </tr>
                                       <tr>
                                           <td><strong>مبلغ نهایی:</strong></td>
                                           <td><strong id="invoiceTotal">0</strong></td>
                                       </tr>
                                       <tr>
                                           <td>پرداخت شده:</td>
                                           <td>
                                               <div class="input-group">
                                                   <input type="number" id="paidAmount" class="form-control" step="0.01" value="0" onchange="updateInvoiceCalculations()">
                                                   <div class="input-group-append">
                                                       <span class="input-group-text" id="paidCurrency">AED</span>
                                                   </div>
                                               </div>
                                           </td>
                                       </tr>
                                       <tr>
                                           <td><strong>مانده:</strong></td>
                                           <td><strong id="invoiceRemaining">0</strong></td>
                                       </tr>
                                   </table>
                               </div>
                           </div>
                       </form>
                   </div>
                   <div class="modal-footer">
                       <button type="button" class="btn btn-secondary" onclick="closeInvoiceModal()">انصراف</button>
                       <button type="button" id="saveInvoiceBtn" class="btn btn-primary no-disable" onclick="saveInvoice()">ذخیره</button>
                       
                       <!-- دکمه‌های چاپ و اشتراک‌گذاری -->
                       <div id="invoiceShareActions" style="display: none;">
                           <button type="button" class="btn btn-info no-disable" onclick="printInvoice()">
                               <i class="fas fa-print"></i> چاپ
                           </button>
                           <button type="button" class="btn btn-success no-disable" onclick="exportInvoiceToExcel()">
                               <i class="fas fa-file-excel"></i> Excel
                           </button>
                           <div class="dropdown d-inline-block">
                               <button class="btn btn-warning dropdown-toggle no-disable" type="button" data-toggle="dropdown">
                                   <i class="fas fa-share-alt"></i> اشتراک‌گذاری
                               </button>
                               <div class="dropdown-menu">
                                   <a class="dropdown-item" href="#" onclick="shareInvoice('whatsapp')">
                                       <i class="fab fa-whatsapp"></i> واتساپ
                                   </a>
                                   <a class="dropdown-item" href="#" onclick="shareInvoice('telegram')">
                                       <i class="fab fa-telegram"></i> تلگرام
                                   </a>
                                   <a class="dropdown-item" href="#" onclick="shareInvoice('copy')">
                                       <i class="fas fa-copy"></i> کپی
                                   </a>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       </div>
   `;

   document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
   // افزودن مودال فاکتور
   if (!document.getElementById('invoiceModal')) {
       addInvoiceModal();
   }
   
   // بارگذاری جدول فاکتورها
   if (document.getElementById('invoicesTableBody')) {
       loadInvoicesTable();
   }
   
   // بروزرسانی آمار داشبورد
   updateInvoiceDashboardStats();
});
