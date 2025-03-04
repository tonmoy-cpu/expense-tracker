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

interface Transaction {
  _id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
}

interface Budget {
  _id?: string;
  category: string;
  amount: number;
}

const FinanceTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    description: '',
    category: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<Record<string, number>>({});
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  useEffect(() => {
    let isMounted = true;

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

    const fetchBudgets = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/budgets');
        if (isMounted) {
          setBudgets(response.data);
        }
      } catch (error) {
        console.error("Error fetching budgets:", error);
      }
    };

    fetchTransactions();
    fetchBudgets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const monthlyData: Record<string, any> = {};
    const categoryBreakdown: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", transaction.date);
        return;
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

      const category = transaction.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + transaction.amount;
    });
    
    const sortedData = Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.month + " 1");
      const dateB = new Date(b.month + " 1");
      return dateA.getTime() - dateB.getTime();
    });
    
    setChartData(sortedData);
    setCategoryData(categoryBreakdown);
  }, [transactions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
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
      category: formData.category
    };
    
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/transactions/${editingId}`, newTransaction);
        setEditingId(null);
      } else {
        await axios.post('http://localhost:5000/api/transactions', newTransaction);
      }
      
      setFormData({
        date: '',
        amount: '',
        description: '',
        category: ''
      });

      const response = await axios.get('http://localhost:5000/api/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction. Please try again.");
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      date: transaction.date,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category
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
  const netSavings = totalIncome - totalExpenses;

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

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetCategory && budgetAmount) {
      const newBudget = { category: budgetCategory, amount: parseFloat(budgetAmount) };
      try {
        await axios.post('http://localhost:5000/api/budgets', newBudget);
        setBudgets([...budgets, newBudget]);
        setBudgetCategory('');
        setBudgetAmount('');
      } catch (error) {
        console.error("Error saving budget:", error);
        alert("Failed to save budget. Please try again.");
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl bg-gray-50 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Personal Finance Tracker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="transition-transform transform hover:scale-105 duration-300 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-blue-600">{editingId ? 'Edit Transaction' : 'Add Transaction'}</CardTitle>
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
                  className={`border ${errors.date ? "border-red-500" : "border-gray-300"} rounded-md transition duration-200`}
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
                  className={`border ${errors.amount ? "border-red-500" : "border-gray-300"} rounded-md transition duration-200`}
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
                  className={`border ${errors.description ? "border-red-500" : "border-gray-300"} rounded-md transition duration-200`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <CategorySelector onSelect={(category) => setFormData({ ...formData, category })} />
                {errors.category && (
                  <p className="text-red-500 text-sm">{errors.category}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white transition duration-200">
                  {editingId ? 'Update' : 'Add'} Transaction
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit} className="w-full border border-gray-300 hover:bg-gray-100 transition duration-200">
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card className="transition-transform transform hover:scale-105 duration-300 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-blue-600">Monthly Summary</CardTitle>
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

      <Card className="transition-transform transform hover:scale-105 duration-300 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-600">Set Monthly Budgets</CardTitle>
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
                className={`border ${budgetAmount ? "" : "border-red-500"} rounded-md transition duration-200`}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white transition duration-200">
                Set Budget
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="transition-transform transform hover:scale-105 duration-300 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-600">Budget vs Actual</CardTitle>
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

      <Card className="transition-transform transform hover:scale-105 duration-300 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-600">Spending Insights</CardTitle>
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

      <Card className="transition-transform transform hover:scale-105 duration-300 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-600">Category Breakdown</CardTitle>
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

      <Card className="transition-transform transform hover:scale-105 duration-300 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-600">Transactions</CardTitle>
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
                      <tr key={transaction._id} className="border-t transition-colors duration-200 hover:bg-gray-50">
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
                              className="transition-transform transform hover:scale-110 duration-200"
                            >
                              <Edit />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(transaction._id)}
                              className="transition-transform transform hover:scale-110 duration-200"
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