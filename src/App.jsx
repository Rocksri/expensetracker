import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const App = () => {
  // State to manage the list of expenses
  const [expenses, setExpenses] = useState([]);
  // State for the new expense form inputs
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  // State for filtering
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');

  // State for sorting
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'amount-desc', 'amount-asc'

  // State for responsive pie chart size and label font size
  const [pieRadius, setPieRadius] = useState({ outer: 100, inner: 60 });
  const [pieLabelFontSize, setPieLabelFontSize] = useState('14px');

  // Predefined expense categories
  const categories = ['Food', 'Travel', 'Bills', 'Entertainment', 'Shopping', 'Health', 'Education', 'Others'];

  // Colors for the pie chart slices - carefully chosen for visual distinction
  const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#FF4A6D', '#7ED321', '#9013FE', '#FFCD00'];

  // Load expenses from localStorage on initial render
  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem('expenses');
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      }
    } catch (error) {
      console.error("Failed to load expenses from localStorage:", error);
    }
  }, []);

  // Save expenses to localStorage whenever the expenses state changes
  useEffect(() => {
    try {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (error) {
      console.error("Failed to save expenses to localStorage:", error);
    }
  }, [expenses]);

  // Adjust pie chart radius and label font size based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) { // Small screens (e.g., mobile)
        setPieRadius({ outer: 70, inner: 40 });
        setPieLabelFontSize('10px');
      } else if (width < 1024) { // Medium screens (e.g., tablet)
        setPieRadius({ outer: 85, inner: 50 });
        setPieLabelFontSize('12px');
      } else { // Large screens (e.g., desktop)
        setPieRadius({ outer: 100, inner: 60 });
        setPieLabelFontSize('14px');
      }
    };

    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to handle adding a new expense
  const addExpense = useCallback((e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !date) {
      console.error('Please enter a valid amount and date.');
      // For a better user experience, you might display a temporary message to the user here.
      return;
    }

    const newExpense = {
      id: Date.now(), // Unique ID for the expense
      amount: parseFloat(amount),
      category,
      date,
      note,
    };

    setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
    // Reset form fields
    setAmount('');
    setDate('');
    setNote('');
    setCategory('Food'); // Reset to default category
  }, [amount, category, date, note]);

  // Function to handle deleting an expense
  const deleteExpense = useCallback((id) => {
    setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
  }, []);

  // Filter and sort expenses based on current criteria
  const filteredAndSortedExpenses = useMemo(() => {
    let currentExpenses = [...expenses];

    // 1. Filter by Category
    if (filterCategory !== 'All') {
      currentExpenses = currentExpenses.filter((expense) => expense.category === filterCategory);
    }

    // 2. Filter by Date Range
    if (filterStartDate) {
      currentExpenses = currentExpenses.filter((expense) => new Date(expense.date) >= new Date(filterStartDate));
    }
    if (filterEndDate) {
      currentExpenses = currentExpenses.filter((expense) => new Date(expense.date) <= new Date(filterEndDate));
    }

    // 3. Filter by Amount Range
    if (filterMinAmount) {
      currentExpenses = currentExpenses.filter((expense) => expense.amount >= parseFloat(filterMinAmount));
    }
    if (filterMaxAmount) {
      currentExpenses = currentExpenses.filter((expense) => expense.amount <= parseFloat(filterMaxAmount));
    }

    // 4. Sort
    currentExpenses.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'date-asc') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      } else if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return currentExpenses;
  }, [expenses, filterCategory, filterStartDate, filterEndDate, filterMinAmount, filterMaxAmount, sortBy]);

  // Calculate total spending per category for chart and summary
  const categorySpendingData = useMemo(() => {
    const data = categories.map(cat => ({
      name: cat,
      value: 0,
    }));

    expenses.forEach((expense) => {
      const categoryIndex = data.findIndex(item => item.name === expense.category);
      if (categoryIndex !== -1) {
        data[categoryIndex].value += expense.amount;
      }
    });

    // Filter out categories with 0 spending for the chart
    return data.filter(item => item.value > 0);
  }, [expenses, categories]);

  // Calculate total spending
  const totalSpending = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2);
  }, [expenses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-700 font-sans p-6 sm:p-8 lg:p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-8 sm:p-10 flex flex-col lg:flex-row gap-8 lg:gap-12">

        {/* Left Column: Expense Entry & Summary */}
        <div className="lg:w-1/2 flex flex-col gap-8">
          <h1 className="text-5xl font-extrabold text-center text-gray-800 mb-4 tracking-tight">Expense Tracker</h1>

          {/* Add Expense Form */}
          <div className="bg-gray-50 p-7 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-700 mb-5">Add New Expense</h2>
            <form onSubmit={addExpense} className="space-y-5">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 text-lg"
                  placeholder="e.g., 50.75"
                  required
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-white text-lg"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 text-lg"
                  required
                />
              </div>
              <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 text-lg"
                  placeholder="e.g., Dinner with friends"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg text-lg font-semibold"
              >
                Add Expense
              </button>
            </form>
          </div>

          {/* Total Spending Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-7 rounded-2xl shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-3">Total Spending</h2>
            <p className="text-5xl font-extrabold">₹ {totalSpending}</p>
          </div>

          {/* Category-wise Spending Summary */}
          <div className="bg-gray-50 p-7 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-700 mb-5">Spending by Category</h2>
            <ul className="space-y-3">
              {categorySpendingData.length > 0 ? (
                categorySpendingData.map((data, index) => (
                  <li key={data.name} className="flex justify-between items-center text-gray-800 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <span className="font-medium flex items-center text-lg">
                      <span className="inline-block w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      {data.name}
                    </span>
                    <span className="font-bold text-xl">₹ {data.value.toFixed(2)}</span>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 text-lg">No expenses to display category-wise.</p>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Filters, Expenses List & Chart */}
        <div className="lg:w-1/2 flex flex-col gap-8">

          {/* Filters and Sorting */}
          <div className="bg-gray-50 p-7 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-700 mb-5">Filter & Sort Expenses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  id="filterCategory"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 bg-white text-base"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 bg-white text-base"
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="amount-desc">Amount (Highest First)</option>
                  <option value="amount-asc">Amount (Lowest First)</option>
                </select>
              </div>
              <div>
                <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  id="filterStartDate"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 text-base"
                />
              </div>
              <div>
                <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  id="filterEndDate"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 text-base"
                />
              </div>
              <div>
                <label htmlFor="filterMinAmount" className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  id="filterMinAmount"
                  value={filterMinAmount}
                  onChange={(e) => setFilterMinAmount(e.target.value)}
                  step="0.01"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 text-base"
                />
              </div>
              <div>
                <label htmlFor="filterMaxAmount" className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  id="filterMaxAmount"
                  value={filterMaxAmount}
                  onChange={(e) => setFilterMaxAmount(e.target.value)}
                  step="0.01"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 text-base"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setFilterCategory('All');
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterMinAmount('');
                setFilterMaxAmount('');
                setSortBy('date-desc');
              }}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-300 ease-in-out shadow-sm text-lg font-semibold"
            >
              Clear Filters
            </button>
          </div>

          {/* Expenses List */}
          <div className="bg-gray-50 p-7 rounded-2xl shadow-lg border border-gray-100 flex-grow overflow-y-auto max-h-[450px] sm:max-h-[550px] lg:max-h-[680px]">
            <h2 className="text-2xl font-bold text-gray-700 mb-5">Your Expenses</h2>
            {filteredAndSortedExpenses.length === 0 ? (
              <p className="text-gray-500 text-lg">No expenses to display. Try adding some or adjusting your filters.</p>
            ) : (
              <ul className="space-y-4">
                {filteredAndSortedExpenses.map((expense) => (
                  <li key={expense.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-grow">
                      <p className="text-xl font-bold text-gray-800">₹ {expense.amount.toFixed(2)}</p>
                      <p className="text-base text-gray-600 capitalize">{expense.category}</p>
                      <p className="text-sm text-gray-500">{expense.date} {expense.note && `- ${expense.note}`}</p>
                    </div>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="bg-red-500 text-white p-2.5 rounded-md hover:bg-red-600 transition-all duration-200 ease-in-out flex-shrink-0 shadow-sm hover:shadow-md"
                      aria-label={`Delete expense of ₹ ${expense.amount} on ${expense.date}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 3a1 1 0 011-1h4a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Chart Display */}
          <div className="bg-gray-50 pt-10 pb-7 px-7 rounded-2xl shadow-lg border border-gray-100 h-[380px] sm:h-[450px] flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-8">Spending Distribution</h2> {/* Increased mb-5 to mb-8 */}
            {categorySpendingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpendingData}
                    cx="50%"
                    cy="50%"
                    outerRadius={pieRadius.outer} // Dynamic outer radius
                    innerRadius={pieRadius.inner} // Dynamic inner radius
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={
                      categorySpendingData.length > 1 // Only show label if more than one category
                      ? ({ name, percent, x, y }) => ( // Destructure x and y from the Recharts props
                          <text x={x} y={y} fill="#000" textAnchor="middle" dominantBaseline="central" style={{ fontSize: pieLabelFontSize }}>
                            {`${name} (${(percent * 100).toFixed(0)}%)`}
                          </text>
                        )
                      : null // Hide label if only one category (and thus 100%)
                    }
                  >
                    {categorySpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹ ${value.toFixed(2)}`} />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: pieLabelFontSize }} /> {/* Adjust legend font size */}
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-lg">Add expenses to see your spending distribution.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
