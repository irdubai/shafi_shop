// =====================================================
// ماژول حسابداری پیشرفته (Advanced Accounting Module)
// =====================================================

// مدل حساب
class Account {
    constructor(
        id = null,
        code = '',
        name = '',
        type = 'asset', // asset, liability, equity, revenue, expense
        parentId = null,
        level = 1,
        isActive = true,
        description = ''
    ) {
        this.id = id || Date.now();
        this.code = code;
        this.name = name;
        this.type = type;
        this.parentId = parentId;
        this.level = level;
        this.isActive = isActive;
        this.description = description;
        this.balance = 0;
        this.debitTotal = 0;
        this.creditTotal = 0;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // محاسبه موجودی
    calculateBalance() {
        if (this.type === 'asset' || this.type === 'expense') {
            this.balance = this.debitTotal - this.creditTotal;
        } else {
            this.balance = this.creditTotal - this.debitTotal;
        }
        return this.balance;
    }

    // دریافت نوع حساب به فارسی
    getTypeText() {
        const types = {
            'asset': 'دارایی',
            'liability': 'بدهی',
            'equity': 'حقوق صاحبان سهام',
            'revenue': 'درآمد',
            'expense': 'هزینه'
        };
        return types[this.type] || this.type;
    }
}

// مدل سند حسابداری
class JournalEntry {
    constructor(
        id = null,
        entryNumber = '',
        date = new Date().toISOString().split('T')[0],
        description = '',
        reference = '',
        items = [],
        status = 'draft' // draft, posted, cancelled
    ) {
        this.id = id || Date.now();
        this.entryNumber = entryNumber;
        this.date = date;
        this.description = description;
        this.reference = reference;
        this.items = items || [];
        this.status = status;
        this.totalDebit = 0;
        this.totalCredit = 0;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        this.calculateTotals();
    }

    // محاسبه مجاميع
    calculateTotals() {
        this.totalDebit = this.items.reduce((sum, item) => sum + (item.debit || 0), 0);
        this.totalCredit = this.items.reduce((sum, item) => sum + (item.credit || 0), 0);
    }

    // بررسی تعادل سند
    isBalanced() {
        return Math.abs(this.totalDebit - this.totalCredit) < 0.01;
    }

    // افزودن آیتم به سند
    addItem(accountId, accountName, description, debit = 0, credit = 0) {
        this.items.push({
            accountId,
            accountName,
            description,
            debit: Number(debit),
            credit: Number(credit)
        });
        this.calculateTotals();
        this.updatedAt = new Date().toISOString();
    }

    // حذف آیتم از سند
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            this.calculateTotals();
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // دریافت وضعیت به فارسی
    getStatusText() {
        const statuses = {
            'draft': 'پیش‌نویس',
            'posted': 'ثبت شده',
            'cancelled': 'لغو شده'
        };
        return statuses[this.status] || this.status;
    }
}

// مدیریت حسابداری
class AccountingManager {
    constructor() {
        this.accounts = [];
        this.journalEntries = [];
        this.loadData();
        this.initializeDefaultAccounts();
    }

    // بارگذاری داده‌ها
    loadData() {
        // بارگذاری حساب‌ها
        const accountsData = localStorage.getItem('shafi_accounts');
        if (accountsData) {
            try {
                const parsed = JSON.parse(accountsData);
                this.accounts = parsed.map(a => new Account(
                    a.id, a.code, a.name, a.type, a.parentId, a.level, a.isActive, a.description
                ));
            } catch (e) {
                console.error('Error loading accounts:', e);
                this.accounts = [];
            }
        }

        // بارگذاری اسناد
        const entriesData = localStorage.getItem('shafi_journal_entries');
        if (entriesData) {
            try {
                const parsed = JSON.parse(entriesData);
                this.journalEntries = parsed.map(e => new JournalEntry(
                    e.id, e.entryNumber, e.date, e.description, e.reference, e.items, e.status
                ));
            } catch (e) {
                console.error('Error loading journal entries:', e);
                this.journalEntries = [];
            }
        }
    }

    // ذخیره داده‌ها
    saveData() {
        localStorage.setItem('shafi_accounts', JSON.stringify(this.accounts));
        localStorage.setItem('shafi_journal_entries', JSON.stringify(this.journalEntries));
    }

    // راه‌اندازی حساب‌های پیش‌فرض
    initializeDefaultAccounts() {
        if (this.accounts.length === 0) {
            const defaultAccounts = [
                // دارایی‌ها
                { code: '1000', name: 'دارایی‌های جاری', type: 'asset', level: 1 },
                { code: '1100', name: 'صندوق', type: 'asset', level: 2, parentId: null },
                { code: '1200', name: 'بانک', type: 'asset', level: 2, parentId: null },
                { code: '1300', name: 'حساب‌های دریافتنی', type: 'asset', level: 2, parentId: null },
                { code: '1400', name: 'موجودی کالا', type: 'asset', level: 2, parentId: null },

                // بدهی‌ها
                { code: '2000', name: 'بدهی‌های جاری', type: 'liability', level: 1 },
                { code: '2100', name: 'حساب‌های پرداختنی', type: 'liability', level: 2, parentId: null },
                { code: '2200', name: 'مالیات پرداختنی', type: 'liability', level: 2, parentId: null },

                // حقوق صاحبان سهام
                { code: '3000', name: 'سرمایه', type: 'equity', level: 1 },
                { code: '3100', name: 'سرمایه اولیه', type: 'equity', level: 2, parentId: null },
                { code: '3200', name: 'سود انباشته', type: 'equity', level: 2, parentId: null },

                // درآمدها
                { code: '4000', name: 'درآمد فروش', type: 'revenue', level: 1 },
                { code: '4100', name: 'فروش کالا', type: 'revenue', level: 2, parentId: null },
                { code: '4200', name: 'درآمد خدمات', type: 'revenue', level: 2, parentId: null },

                // هزینه‌ها
                { code: '5000', name: 'هزینه‌های عملیاتی', type: 'expense', level: 1 },
                { code: '5100', name: 'بهای تمام شده کالای فروخته شده', type: 'expense', level: 2, parentId: null },
                { code: '5200', name: 'هزینه‌های اداری', type: 'expense', level: 2, parentId: null },
                { code: '5300', name: 'هزینه‌های فروش', type: 'expense', level: 2, parentId: null }
            ];

            defaultAccounts.forEach(accountData => {
                this.addAccount(accountData);
            });
        }
    }

    // افزودن حساب جدید
    addAccount(accountData) {
        // بررسی تکراری نبودن کد
        if (this.getAccountByCode(accountData.code)) {
            throw new Error('کد حساب تکراری است');
        }

        const account = new Account(
            null,
            accountData.code,
            accountData.name,
            accountData.type,
            accountData.parentId,
            accountData.level,
            accountData.isActive !== false,
            accountData.description || ''
        );

        this.accounts.push(account);
        this.saveData();
        this.addActivity(`حساب جدید «${account.name}» اضافه شد.`);

        return account;
    }

    // بروزرسانی حساب
    updateAccount(id, accountData) {
        const account = this.getAccountById(id);
        if (!account) {
            throw new Error('حساب یافت نشد');
        }

        // بررسی تکراری نبودن کد اگر تغییر کرده باشد
        if (accountData.code !== account.code) {
            const existingAccount = this.getAccountByCode(accountData.code);
            if (existingAccount && existingAccount.id !== id) {
                throw new Error('کد حساب تکراری است');
            }
        }

        account.code = accountData.code || account.code;
        account.name = accountData.name || account.name;
        account.type = accountData.type || account.type;
        account.parentId = accountData.parentId !== undefined ? accountData.parentId : account.parentId;
        account.level = accountData.level || account.level;
        account.isActive = accountData.isActive !== undefined ? accountData.isActive : account.isActive;
        account.description = accountData.description !== undefined ? accountData.description : account.description;
        account.updatedAt = new Date().toISOString();

        this.saveData();
        this.addActivity(`حساب «${account.name}» بروزرسانی شد.`);

        return account;
    }

    // حذف حساب
    deleteAccount(id) {
        const index = this.accounts.findIndex(a => a.id === id);
        if (index === -1) {
            throw new Error('حساب یافت نشد');
        }

        const account = this.accounts[index];

        // بررسی استفاده در اسناد
        const hasEntries = this.journalEntries.some(entry =>
            entry.items.some(item => item.accountId === id)
        );

        if (hasEntries) {
            throw new Error('این حساب در اسناد حسابداری استفاده شده و قابل حذف نیست');
        }

        this.accounts.splice(index, 1);
        this.saveData();
        this.addActivity(`حساب «${account.name}» حذف شد.`);

        return true;
    }

    // دریافت حساب با ID
    getAccountById(id) {
        return this.accounts.find(a => a.id === id);
    }

    // دریافت حساب با کد
    getAccountByCode(code) {
        return this.accounts.find(a => a.code === code);
    }

    // دریافت حساب‌های بر اساس نوع
    getAccountsByType(type) {
        return this.accounts.filter(a => a.type === type && a.isActive);
    }

    // جستجوی حساب‌ها
    searchAccounts(query) {
        const searchTerm = query.toLowerCase();
        return this.accounts.filter(account =>
            account.name.toLowerCase().includes(searchTerm) ||
            account.code.includes(searchTerm) ||
            account.description.toLowerCase().includes(searchTerm)
        );
    }

    // افزودن سند حسابداری جدید
    addJournalEntry(entryData) {
        const entry = new JournalEntry(
            null,
            this.generateEntryNumber(),
            entryData.date,
            entryData.description,
            entryData.reference,
            entryData.items || [],
            'draft'
        );

        // اعتبارسنجی سند
        if (!entry.isBalanced()) {
            throw new Error('سند متعادل نیست - مجموع بدهکار و بستانکار برابر نیست');
        }

        if (entry.items.length < 2) {
            throw new Error('سند باید حداقل دو ردیف داشته باشد');
        }

        this.journalEntries.push(entry);
        this.saveData();
        this.addActivity(`سند حسابداری ${entry.entryNumber} ایجاد شد.`);

        return entry;
    }

    // بروزرسانی سند
    updateJournalEntry(id, entryData) {
        const entry = this.getJournalEntryById(id);
        if (!entry) {
            throw new Error('سند یافت نشد');
        }

        if (entry.status === 'posted') {
            throw new Error('سند ثبت شده قابل ویرایش نیست');
        }

        entry.date = entryData.date || entry.date;
        entry.description = entryData.description || entry.description;
        entry.reference = entryData.reference !== undefined ? entryData.reference : entry.reference;
        entry.items = entryData.items || entry.items;
        entry.calculateTotals();
        entry.updatedAt = new Date().toISOString();

        // اعتبارسنجی سند
        if (!entry.isBalanced()) {
            throw new Error('سند متعادل نیست - مجموع بدهکار و بستانکار برابر نیست');
        }

        this.saveData();
        this.addActivity(`سند حسابداری ${entry.entryNumber} بروزرسانی شد.`);

        return entry;
    }

    // ثبت سند
    postJournalEntry(id) {
        const entry = this.getJournalEntryById(id);
        if (!entry) {
            throw new Error('سند یافت نشد');
        }

        if (entry.status === 'posted') {
            throw new Error('سند قبلاً ثبت شده است');
        }

        if (!entry.isBalanced()) {
            throw new Error('سند متعادل نیست');
        }

        // بروزرسانی موجودی حساب‌ها
        entry.items.forEach(item => {
            const account = this.getAccountById(item.accountId);
            if (account) {
                account.debitTotal += item.debit || 0;
                account.creditTotal += item.credit || 0;
                account.calculateBalance();
            }
        });

        entry.status = 'posted';
        entry.postedAt = new Date().toISOString();
        entry.updatedAt = new Date().toISOString();

        this.saveData();
        this.addActivity(`سند حسابداری ${entry.entryNumber} ثبت شد.`);

        return entry;
    }

    // لغو ثبت سند
    unpostJournalEntry(id) {
        const entry = this.getJournalEntryById(id);
        if (!entry) {
            throw new Error('سند یافت نشد');
        }

        if (entry.status !== 'posted') {
            throw new Error('سند ثبت نشده است');
        }

        // برگرداندن موجودی حساب‌ها
        entry.items.forEach(item => {
            const account = this.getAccountById(item.accountId);
            if (account) {
                account.debitTotal -= item.debit || 0;
                account.creditTotal -= item.credit || 0;
                account.calculateBalance();
            }
        });

        entry.status = 'draft';
        entry.postedAt = null;
        entry.updatedAt = new Date().toISOString();

        this.saveData();
        this.addActivity(`ثبت سند حسابداری ${entry.entryNumber} لغو شد.`);

        return entry;
    }

    // حذف سند
    deleteJournalEntry(id) {
        const index = this.journalEntries.findIndex(e => e.id === id);
        if (index === -1) {
            throw new Error('سند یافت نشد');
        }

        const entry = this.journalEntries[index];

        if (entry.status === 'posted') {
            throw new Error('سند ثبت شده قابل حذف نیست. ابتدا لغو ثبت کنید');
        }

        this.journalEntries.splice(index, 1);
        this.saveData();
        this.addActivity(`سند حسابداری ${entry.entryNumber} حذف شد.`);

        return true;
    }

    // دریافت سند با ID
    getJournalEntryById(id) {
        return this.journalEntries.find(e => e.id === id);
    }

    // تولید شماره سند جدید
    generateEntryNumber() {
        const year = new Date().getFullYear();
        const existingEntries = this.journalEntries.filter(e =>
            e.entryNumber.startsWith(`${year}`)
        );
        const nextNumber = existingEntries.length + 1;
        return `${year}${nextNumber.toString().padStart(4, '0')}`;
    }

