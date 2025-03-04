"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, Trash2, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      return new Date(a.month) - new Date(b.month);
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
    await axios.delete(`http://localhost:5000/api/transactions/${id}`);
    setTransactions(transactions.filter(transaction => transaction._id !== id));
    
    if (editingId === id) {
      setEditingId(null);
      setFormData({
        date: '',
        amount: '',
        description: '',
        category: ''
      });
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
                  <p className="text-red-500 text-sm">{errors.category}</p>
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
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
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
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(transaction._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No transactions found. Add a transaction to get started.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceTracker;