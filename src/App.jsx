import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

const App = () => {
    // State to manage the list of all transactions (expenses and incomes)
    const [transactions, setTransactions] = useState([]);

    // State for the new expense form inputs
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseCategory, setExpenseCategory] = useState("Food");
    const [expenseDate, setExpenseDate] = useState("");
    const [expenseNote, setExpenseNote] = useState("");

    // State for the new income form inputs
    const [incomeAmount, setIncomeAmount] = useState("");
    const [incomeCategory, setIncomeCategory] = useState("Salary"); // Default income category
    const [incomeDate, setIncomeDate] = useState("");
    const [incomeNote, setIncomeNote] = useState("");

    // State for filtering
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterType, setFilterType] = useState("All"); // 'All', 'expense', 'income'
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [filterMinAmount, setFilterMinAmount] = useState("");
    const [filterMaxAmount, setFilterMaxAmount] = useState("");

    // State for sorting
    const [sortBy, setSortBy] = useState("date-desc"); // 'date-desc', 'date-asc', 'amount-desc', 'amount-asc'

    // Predefined expense categories
    const expenseCategories = [
        "Food",
        "Travel",
        "Bills",
        "Entertainment",
        "Shopping",
        "Health",
        "Education",
        "Others",
    ];
    // Predefined income categories
    const incomeCategories = [
        "Salary",
        "Freelance",
        "Investments",
        "Gift",
        "Refund",
        "Others",
    ];

    // Colors for the pie chart slices (expenses only, though the pie chart is being removed)
    // These colors can be reused for bar chart if needed, or new ones defined.
    const COLORS = [
        "#0088FE",
        "#00C49F",
        "#FFBB28",
        "#FF8042",
        "#AF19FF",
        "#FF194D",
        "#19FFC3",
        "#9933FF",
    ];

    // Load transactions from localStorage on initial render
    useEffect(() => {
        try {
            const storedTransactions = localStorage.getItem("transactions");
            if (storedTransactions) {
                setTransactions(JSON.parse(storedTransactions));
            }
        } catch (error) {
            console.error(
                "Failed to load transactions from localStorage:",
                error
            );
        }
    }, []);

    // Save transactions to localStorage whenever the transactions state changes
    useEffect(() => {
        try {
            localStorage.setItem("transactions", JSON.stringify(transactions));
        } catch (error) {
            console.error(
                "Failed to save transactions to localStorage:",
                error
            );
        }
    }, [transactions]);

    // Function to handle adding a new transaction (expense or income)
    const addTransaction = useCallback(
        (e, type) => {
            e.preventDefault();
            let amountToAdd, categoryToAdd, dateToAdd, noteToAdd;

            if (type === "expense") {
                amountToAdd = expenseAmount;
                categoryToAdd = expenseCategory;
                dateToAdd = expenseDate;
                noteToAdd = expenseNote;
            } else {
                // type === 'income'
                amountToAdd = incomeAmount;
                categoryToAdd = incomeCategory;
                dateToAdd = incomeDate;
                noteToAdd = incomeNote;
            }

            if (!amountToAdd || parseFloat(amountToAdd) <= 0 || !dateToAdd) {
                // Replaced alert with console.error as per instructions
                console.error("Please enter a valid amount and date.");
                // You might want to implement a custom modal/message box for user feedback
                return;
            }

            const newTransaction = {
                id: Date.now(), // Unique ID for the transaction
                amount: parseFloat(amountToAdd),
                category: categoryToAdd,
                date: dateToAdd,
                note: noteToAdd,
                type: type, // 'expense' or 'income'
            };

            setTransactions((prevTransactions) => [
                ...prevTransactions,
                newTransaction,
            ]);

            // Reset form fields based on type
            if (type === "expense") {
                setExpenseAmount("");
                setExpenseDate("");
                setExpenseNote("");
                setExpenseCategory("Food");
            } else {
                setIncomeAmount("");
                setIncomeDate("");
                setIncomeNote("");
                setIncomeCategory("Salary");
            }
        },
        [
            expenseAmount,
            expenseCategory,
            expenseDate,
            expenseNote,
            incomeAmount,
            incomeCategory,
            incomeDate,
            incomeNote,
        ]
    );

    // Function to handle deleting a transaction
    const deleteTransaction = useCallback((id) => {
        setTransactions((prevTransactions) =>
            prevTransactions.filter((transaction) => transaction.id !== id)
        );
    }, []);

    // Filter and sort transactions based on current criteria
    const filteredAndSortedTransactions = useMemo(() => {
        let currentTransactions = [...transactions];

        // 1. Filter by Transaction Type
        if (filterType !== "All") {
            currentTransactions = currentTransactions.filter(
                (transaction) => transaction.type === filterType
            );
        }

        // 2. Filter by Category (only if type is 'All' or matches current transaction type)
        if (filterCategory !== "All") {
            currentTransactions = currentTransactions.filter(
                (transaction) => transaction.category === filterCategory
            );
        }

        // 3. Filter by Date Range
        if (filterStartDate) {
            currentTransactions = currentTransactions.filter(
                (transaction) =>
                    new Date(transaction.date) >= new Date(filterStartDate)
            );
        }
        if (filterEndDate) {
            currentTransactions = currentTransactions.filter(
                (transaction) =>
                    new Date(transaction.date) <= new Date(filterEndDate)
            );
        }

        // 4. Filter by Amount Range
        if (filterMinAmount) {
            currentTransactions = currentTransactions.filter(
                (transaction) =>
                    transaction.amount >= parseFloat(filterMinAmount)
            );
        }
        if (filterMaxAmount) {
            currentTransactions = currentTransactions.filter(
                (transaction) =>
                    transaction.amount <= parseFloat(filterMaxAmount)
            );
        }

        // 5. Sort
        currentTransactions.sort((a, b) => {
            if (sortBy === "date-desc") {
                return new Date(b.date) - new Date(a.date);
            } else if (sortBy === "date-asc") {
                return new Date(a.date) - new Date(b.date);
            } else if (sortBy === "amount-desc") {
                return b.amount - a.amount;
            } else if (sortBy === "amount-asc") {
                return a.amount - b.amount;
            }
            return 0;
        });

        return currentTransactions;
    }, [
        transactions,
        filterCategory,
        filterType,
        filterStartDate,
        filterEndDate,
        filterMinAmount,
        filterMaxAmount,
        sortBy,
    ]);

    // Calculate total spending per expense category for chart and summary (kept for potential future use or if user changes mind)
    const categoryExpenseData = useMemo(() => {
        const data = expenseCategories.map((cat) => ({
            name: cat,
            value: 0,
        }));

        transactions
            .filter((t) => t.type === "expense")
            .forEach((expense) => {
                const categoryIndex = data.findIndex(
                    (item) => item.name === expense.category
                );
                if (categoryIndex !== -1) {
                    data[categoryIndex].value += expense.amount;
                }
            });

        // Filter out categories with 0 spending for the chart
        return data.filter((item) => item.value > 0);
    }, [transactions, expenseCategories]);

    // Calculate total income, total expenses, and net balance
    const totalIncome = useMemo(() => {
        return transactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    }, [transactions]);

    const totalExpenses = useMemo(() => {
        return transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    }, [transactions]);

    const netBalance = useMemo(() => {
        return (parseFloat(totalIncome) - parseFloat(totalExpenses)).toFixed(2);
    }, [totalIncome, totalExpenses]);

    // Data for the Financial Summary Bar Chart
    const financialSummaryChartData = useMemo(() => {
        return [
            { name: "Total Income", value: parseFloat(totalIncome) },
            { name: "Total Expenses", value: parseFloat(totalExpenses) },
        ];
    }, [totalIncome, totalExpenses]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-inter p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col lg:flex-row gap-8">
                {/* Left Column: Transaction Entry & Summary */}
                <div className="lg:w-1/2 flex flex-col gap-6">
                    <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
                        Finance Tracker
                    </h1>

                    {/* Add Expense Form */}
                    <div className="bg-gray-50 p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            Add New Expense
                        </h2>
                        <form
                            onSubmit={(e) => addTransaction(e, "expense")}
                            className="space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="expenseAmount"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    id="expenseAmount"
                                    value={expenseAmount}
                                    onChange={(e) =>
                                        setExpenseAmount(e.target.value)
                                    }
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                    placeholder="e.g., 50.75"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="expenseCategory"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Category
                                </label>
                                <select
                                    id="expenseCategory"
                                    value={expenseCategory}
                                    onChange={(e) =>
                                        setExpenseCategory(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 bg-white"
                                    required
                                >
                                    {expenseCategories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="expenseDate"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Date
                                </label>
                                <input
                                    type="date"
                                    id="expenseDate"
                                    value={expenseDate}
                                    onChange={(e) =>
                                        setExpenseDate(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="expenseNote"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="expenseNote"
                                    value={expenseNote}
                                    onChange={(e) =>
                                        setExpenseNote(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                    placeholder="e.g., Dinner with friends"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg"
                            >
                                Add Expense
                            </button>
                        </form>
                    </div>

                    {/* Add Income Form */}
                    <div className="bg-gray-50 p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            Add New Income
                        </h2>
                        <form
                            onSubmit={(e) => addTransaction(e, "income")}
                            className="space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="incomeAmount"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    id="incomeAmount"
                                    value={incomeAmount}
                                    onChange={(e) =>
                                        setIncomeAmount(e.target.value)
                                    }
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                    placeholder="e.g., 1000.00"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="incomeCategory"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Category
                                </label>
                                <select
                                    id="incomeCategory"
                                    value={incomeCategory}
                                    onChange={(e) =>
                                        setIncomeCategory(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 bg-white"
                                    required
                                >
                                    {incomeCategories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="incomeDate"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Date
                                </label>
                                <input
                                    type="date"
                                    id="incomeDate"
                                    value={incomeDate}
                                    onChange={(e) =>
                                        setIncomeDate(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="incomeNote"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="incomeNote"
                                    value={incomeNote}
                                    onChange={(e) =>
                                        setIncomeNote(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                    placeholder="e.g., Monthly salary"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg"
                            >
                                Add Income
                            </button>
                        </form>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-xl shadow-md text-center">
                        <h2 className="text-xl font-semibold mb-2">
                            Financial Summary
                        </h2>
                        <p className="text-2xl font-bold mb-1">
                            Total Income: ₹ {totalIncome}
                        </p>
                        <p className="text-2xl font-bold mb-1">
                            Total Expenses: ₹ {totalExpenses}
                        </p>
                        <p className="text-4xl font-bold mt-2">
                            Net Balance: ₹ {netBalance}
                        </p>
                    </div>
                </div>

                {/* Right Column: Filters, Transactions List */}
                <div className="lg:w-1/2 flex flex-col gap-6">
                    {/* Filters and Sorting */}
                    <div className="bg-gray-50 p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            Filter & Sort Transactions
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label
                                    htmlFor="filterType"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Type
                                </label>
                                <select
                                    id="filterType"
                                    value={filterType}
                                    onChange={(e) =>
                                        setFilterType(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white"
                                >
                                    <option value="All">All Types</option>
                                    <option value="expense">Expenses</option>
                                    <option value="income">Incomes</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="filterCategory"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Category
                                </label>
                                <select
                                    id="filterCategory"
                                    value={filterCategory}
                                    onChange={(e) =>
                                        setFilterCategory(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white"
                                >
                                    <option value="All">All Categories</option>
                                    {filterType === "income"
                                        ? incomeCategories.map((cat) => (
                                              <option key={cat} value={cat}>
                                                  {cat}
                                              </option>
                                          ))
                                        : expenseCategories.map((cat) => (
                                              <option key={cat} value={cat}>
                                                  {cat}
                                              </option>
                                          ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="sortBy"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Sort By
                                </label>
                                <select
                                    id="sortBy"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white"
                                >
                                    <option value="date-desc">
                                        Date (Newest First)
                                    </option>
                                    <option value="date-asc">
                                        Date (Oldest First)
                                    </option>
                                    <option value="amount-desc">
                                        Amount (Highest First)
                                    </option>
                                    <option value="amount-asc">
                                        Amount (Lowest First)
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="filterStartDate"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    id="filterStartDate"
                                    value={filterStartDate}
                                    onChange={(e) =>
                                        setFilterStartDate(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="filterEndDate"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    id="filterEndDate"
                                    value={filterEndDate}
                                    onChange={(e) =>
                                        setFilterEndDate(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="filterMinAmount"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Min Amount
                                </label>
                                <input
                                    type="number"
                                    id="filterMinAmount"
                                    value={filterMinAmount}
                                    onChange={(e) =>
                                        setFilterMinAmount(e.target.value)
                                    }
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="filterMaxAmount"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Max Amount
                                </label>
                                <input
                                    type="number"
                                    id="filterMaxAmount"
                                    value={filterMaxAmount}
                                    onChange={(e) =>
                                        setFilterMaxAmount(e.target.value)
                                    }
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setFilterCategory("All");
                                setFilterType("All");
                                setFilterStartDate("");
                                setFilterEndDate("");
                                setFilterMinAmount("");
                                setFilterMaxAmount("");
                                setSortBy("date-desc");
                            }}
                            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 ease-in-out shadow-sm"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Transactions List */}
                    <div className="bg-gray-50 p-6 rounded-xl shadow-md flex-grow overflow-y-auto max-h-[500px] sm:max-h-[600px] lg:max-h-[850px]">
                        {" "}
                        {/* Increased max-height slightly */}
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            Your Transactions
                        </h2>
                        {filteredAndSortedTransactions.length === 0 ? (
                            <p className="text-gray-500">
                                No transactions to display. Try adding some or
                                adjusting your filters.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {filteredAndSortedTransactions.map(
                                    (transaction) => (
                                        <li
                                            key={transaction.id}
                                            className={`bg-white p-4 rounded-lg shadow-sm border ${
                                                transaction.type === "expense"
                                                    ? "border-red-200"
                                                    : "border-green-200"
                                            } flex items-center justify-between flex-wrap gap-2`}
                                        >
                                            <div className="flex-grow">
                                                <p
                                                    className={`text-lg font-bold ${
                                                        transaction.type ===
                                                        "expense"
                                                            ? "text-red-600"
                                                            : "text-green-600"
                                                    }`}
                                                >
                                                    {transaction.type ===
                                                    "expense"
                                                        ? "- ₹"
                                                        : "+ ₹"}{" "}
                                                    {transaction.amount.toFixed(
                                                        2
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-600 capitalize">
                                                    {transaction.category} (
                                                    {transaction.type})
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {transaction.date}{" "}
                                                    {transaction.note &&
                                                        `- ${transaction.note}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    deleteTransaction(
                                                        transaction.id
                                                    )
                                                }
                                                className="bg-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-400 transition-all duration-200 ease-in-out flex-shrink-0"
                                                aria-label={`Delete transaction of ${transaction.amount} on ${transaction.date}`}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 3a1 1 0 011-1h4a1 1 0 110 2H10a1 1 0 01-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </li>
                                    )
                                )}
                            </ul>
                        )}
                    </div>
                    {/* Financial Summary Bar Chart */}
                    <div className="bg-gray-50 p-6 rounded-xl shadow-md h-[350px] sm:h-[400px] flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            Income vs. Expenses
                        </h2>
                        {financialSummaryChartData[0].value > 0 ||
                        financialSummaryChartData[1].value > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={financialSummaryChartData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) =>
                                            `₹ ${value.toFixed(2)}`
                                        }
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="value"
                                        name="Amount"
                                        fill="#8884d8"
                                    >
                                        {financialSummaryChartData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`bar-cell-${index}`}
                                                    fill={
                                                        index === 0
                                                            ? "#4CAF50"
                                                            : "#F44336"
                                                    }
                                                /> // Green for Income, Red for Expense
                                            )
                                        )}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500">
                                Add transactions to see your financial overview.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