    // ایجاد سند خودکار برای فروش
    createSalesEntry(invoiceData) {
        const items = [];

        // بدهکار: حساب‌های دریافتنی یا صندوق
        const receivableAccount = this.getAccountByCode('1300');
        const cashAccount = this.getAccountByCode('1100');
        const accountToDebit = invoiceData.paymentMethod === 'نقدی' ? cashAccount : receivableAccount;

        if (accountToDebit) {
            items.push({
                accountId: accountToDebit.id,
                accountName: accountToDebit.name,
                description: `فروش به ${invoiceData.customerName}`,
                debit: invoiceData.total,
                credit: 0
            });
        }

        // بستانکار: درآمد فروش
        const salesAccount = this.getAccountByCode('4100');
        if (salesAccount) {
            items.push({
                accountId: salesAccount.id,
                accountName: salesAccount.name,
                description: 'درآمد فروش کالا',
                debit: 0,
                credit: invoiceData.subtotal
            });
        }

        // مالیات (در صورت وجود)
        if (invoiceData.tax > 0) {
            const taxAccount = this.getAccountByCode('2200');
            if (taxAccount) {
                items.push({
                    accountId: taxAccount.id,
                    accountName: taxAccount.name,
                    description: 'مالیات فروش',
                    debit: 0,
                    credit: invoiceData.tax
                });
            }
        }

        // بهای تمام شده کالا
        let totalCost = 0;
        if (invoiceData.items && invoiceData.items.length > 0) {
            invoiceData.items.forEach(item => {
                if (window.productManager) {
                    const product = window.productManager.getProductById(item.productId);
                    if (product) {
                        totalCost += item.quantity * product.purchasePrice;
                    }
                }
            });

            if (totalCost > 0) {
                const cogsAccount = this.getAccountByCode('5100');
                const inventoryAccount = this.getAccountByCode('1400');

                if (cogsAccount) {
                    items.push({
                        accountId: cogsAccount.id,
                        accountName: cogsAccount.name,
                        description: 'بهای تمام شده کالای فروخته شده',
                        debit: totalCost,
                        credit: 0
                    });
                }

                if (inventoryAccount) {
                    items.push({
                        accountId: inventoryAccount.id,
                        accountName: inventoryAccount.name,
                        description: 'کاهش موجودی کالا',
                        debit: 0,
                        credit: totalCost
                    });
                }
            }
        }

        return this.addJournalEntry({
            date: invoiceData.date,
            description: `فروش فاکتور ${invoiceData.invoiceNumber}`,
            reference: invoiceData.invoiceNumber,
            items: items
        });
    }

    // ایجاد سند خودکار برای خرید
    createPurchaseEntry(invoiceData) {
        const items = [];

        // بدهکار: موجودی کالا
        const inventoryAccount = this.getAccountByCode('1400');
        if (inventoryAccount) {
            items.push({
                accountId: inventoryAccount.id,
                accountName: inventoryAccount.name,
                description: 'خرید کالا',
                debit: invoiceData.subtotal,
                credit: 0
            });
        }

        // مالیات خرید
        if (invoiceData.tax > 0) {
            const taxAccount = this.getAccountByCode('2200');
            if (taxAccount) {
                items.push({
                    accountId: taxAccount.id,
                    accountName: taxAccount.name,
                    description: 'مالیات خرید',
                    debit: invoiceData.tax,
                    credit: 0
                });
            }
        }

        // بستانکار: حساب‌های پرداختنی یا صندوق
        const payableAccount = this.getAccountByCode('2100');
        const cashAccount = this.getAccountByCode('1100');
        const accountToCredit = invoiceData.paymentMethod === 'نقدی' ? cashAccount : payableAccount;

        if (accountToCredit) {
            items.push({
                accountId: accountToCredit.id,
                accountName: accountToCredit.name,
                description: `خرید از ${invoiceData.supplierName || 'تامین‌کننده'}`,
                debit: 0,
                credit: invoiceData.total
            });
        }

        return this.addJournalEntry({
            date: invoiceData.date,
            description: `خرید فاکتور ${invoiceData.invoiceNumber}`,
            reference: invoiceData.invoiceNumber,
            items: items
        });
    }

    // تولید میزان‌نامه
    generateTrialBalance(date = null) {
        const targetDate = date ? new Date(date) : new Date();
        const accounts = this.accounts.filter(a => a.isActive);

        let totalDebits = 0;
        let totalCredits = 0;

        const trialBalance = accounts.map(account => {
            const balance = account.balance;
            let debitBalance = 0;
            let creditBalance = 0;

            if (account.type === 'asset' || account.type === 'expense') {
                if (balance >= 0) {
                    debitBalance = balance;
                } else {
                    creditBalance = Math.abs(balance);
                }
            } else {
                if (balance >= 0) {
                    creditBalance = balance;
                } else {
                    debitBalance = Math.abs(balance);
                }
            }

            totalDebits += debitBalance;
            totalCredits += creditBalance;

            return {
                accountCode: account.code,
                accountName: account.name,
                accountType: account.getTypeText(),
                debitBalance: debitBalance,
                creditBalance: creditBalance
            };
        }).filter(account => account.debitBalance !== 0 || account.creditBalance !== 0);

        return {
            date: targetDate.toISOString().split('T')[0],
            accounts: trialBalance,
            totalDebits: totalDebits,
            totalCredits: totalCredits,
            isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
        };
    }

    // تولید ترازنامه
    generateBalanceSheet(date = null) {
        const targetDate = date ? new Date(date) : new Date();

        // دارایی‌ها
        const assets = this.getAccountsByType('asset');
        const totalAssets = assets.reduce((sum, account) => sum + Math.abs(account.balance), 0);

        // بدهی‌ها
        const liabilities = this.getAccountsByType('liability');
        const totalLiabilities = liabilities.reduce((sum, account) => sum + Math.abs(account.balance), 0);

        // حقوق صاحبان سهام
        const equity = this.getAccountsByType('equity');
        const totalEquity = equity.reduce((sum, account) => sum + Math.abs(account.balance), 0);

        return {
            date: targetDate.toISOString().split('T')[0],
            assets: {
                accounts: assets,
                total: totalAssets
            },
            liabilities: {
                accounts: liabilities,
                total: totalLiabilities
            },
            equity: {
                accounts: equity,
                total: totalEquity
            },
            totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
        };
    }

    // تولید صورت سود و زیان
    generateIncomeStatement(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // درآمدها
        const revenueAccounts = this.getAccountsByType('revenue');
        const totalRevenue = revenueAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0);

        // هزینه‌ها
        const expenseAccounts = this.getAccountsByType('expense');
        const totalExpenses = expenseAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0);

        // سود خالص
        const netIncome = totalRevenue - totalExpenses;

        return {
            period: {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            },
            revenue: {
                accounts: revenueAccounts,
                total: totalRevenue
            },
            expenses: {
                accounts: expenseAccounts,
                total: totalExpenses
            },
            netIncome: netIncome,
            netProfitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
        };
    }

    // دریافت گردش حساب
    getAccountLedger(accountId, startDate = null, endDate = null) {
        const account = this.getAccountById(accountId);
        if (!account) {
            throw new Error('حساب یافت نشد');
        }

        let entries = this.journalEntries.filter(entry => 
            entry.status === 'posted' && 
            entry.items.some(item => item.accountId === accountId)
        );

        // فیلتر بر اساس تاریخ
        if (startDate) {
            entries = entries.filter(entry => entry.date >= startDate);
        }
        if (endDate) {
            entries = entries.filter(entry => entry.date <= endDate);
        }

        // مرتب‌سازی بر اساس تاریخ
        entries.sort((a, b) => new Date(a.date) - new Date(b.date));

        let runningBalance = 0;
        const ledgerEntries = [];

        entries.forEach(entry => {
            const accountItem = entry.items.find(item => item.accountId === accountId);
            if (accountItem) {
                const debit = accountItem.debit || 0;
                const credit = accountItem.credit || 0;

                if (account.type === 'asset' || account.type === 'expense') {
                    runningBalance += debit - credit;
                } else {
                    runningBalance += credit - debit;
                }

                ledgerEntries.push({
                    date: entry.date,
                    entryNumber: entry.entryNumber,
                    description: accountItem.description,
                    reference: entry.reference,
                    debit: debit,
                    credit: credit,
                    balance: runningBalance
                });
            }
        });

        return {
            account: account,
            entries: ledgerEntries,
            finalBalance: runningBalance
        };
    }

    // ثبت فعالیت
    addActivity(description) {
        if (window.activitiesManager) {
            window.activitiesManager.addActivity({
                module: 'accounting',
                description,
                timestamp: new Date().toISOString()
            });
        }
    }

    // دریافت آمار حسابداری
    getAccountingStats() {
        const totalAccounts = this.accounts.length;
        const activeAccounts = this.accounts.filter(a => a.isActive).length;
        const totalEntries = this.journalEntries.length;
        const postedEntries = this.journalEntries.filter(e => e.status === 'posted').length;
        const draftEntries = this.journalEntries.filter(e => e.status === 'draft').length;

        // محاسبه مجاميع
        const totalDebits = this.journalEntries
            .filter(e => e.status === 'posted')
            .reduce((sum, entry) => sum + entry.totalDebit, 0);

        const totalCredits = this.journalEntries
            .filter(e => e.status === 'posted')
            .reduce((sum, entry) => sum + entry.totalCredit, 0);

        return {
            accounts: {
                total: totalAccounts,
                active: activeAccounts,
                inactive: totalAccounts - activeAccounts
            },
            entries: {
                total: totalEntries,
                posted: postedEntries,
                draft: draftEntries
            },
            totals: {
                debits: totalDebits,
                credits: totalCredits,
                isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
            }
        };
    }

    // خروجی گرفتن از حساب‌ها
    exportAccounts() {
        const exportData = this.accounts.map(a => ({
            کد: a.code,
            نام: a.name,
            نوع: a.getTypeText(),
            سطح: a.level,
            موجودی: a.balance,
            وضعیت: a.isActive ? 'فعال' : 'غیرفعال',
            توضیحات: a.description
        }));

        return JSON.stringify(exportData, null, 2);
    }

    // خروجی گرفتن از اسناد
    exportJournalEntries() {
        const exportData = this.journalEntries.map(e => ({
            'شماره سند': e.entryNumber,
            تاریخ: e.date,
            شرح: e.description,
            مرجع: e.reference,
            'مجموع بدهکار': e.totalDebit,
            'مجموع بستانکار': e.totalCredit,
            وضعیت: e.getStatusText(),
            'تاریخ ایجاد': e.createdAt
        }));

        return JSON.stringify(exportData, null, 2);
    }
}

// فعالیت‌های سیستم
class ActivitiesManager {
    constructor() {
        this.activities = [];
        this.loadActivities();
    }

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

    saveActivities() {
        localStorage.setItem('shafi_activities', JSON.stringify(this.activities));
    }

    addActivity(activity) {
        const newActivity = {
            id: Date.now(),
            module: activity.module,
            description: activity.description,
            timestamp: activity.timestamp || new Date().toISOString()
        };

        this.activities.unshift(newActivity);

        // محدود کردن تعداد فعالیت‌ها به 100 مورد
        if (this.activities.length > 100) {
            this.activities = this.activities.slice(0, 100);
        }

        this.saveActivities();
        return newActivity;
    }

    getActivities(limit = 10) {
        return this.activities.slice(0, limit);
    }

    getActivitiesByModule(module, limit = 10) {
        return this.activities
            .filter(a => a.module === module)
            .slice(0, limit);
    }
}

// کدهای مدیریت UI حسابداری

// باز کردن مودال حساب
function openAccountModal(accountId = null) {
    const modal = document.getElementById('accountModal');
    const modalTitle = document.getElementById('accountModalTitle');
    const form = document.getElementById('accountForm');

    // پاک کردن فرم
    form.reset();

    if (accountId) {
        // حالت ویرایش
        const accountingManager = new AccountingManager();
        const account = accountingManager.getAccountById(accountId);

        if (account) {
            modalTitle.textContent = 'ویرایش حساب';

            // پر کردن فرم با داده‌های حساب
            form.elements.accountId.value = account.id;
            form.elements.code.value = account.code;
            form.elements.name.value = account.name;
            form.elements.type.value = account.type;
            form.elements.level.value = account.level;
            form.elements.description.value = account.description;
            form.elements.isActive.checked = account.isActive;
        }
    } else {
        // حالت افزودن
        modalTitle.textContent = 'حساب جدید';
        form.elements.level.value = '2';
        form.elements.isActive.checked = true;
    }

    // نمایش مودال
    modal.style.display = 'block';
}

// بستن مودال حساب
function closeAccountModal() {
    const modal = document.getElementById('accountModal');
    modal.style.display = 'none';
}

