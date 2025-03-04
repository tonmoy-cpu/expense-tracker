"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2, Edit } from 'lucide-react';
import CategorySelector from '@/components/CategorySelector';
import PieChart from '@/components/PieChart';
import SummaryCard from '@/components/SummaryCard';

interface Transaction {
  _id: string;
  date: string;
  amount: number;
  description: string;
  category: string; // Added category field
}

interface Budget {
  category: string;
  amount: number;
}

const FinanceTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    description: '',
    category: '' // Added category to form data
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<Record<string, number>>({}); // For pie chart data
  const [budgets, setBudgets] = useState<Budget[]>([]); // For category budgets
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Fetch transactions from the server
  useEffect(() => {
    let isMounted = true; // track whether the component is mounted

    const fetchTransactions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/transactions');
        if (isMounted) {
          setTransactions(response.data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();

    return () => {
      isMounted = false; // cleanup function to set isMounted to false
    };
  }, []);

  // Calculate monthly chart data and category data
  useEffect(() => {
    const monthlyData: Record<string, any> = {};
    const categoryBreakdown: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", transaction.date);
        return; // Skip this transaction if the date is invalid
      }

      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { 
          month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          expenses: 0,
          income: 0
        };
      }
      
      if (transaction.amount < 0) {
        monthlyData[monthYear].expenses += Math.abs(transaction.amount);
      } else {
        monthlyData[monthYear].income += transaction.amount;
      }

      // Update category breakdown
      const category = transaction.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + transaction.amount;
    });
    
    const sortedData = Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.month + " 1"); // Append "1" to make it a valid date
      const dateB = new Date(b.month + " 1"); // Append "1" to make it a valid date
      return dateA.getTime() - dateB.getTime(); // Compare the timestamps
    });
    
    setChartData(sortedData);
    setCategoryData(categoryBreakdown); // Set category data for pie chart
  }, [transactions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user fixes the field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Amount must be a number';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const newTransaction = {
      date: formData.date,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category // Include category in the transaction
    };
    
    try {
      if (editingId) {
        // Update existing transaction
        await axios.put(`http://localhost:5000/api/transactions/${editingId}`, newTransaction);
        setEditingId(null);
      } else {
        // Add new transaction
        await axios.post('http://localhost:5000/api/transactions', newTransaction);
      }
      
      // Reset form
      setFormData({
        date: '',
        amount: '',
        description: '',
        category: '' // Reset category
      });

      // Re-fetch transactions
      const response = await axios.get('http://localhost:5000/api/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction. Please try again."); // Notify the user
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      date: transaction.date,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category // Set category for editing
    });
    setEditingId(transaction._id);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`);
      setTransactions(transactions.filter(transaction => transaction._id !== id));
      alert("Transaction deleted successfully.");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: '',
      amount: '',
      description: '',
      category: ''
    });
    setErrors({});
  };

  const totalIncome = transactions.reduce((acc, transaction) => transaction.amount > 0 ? acc + transaction.amount : acc, 0);
  const totalExpenses = transactions.reduce((acc, transaction) => transaction.amount < 0 ? acc + Math.abs(transaction.amount) : acc, 0);
  const netSavings = totalIncome - totalExpenses; // Calculate net savings

  // Budget vs Actual Data
  const budgetData = budgets.reduce((acc, budget) => {
    acc[budget.category] = budget.amount;
    return acc;
  }, {} as Record<string, number>);

  const actualData = Object.keys(categoryData).reduce((acc, category) => {
    acc[category] = categoryData[category] || 0;
    return acc;
  }, {} as Record<string, number>);

  const budgetVsActualData = Object.keys(budgetData).map(category => ({
    category,
    budget: budgetData[category],
    actual: actualData[category] || 0,
  }));

  // Handle budget submission
  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetCategory && budgetAmount) {
      setBudgets([...budgets, { category: budgetCategory, amount: parseFloat(budgetAmount) }]);
      setBudgetCategory('');
      setBudgetAmount('');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Personal Finance Tracker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Transaction Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Transaction' : 'Add Transaction'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={errors.date ? "border-red-500" : ""}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (negative for expenses)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="text"
                  placeholder="-45.99"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm">{errors.amount}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="Grocery shopping"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <CategorySelector onSelect={(category) => setFormData({ ...formData, category })} />
                {errors.category && (
                  <p className ="text-red-500 text-sm">{errors.category}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="w-full">
                  {editingId ? 'Update' : 'Add'} Transaction
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Monthly Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  <Bar dataKey="income" fill="#22c55e" name="Income" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Add transactions to see chart data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Setting Form */}
      <Card>
        <CardHeader>
          <CardTitle>Set Monthly Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBudgetSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budgetCategory">Category</Label>
              <CategorySelector onSelect={setBudgetCategory} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetAmount">Budget Amount</Label>
              <Input
                id="budgetAmount"
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className={budgetAmount ? "" : "border-red-500"}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="w-full">
                Set Budget
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Budget vs Actual Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {budgets.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetVsActualData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="budget" fill="#4BC0C0" name="Budget" />
                <Bar dataKey="actual" fill="#FF6384" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Set budgets to see comparison</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple Spending Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-lg shadow-md bg-green-100">
              <div className="text-2xl font-bold text-green-600">
                ${totalIncome.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Income</div>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg shadow-md bg-red-100">
              <div className="text-2xl font-bold text-red-600">
                ${totalExpenses.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Expenses</div>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg shadow-md bg-blue-100">
              <div className="text-2xl font-bold text-blue-600">
                ${netSavings.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Net Savings</div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Average Monthly Spending: <span className="font-bold">${(totalExpenses / (chartData.length || 1)).toFixed(2)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart for Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {Object.keys(categoryData).length > 0 ? (
            <PieChart data={categoryData} />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Add transactions to see category breakdown</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(transaction => (
                      <tr key={transaction._id} className="border-t">
                        <td className="p-2">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="p-2">{transaction.description}</td>
                        <td className="p-2">{transaction.category}</td>
                        <td className={`p-2 text-right font-medium ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(transaction._id)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No transactions found. Please add some.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceTracker;