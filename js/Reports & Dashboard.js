// =====================================================
// گزارشات و داشبورد (Reports & Dashboard)
// =====================================================

class ReportsManager {
    constructor() {
        this.productManager = null;
        this.customerManager = null;
        this.invoiceManager = null;
        this.accountingManager = null;
    }

    // تنظیم مدیران
    setManagers(productManager, customerManager, invoiceManager, accountingManager) {
        this.productManager = productManager;
        this.customerManager = customerManager;
        this.invoiceManager = invoiceManager;
        this.accountingManager = accountingManager;
    }

    // گزارش فروش روزانه
    getDailySalesReport(date = null) {
        if (!this.invoiceManager) return null;

        const targetDate = date || new Date().toISOString().split('T')[0];
        const invoices = this.invoiceManager.getAllInvoices();
        
        const dailyInvoices = invoices.filter(inv => 
            inv.date === targetDate && inv.invoiceType === 'فروش'
        );

        return {
            date: targetDate,
            totalInvoices: dailyInvoices.length,
            totalAmount: dailyInvoices.reduce((sum, inv) => sum + inv.total, 0),
            paidAmount: dailyInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
            remainingAmount: dailyInvoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0),
            invoices: dailyInvoices
        };
    }

    // گزارش فروش ماهانه
    getMonthlySalesReport(year, month) {
        if (!this.invoiceManager) return null;

        const invoices = this.invoiceManager.getAllInvoices();
        const monthlyInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate.getFullYear() === year && 
                   invDate.getMonth() === month - 1 && 
                   inv.invoiceType === 'فروش';
        });

        return {
            year,
            month,
            totalInvoices: monthlyInvoices.length,
            totalAmount: monthlyInvoices.reduce((sum, inv) => sum + inv.total, 0),
            paidAmount: monthlyInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
            remainingAmount: monthlyInvoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0)
        };
    }

    // گزارش محصولات پرفروش
    getTopSellingProducts(limit = 10) {
        if (!this.invoiceManager) return [];

        const invoices = this.invoiceManager.getAllInvoices();
        const productSales = {};

        invoices.forEach(invoice => {
            if (invoice.invoiceType === 'فروش') {
                invoice.items.forEach(item => {
                    if (!productSales[item.productId]) {
                        productSales[item.productId] = {
                            productId: item.productId,
                            productName: item.productName,
                            totalQuantity: 0,
                            totalAmount: 0
                        };
                    }
                    productSales[item.productId].totalQuantity += item.quantity;
                    productSales[item.productId].totalAmount += item.total;
                });
            }
        });

        return Object.values(productSales)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, limit);
    }

    // گزارش مشتریان برتر
    getTopCustomers(limit = 10) {
        if (!this.invoiceManager || !this.customerManager) return [];

        const invoices = this.invoiceManager.getAllInvoices();
        const customerSales = {};

        invoices.forEach(invoice => {
            if (invoice.invoiceType === 'فروش' && invoice.customerId) {
                if (!customerSales[invoice.customerId]) {
                    const customer = this.customerManager.getCustomerById(invoice.customerId);
                    customerSales[invoice.customerId] = {
                        customerId: invoice.customerId,
                        customerName: customer ? customer.name : 'نامشخص',
                        totalInvoices: 0,
                        totalAmount: 0
                    };
                }
                customerSales[invoice.customerId].totalInvoices++;
                customerSales[invoice.customerId].totalAmount += invoice.total;
            }
        });

        return Object.values(customerSales)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, limit);
    }

    // گزارش موجودی کم
    getLowStockReport() {
        if (!this.productManager) return [];

        return this.productManager.getAllProducts()
            .filter(product => product.stock <= product.minStock && product.isActive)
            .map(product => ({
                id: product.id,
                sku: product.sku,
                name: product.name,
                currentStock: product.stock,
                minStock: product.minStock,
                shortage: product.minStock - product.stock,
                category: product.category
            }));
    }

    // گزارش مالی کلی
    getFinancialSummary() {
        const summary = {
            totalSales: 0,
            totalPurchases: 0,
            totalExpenses: 0,
            netProfit: 0,
            totalReceivables: 0,
            totalPayables: 0
        };

        // محاسبه فروش و خرید
        if (this.invoiceManager) {
            const invoices = this.invoiceManager.getAllInvoices();
            
            invoices.forEach(invoice => {
                if (invoice.invoiceType === 'فروش') {
                    summary.totalSales += invoice.total;
                } else if (invoice.invoiceType === 'خرید') {
                    summary.totalPurchases += invoice.total;
                }
            });
        }

        // محاسبه طلب و بدهی مشتریان
        if (this.customerManager) {
            const customers = this.customerManager.getAllCustomers();
            
            customers.forEach(customer => {
                if (customer.balance > 0) {
                    summary.totalReceivables += customer.balance;
                } else if (customer.balance < 0) {
                    summary.totalPayables += Math.abs(customer.balance);
                }
            });
        }

        // محاسبه هزینه‌ها
        const expenses = JSON.parse(localStorage.getItem('shafi_expenses') || '[]');
        summary.totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        // محاسبه سود خالص
        summary.netProfit = summary.totalSales - summary.totalPurchases - summary.totalExpenses;

        return summary;
    }
}

// مدیریت فعالیت‌ها
class ActivitiesManager {
    constructor() {
        this.activities = [];
        this.loadActivities();
    }

    // بارگذاری فعالیت‌ها از localStorage
    loadActivities() {
        const activitiesData = localStorage.getItem('shafi_activities');
        if (activitiesData) {
            try {
                this.activities = JSON.parse(activitiesData);
            } catch (e) {
                console.error('Error loading activities:', e);
                this.activities = [];
            }
        }
    }

    // ذخیره فعالیت‌ها در localStorage
    saveActivities() {
        localStorage.setItem('shafi_activities', JSON.stringify(this.activities));
    }

    // افزودن فعالیت جدید
    addActivity(activityData) {
        const activity = {
            id: Date.now(),
            module: activityData.module || 'system',
            description: activityData.description,
            timestamp: activityData.timestamp || new Date().toISOString(),
            user: activityData.user || 'admin'
        };

        this.activities.unshift(activity);
        
        // نگه‌داری حداکثر 1000 فعالیت
        if (this.activities.length > 1000) {
            this.activities = this.activities.slice(0, 1000);
        }

        this.saveActivities();
        return activity;
    }

    // دریافت فعالیت‌ها
    getActivities(limit = 50) {
        return this.activities.slice(0, limit);
    }

    // دریافت فعالیت‌های یک ماژول
    getActivitiesByModule(module, limit = 50) {
        return this.activities
            .filter(activity => activity.module === module)
            .slice(0, limit);
    }

    // پاک کردن فعالیت‌های قدیمی
    clearOldActivities(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        this.activities = this.activities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            return activityDate >= cutoffDate;
        });

        this.saveActivities();
    }
}

// توابع UI برای گزارشات
function updateReportsData() {
    if (!window.productManager || !window.customerManager || !window.invoiceManager) {
        console.log('Managers not ready for reports');
        return;
    }

    const reportsManager = new ReportsManager();
    reportsManager.setManagers(
        window.productManager,
        window.customerManager,
        window.invoiceManager,
        window.accountingManager
    );

    // بروزرسانی گزارش مالی
    updateFinancialSummary(reportsManager);
    
    // بروزرسانی محصولات پرفروش
    updateTopSellingProducts(reportsManager);
    
    // بروزرسانی مشتریان برتر
    updateTopCustomers(reportsManager);
    
    // بروزرسانی گزارش موجودی کم
    updateLowStockReport(reportsManager);
}

function updateFinancialSummary(reportsManager) {
    const summary = reportsManager.getFinancialSummary();
    
    // نمایش در داشبورد
    const totalRevenueElement = document.getElementById('totalRevenue');
    if (totalRevenueElement) {
        totalRevenueElement.textContent = summary.totalSales.toLocaleString();
    }
}

function updateTopSellingProducts(reportsManager) {
    const topProducts = reportsManager.getTopSellingProducts(5);
    
    // نمایش در بخش گزارشات
    console.log('Top Selling Products:', topProducts);
}

function updateTopCustomers(reportsManager) {
    const topCustomers = reportsManager.getTopCustomers(5);
    
    // نمایش در بخش گزارشات
    console.log('Top Customers:', topCustomers);
}

function updateLowStockReport(reportsManager) {
    const lowStockProducts = reportsManager.getLowStockReport();
    
    // نمایش تعداد محصولات با موجودی کم
    const lowStockElement = document.getElementById('lowStockCount');
    if (lowStockElement) {
        lowStockElement.textContent = lowStockProducts.length;
    }
}

// تولید گزارش PDF
function generatePDFReport(reportType) {
    // این تابع نیاز به کتابخانه jsPDF دارد
    console.log(`Generating ${reportType} PDF report`);
    showNotification('قابلیت تولید PDF در نسخه بعدی اضافه خواهد شد', 'info');
}

// صادرات گزارش Excel
function exportToExcel(data, filename) {
    // این تابع نیاز به کتابخانه SheetJS دارد
    console.log(`Exporting ${filename} to Excel`);
    showNotification('قابلیت صادرات Excel در نسخه بعدی اضافه خواهد شد', 'info');
}