// ذخیره حساب
function saveAccount() {
    const form = document.getElementById('accountForm');

    // اعتبارسنجی فرم
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        const accountingManager = new AccountingManager();

        const accountData = {
            code: form.elements.code.value.trim(),
            name: form.elements.name.value.trim(),
            type: form.elements.type.value,
            level: Number(form.elements.level.value),
            description: form.elements.description.value.trim(),
            isActive: form.elements.isActive.checked
        };

        const accountId = form.elements.accountId.value;

        if (accountId) {
            // بروزرسانی حساب موجود
            accountingManager.updateAccount(Number(accountId), accountData);
            showToast('حساب با موفقیت بروزرسانی شد', 'success');
        } else {
            // افزودن حساب جدید
            accountingManager.addAccount(accountData);
            showToast('حساب جدید با موفقیت اضافه شد', 'success');
        }

        // بستن مودال و بروزرسانی جدول
        closeAccountModal();
        loadChartOfAccounts();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// باز کردن مودال سند
function openJournalEntryModal(entryId = null) {
    const modal = document.getElementById('journalEntryModal');
    const modalTitle = document.getElementById('journalEntryModalTitle');
    const form = document.getElementById('journalEntryForm');

    // پاک کردن فرم
    form.reset();
    clearJournalEntryItems();

    if (entryId) {
        // حالت ویرایش
        const accountingManager = new AccountingManager();
        const entry = accountingManager.getJournalEntryById(entryId);

        if (entry) {
            modalTitle.textContent = 'ویرایش سند حسابداری';

            // پر کردن فرم با داده‌های سند
            form.elements.entryId.value = entry.id;
            form.elements.date.value = entry.date;
            form.elements.description.value = entry.description;
            form.elements.reference.value = entry.reference;

            // بارگذاری آیتم‌های سند
            entry.items.forEach(item => {
                addJournalEntryItemRow(item);
            });

            calculateJournalEntryTotals();
        }
    } else {
        // حالت افزودن
        modalTitle.textContent = 'سند حسابداری جدید';
        form.elements.date.value = new Date().toISOString().split('T')[0];

        // افزودن دو ردیف پیش‌فرض
        addJournalEntryItemRow();
        addJournalEntryItemRow();
    }

    // نمایش مودال
    modal.style.display = 'block';
}

// بستن مودال سند
function closeJournalEntryModal() {
    const modal = document.getElementById('journalEntryModal');
    modal.style.display = 'none';
}

// اضافه کردن ردیف آیتم سند
function addJournalEntryItemRow(item = null) {
    const itemsContainer = document.getElementById('journalEntryItems');
    const row = document.createElement('div');
    row.className = 'journal-entry-item';

    const accountingManager = new AccountingManager();
    const accounts = accountingManager.accounts.filter(a => a.isActive);

    row.innerHTML = `
        <div class="form-row">
            <div class="form-group" style="flex: 2;">
                <select class="form-control account-select" required>
                    <option value="">انتخاب حساب</option>
                    ${accounts.map(account => 
                        `<option value="${account.id}" ${item && item.accountId === account.id ? 'selected' : ''}>
                            ${account.code} - ${account.name}
                        </option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group" style="flex: 2;">
                <input type="text" class="form-control item-description" placeholder="شرح" 
                       value="${item ? item.description : ''}" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-control debit-amount" placeholder="بدهکار" 
                       min="0" step="0.01" value="${item ? item.debit : ''}" 
                       onchange="calculateJournalEntryTotals()">
            </div>
            <div class="form-group">
                <input type="number" class="form-control credit-amount" placeholder="بستانکار" 
                       min="0" step="0.01" value="${item ? item.credit : ''}" 
                       onchange="calculateJournalEntryTotals()">
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-sm btn-danger" onclick="removeJournalEntryItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    itemsContainer.appendChild(row);
}

// حذف ردیف آیتم سند
function removeJournalEntryItem(button) {
    const row = button.closest('.journal-entry-item');
    row.remove();
    calculateJournalEntryTotals();
}

// پاک کردن آیتم‌های سند
function clearJournalEntryItems() {
    const itemsContainer = document.getElementById('journalEntryItems');
    itemsContainer.innerHTML = '';
}

// محاسبه مجاميع سند
function calculateJournalEntryTotals() {
    const debitInputs = document.querySelectorAll('.debit-amount');
    const creditInputs = document.querySelectorAll('.credit-amount');

    let totalDebit = 0;
    let totalCredit = 0;

    debitInputs.forEach(input => {
        totalDebit += Number(input.value) || 0;
    });

    creditInputs.forEach(input => {
        totalCredit += Number(input.value) || 0;
    });

    document.getElementById('totalDebit').textContent = totalDebit.toLocaleString();
    document.getElementById('totalCredit').textContent = totalCredit.toLocaleString();

    const difference = Math.abs(totalDebit - totalCredit);
    const differenceElement = document.getElementById('difference');
    differenceElement.textContent = difference.toLocaleString();

    // تغییر رنگ بر اساس تعادل
    if (difference < 0.01) {
        differenceElement.className = 'text-success';
    } else {
        differenceElement.className = 'text-danger';
    }
}

// ذخیره سند حسابداری
function saveJournalEntry() {
    const form = document.getElementById('journalEntryForm');

    // اعتبارسنجی فرم
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        const accountingManager = new AccountingManager();

        // جمع‌آوری آیتم‌های سند
        const items = [];
        const itemRows = document.querySelectorAll('.journal-entry-item');

        itemRows.forEach(row => {
            const accountSelect = row.querySelector('.account-select');
            const descriptionInput = row.querySelector('.item-description');
            const debitInput = row.querySelector('.debit-amount');
            const creditInput = row.querySelector('.credit-amount');

            const accountId = Number(accountSelect.value);
            const account = accountingManager.getAccountById(accountId);

            if (accountId && account) {
                items.push({
                    accountId: accountId,
                    accountName: account.name,
                    description: descriptionInput.value.trim(),
                    debit: Number(debitInput.value) || 0,
                    credit: Number(creditInput.value) || 0
                });
            }
        });

        const entryData = {
            date: form.elements.date.value,
            description: form.elements.description.value.trim(),
            reference: form.elements.reference.value.trim(),
            items: items
        };

        const entryId = form.elements.entryId.value;

        if (entryId) {
            // بروزرسانی سند موجود
            accountingManager.updateJournalEntry(Number(entryId), entryData);
            showToast('سند حسابداری با موفقیت بروزرسانی شد', 'success');
        } else {
            // افزودن سند جدید
            accountingManager.addJournalEntry(entryData);
            showToast('سند حسابداری جدید با موفقیت اضافه شد', 'success');
        }

        // بستن مودال و بروزرسانی جدول
        closeJournalEntryModal();
        loadJournalEntries();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ثبت سند
function postJournalEntry(entryId) {
    if (!confirm('آیا از ثبت این سند اطمینان دارید؟')) {
        return;
    }

    try {
        const accountingManager = new AccountingManager();
        accountingManager.postJournalEntry(Number(entryId));

        showToast('سند با موفقیت ثبت شد', 'success');
        loadJournalEntries();
        loadChartOfAccounts();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// لغو ثبت سند
function unpostJournalEntry(entryId) {
    if (!confirm('آیا از لغو ثبت این سند اطمینان دارید؟')) {
        return;
    }

    try {
        const accountingManager = new AccountingManager();
        accountingManager.unpostJournalEntry(Number(entryId));

        showToast('ثبت سند با موفقیت لغو شد', 'success');
        loadJournalEntries();
        loadChartOfAccounts();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// حذف سند
function deleteJournalEntry(entryId) {
    if (!confirm('آیا از حذف این سند اطمینان دارید؟')) {
        return;
    }

    try {
        const accountingManager = new AccountingManager();
        accountingManager.deleteJournalEntry(Number(entryId));

        showToast('سند با موفقیت حذف شد', 'success');
        loadJournalEntries();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// بارگذاری دفتر حساب‌ها
function loadChartOfAccounts() {
    const accountingManager = new AccountingManager();
    const accounts = accountingManager.accounts;

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
            <td>${account.getTypeText()}</td>
            <td>${account.balance.toLocaleString()} درهم</td>
            <td>
                <span class="status-badge ${account.isActive ? 'status-active' : 'status-inactive'}">
                    ${account.isActive ? 'فعال' : 'غیرفعال'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openAccountModal(${account.id})" title="ویرایش">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="showAccountLedger(${account.id})" title="گردش حساب">
                    <i class="fas fa-list"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// بارگذاری اسناد حسابداری
function loadJournalEntries() {
    const accountingManager = new AccountingManager();
    const entries = accountingManager.journalEntries;

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

// نمایش گردش حساب
function showAccountLedger(accountId) {
    const accountingManager = new AccountingManager();
    const ledger = accountingManager.getAccountLedger(accountId);

    // این تابع می‌تواند یک مودال جدید باز کند یا به صفحه جدیدی هدایت کند
    console.log('Account Ledger:', ledger);
    // پیاده‌سازی نمایش گردش حساب در مودال یا صفحه جدید
}

// بروزرسانی آمار حسابداری در داشبورد
function updateAccountingDashboardStats() {
    const accountingManager = new AccountingManager();
    const stats = accountingManager.getAccountingStats();

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

// اضافه کردن event listener برای بارگذاری داده‌ها
document.addEventListener('DOMContentLoaded', function() {
    // بارگذاری داده‌های حسابداری اگر در صفحه حسابداری هستیم
    if (document.getElementById('accountsTableBody')) {
        loadChartOfAccounts();
    }

    if (document.getElementById('journalEntriesTableBody')) {
        loadJournalEntries();
    }

    // بروزرسانی آمار حسابداری در داشبورد
    updateAccountingDashboardStats();

    // اضافه کردن event listener برای دکمه افزودن آیتم سند
    const addItemBtn = document.getElementById('addJournalEntryItem');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => addJournalEntryItemRow());
    }
});
