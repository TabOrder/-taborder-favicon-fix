import React, { useState, useEffect } from "react";
import axios from "../services/axiosConfig"; // Use your custom axios instance

function ComboDashboard() {
  const [combos, setCombos] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [newCombo, setNewCombo] = useState({
    name: "",
    description: "",
    price: "",
    category: "general",
    items: []
  });
  const [editCombo, setEditCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCombos();
    fetchStockItems();
  }, []);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/combos/");
      setCombos(res.data.combos || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockItems = async () => {
    try {
      const res = await axios.get("/api/stock");
      setStockItems(res.data.stock || []);
    } catch (err) {
      console.error("Error fetching stock items:", err);
    }
  };

  const handleAdd = async () => {
    if (!newCombo.name || !newCombo.price || newCombo.items.length === 0) {
      setError("Name, price, and at least one item are required.");
      return;
    }

    try {
      const comboData = {
        name: newCombo.name,
        description: newCombo.description,
        price: parseFloat(newCombo.price),
        category: newCombo.category,
        items: newCombo.items.map(item => ({
          stock_id: item.stock_id,
          quantity: parseInt(item.quantity)
        }))
      };

      await axios.post("/api/combos/", comboData);
      setNewCombo({ name: "", description: "", price: "", category: "general", items: [] });
      fetchCombos();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (comboId) => {
    try {
      await axios.delete(`/api/combos/${comboId}`);
      fetchCombos();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = async () => {
    if (!editCombo.name || !editCombo.price || editCombo.items.length === 0) {
      setError("Name, price, and at least one item are required.");
      return;
    }

    try {
      const comboData = {
        name: editCombo.name,
        description: editCombo.description,
        price: parseFloat(editCombo.price),
        category: editCombo.category,
        items: editCombo.items.map(item => ({
          stock_id: item.stock_id,
          quantity: parseInt(item.quantity)
        }))
      };

      await axios.put(`/api/combos/${editCombo.id}`, comboData);
      setEditCombo(null);
      fetchCombos();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const addItemToCombo = () => {
    setNewCombo({
      ...newCombo,
      items: [...newCombo.items, { stock_id: "", quantity: 1 }]
    });
  };

  const removeItemFromCombo = (index) => {
    setNewCombo({
      ...newCombo,
      items: newCombo.items.filter((_, i) => i !== index)
    });
  };

  const updateComboItem = (index, field, value) => {
    const updatedItems = [...newCombo.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewCombo({ ...newCombo, items: updatedItems });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="card mb-6">
          <div className="card-header">
            <h1 className="text-2xl font-bold">🛒 TabOrder Combo Dashboard</h1>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium">Error: {error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Add new combo */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Add New Combo</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-group">
                <label className="block text-sm font-medium mb-1">Combo Name</label>
                <input
                  type="text"
                  placeholder="Enter combo name"
                  className="input-field"
                  value={newCombo.name}
                  onChange={(e) =>
                    setNewCombo({ ...newCombo, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  placeholder="Enter price"
                  className="input-field"
                  value={newCombo.price}
                  onChange={(e) =>
                    setNewCombo({ ...newCombo, price: e.target.value })
                  }
                />
              </div>
            </div>
            
            <div className="form-group mb-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                placeholder="Enter combo description"
                className="input-field"
                rows="3"
                value={newCombo.description}
                onChange={(e) =>
                  setNewCombo({ ...newCombo, description: e.target.value })
                }
              />
            </div>

            <div className="form-group mb-4">
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="input-field"
                value={newCombo.category}
                onChange={(e) =>
                  setNewCombo({ ...newCombo, category: e.target.value })
                }
              >
                <option value="general">General</option>
                <option value="grocery">Grocery</option>
                <option value="premium">Premium</option>
                <option value="babies">Baby Care</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>

            {/* Items section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Items</label>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={addItemToCombo}
                >
                  + Add Item
                </button>
              </div>
              
              {newCombo.items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    className="input-field flex-1"
                    value={item.stock_id}
                    onChange={(e) => updateComboItem(index, 'stock_id', e.target.value)}
                  >
                    <option value="">Select item</option>
                    {stockItems.map(stock => (
                      <option key={stock.id} value={stock.id}>
                        {stock.name} - R{stock.price}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    className="input-field w-20"
                    value={item.quantity}
                    onChange={(e) => updateComboItem(index, 'quantity', e.target.value)}
                    min="1"
                  />
                  <button
                    type="button"
                    className="btn-danger text-sm"
                    onClick={() => removeItemFromCombo(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button className="btn-primary" onClick={handleAdd}>
                Add Combo
              </button>
            </div>
          </div>
        </div>

        {/* Combo list */}
        <div className="grid gap-6">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className="card hover:shadow-hover transition-shadow duration-200"
            >
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{combo.name}</h3>
                    <p className="text-gray-600">{combo.description}</p>
                    <p className="text-primary-600 font-semibold">R{combo.price}</p>
                    <span className="inline-block bg-gray-200 px-2 py-1 rounded text-sm">
                      {combo.category || 'General'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="btn-secondary"
                      onClick={() => setEditCombo(combo)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(combo.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Items:</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {combo.items && combo.items.map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <span className="mr-2">•</span>
                        <span>{item.name || `Item ${idx + 1}`}</span>
                        <span className="ml-auto text-gray-500">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ComboDashboard;
