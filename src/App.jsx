// ============================================
// MODULE 1: Main App Component & State Setup
// ============================================
// Copy this entire section to your App.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Download, Upload, Package, ShoppingCart, Users, TrendingUp, AlertTriangle, Edit2, Trash2, X, Home, Boxes, DollarSign, BarChart3, Printer, Receipt, FileDown, FileUp, Calculator  } from 'lucide-react';
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import { auth } from './firebase';
// Add these imports
import { useDeviceDetection } from './hooks/useDeviceDetection';
import MobileLayout from './components/mobile/MobileLayout';
import MobileDashboard from './components/mobile/MobileDashboard';
import MobileInventory from './components/mobile/MobileInventory';
import MobileSales from './components/mobile/MobileSales';
import MobileAddPart from './components/mobile/MobileAddPart';
import MobileMultiItemSale from './components/mobile/MobileMultiItemSale';  //  CHANGED THIS LINE
import MobileProfit from './components/mobile/MobileProfit';
import MobileMore from './components/mobile/MobileMore';
import {
  fetchCategories,
  fetchParts,
  addPart as addPartToDb,
  updatePart as updatePartInDb,
  deletePart as deletePartFromDb,  //  This is correct
  fetchSales,
  addSale as addSaleToDb,
  deleteSale as deleteSaleFromDb,  //  This is correct
  fetchSuppliers,
  addSupplier as addSupplierToDb,
  updateSupplier as updateSupplierInDb,
  deleteSupplier as deleteSupplierFromDb,
  initialiseOfflineSync
} from './supabaseHelpers';

let xlsxModule;
const loadXlsx = () => {
  xlsxModule ??= import('xlsx');
  return xlsxModule;
};

// ========== PART MODAL (Add/Edit Material) ==========
const PartModal = ({ editItem, categories, suppliers, onClose, onSave }) => {
  const [formData, setFormData] = useState(editItem || {
    partNumber: '',
    name: '',
    category: '',
    brand: '',
    purchasePrice: '',
    sellingPrice: '',
    stock: '',
    reorderLevel: '10',
    supplier: '',
    location: ''
  });

  const profitPerUnit = formData.sellingPrice && formData.purchasePrice
    ? (parseFloat(formData.sellingPrice) - parseFloat(formData.purchasePrice)).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {editItem ? 'Edit Material' : 'Add New Material'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Material Code *</label>
            <input
              type="text"
              value={formData.partNumber}
              onChange={(e) => setFormData({...formData, partNumber: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., BP-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Material Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Wheat Lot"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Grade</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({...formData, brand: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Crop / Quality Grade"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Purchase / Cost Rate (Rs.) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cost paid to owner / party"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Selling Rate (Rs.) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Price charged to buyer"
              required
            />
          </div>

          {formData.purchasePrice && formData.sellingPrice && (
            <div className="md:col-span-2">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                <p className="text-sm font-semibold text-green-700">
                  Commission Per Unit: <span className="text-xl">Rs.{profitPerUnit}</span>
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Available Quantity *</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Current material quantity"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Quantity Alert</label>
            <input
              type="number"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Minimum quantity alert"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Party</label>
            <select
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Party</option>
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.name}>{sup.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Shelf A-12, Warehouse B"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transition"
          >
            {editItem ? 'Update' : 'Add'} Part
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== SALE MODAL (Record New Material Sale) ==========
const SaleModal = ({ parts, onClose, onSave }) => {
  // Cart state for multi-item sales
  const [cartItems, setCartItems] = useState([]);
  const [partSearch, setPartSearch] = useState('');
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [customer, setCustomer] = useState('');
  const [soldBy, setSoldBy] = useState('Shop Manager');
  const dropdownRef = useRef(null);

  // Filter available parts (exclude already added to cart)
  const filteredMaterials = parts.filter(p =>
    p.stock > 0 &&
    !cartItems.find(item => item.partNumber === p.partNumber) &&
    (p.name?.toLowerCase().includes(partSearch.toLowerCase()) ||
     p.partNumber?.toLowerCase().includes(partSearch.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPartDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add part to cart
  const addToCart = (part) => {
    setCartItems([...cartItems, {
      partNumber: part.partNumber,
      partName: part.name,
      purchasePrice: part.purchasePrice,
      sellingPrice: part.sellingPrice,
      quantity: 1,
      maxQuantity: part.stock,
      category: part.category,
      brand: part.brand
    }]);
    setPartSearch('');
    setShowPartDropdown(false);
  };

  // Update item quantity
  const updateQuantity = (index, quantity) => {
    const updated = [...cartItems];
    const qty = parseInt(quantity) || 0;
    if (qty > updated[index].maxQuantity) {
      alert(` Maximum quantity available: ${updated[index].maxQuantity}`);
      return;
    }
    updated[index].quantity = qty;
    setCartItems(updated);
  };

  // Update item price
  const updatePrice = (index, price) => {
    const updated = [...cartItems];
    updated[index].sellingPrice = parseFloat(price) || 0;
    setCartItems(updated);
  };

  // Remove item from cart
  const removeItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Calculate totals
  const getTotals = () => {
    const total = cartItems.reduce((sum, item) =>
      sum + (item.quantity * item.sellingPrice), 0
    );
    const profit = cartItems.reduce((sum, item) =>
      sum + (item.quantity * (item.sellingPrice - item.purchasePrice)), 0
    );
    return { total, profit };
  };

  // Handle form submission
  const handleSubmit = () => {
    if (cartItems.length === 0) {
      alert(' Please add at least one item to cart!');
      return;
    }

    if (cartItems.some(item => item.quantity <= 0)) {
      alert(' All items must have quantity greater than 0');
      return;
    }

    if (!customer.trim()) {
      alert(' Please enter customer name!');
      return;
    }

    // Send multi-item format to parent
    onSave({
      items: cartItems,
      customer: customer.trim(),
      soldBy: soldBy
    });
  };

  const { total, profit } = getTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="glass-panel rounded-3xl w-full max-w-5xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header - Enhanced Design */}
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            <div>
              <h3 className="text-2xl font-bold">Record Material Sale</h3>
              <p className="text-sm text-blue-100 mt-1">Add multiple materials to cart before checkout</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 p-6" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="space-y-5">

            {/* Search and Add Materials */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Search & Add Materials to Cart
                <span className="text-xs font-normal text-gray-500 ml-auto">
                  {cartItems.length} item(s) in cart
                </span>
              </label>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={partSearch}
                  onChange={(e) => {
                    setPartSearch(e.target.value);
                    setShowPartDropdown(true);
                  }}
                  onFocus={() => setShowPartDropdown(true)}
                  placeholder="Search materials to add to cart..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  autoComplete="off"
                />
              </div>

              {/* Dropdown List */}
              {showPartDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                  {filteredMaterials.length > 0 ? (
                    filteredMaterials.map(part => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => addToCart(part)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex justify-between items-center transition"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{part.name}</p>
                          <p className="text-sm text-gray-500">
                            #{part.partNumber}  {part.category}
                          </p>
                          {part.brand && (
                            <p className="text-xs text-gray-400">Grade: {part.brand}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-600">Quantity: {part.stock}</p>
                          <p className="text-xs text-gray-600">Rs.{part.sellingPrice.toFixed(0)}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold">No materials available</p>
                      <p className="text-xs mt-1">
                        {parts.filter(p => p.stock > 0).length === 0
                          ? 'All materials are unavailable'
                          : 'Try a different search or all parts already in cart'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items */}
            {cartItems.length > 0 && (
              <div className="border-2 border-blue-300 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-purple-50">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                  Shopping Cart
                  <span className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </span>
                </h4>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {cartItems.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                      {/* Item Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                              #{index + 1}
                            </span>
                            <p className="font-bold text-gray-800 text-lg">{item.partName}</p>
                          </div>
                          <p className="text-sm text-gray-500">
                            Material Code: {item.partNumber}  {item.category}
                          </p>
                          {item.brand && (
                            <p className="text-xs text-gray-400">Grade: {item.brand}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition group"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-5 h-5 group-hover:scale-110 transition" />
                        </button>
                      </div>

                      {/* Item Controls */}
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="col-span-1">
                          <label className="text-xs text-gray-600 font-semibold block mb-1">Quantity</label>
                         <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={item.quantity}
  onChange={(e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '' || parseInt(value) <= item.maxQuantity) {
      updateQuantity(index, value || '0');
    }
  }}
  onBlur={(e) => {
    if (e.target.value === '' || e.target.value === '0') {
      updateQuantity(index, '1');
    }
  }}
  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-bold text-lg"
/>
                          <p className="text-xs text-gray-500 mt-1 text-center">Max: {item.maxQuantity}</p>
                        </div>

                        <div className="col-span-1">
                          <label className="text-xs text-gray-600 font-semibold block mb-1">Unit Price</label>
                         <input
  type="text"
  inputMode="decimal"
  value={item.sellingPrice}
  onChange={(e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length <= 2) {
      updatePrice(index, value);
    }
  }}
  onBlur={(e) => {
    const val = e.target.value;
    if (val === '' || val === '0' || val === '.') {
      updatePrice(index, '0');
    } else if (!val.includes('.')) {
      // If no decimal, leave as is
      updatePrice(index, val);
    }
  }}
  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-bold"
/>
                        </div>

                        <div className="col-span-2">
                          <label className="text-xs text-gray-600 font-semibold block mb-1">
                            <Calculator className="w-3 h-3 inline mr-1" />
                            Subtotal
                          </label>
                          <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-lg border-2 border-blue-300">
                            <p className="font-bold text-blue-700 text-xl text-center">
                              Rs.{(item.quantity * item.sellingPrice).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Item Commission */}
                      <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                        <span className="text-xs text-green-700 font-semibold">Commission on this item:</span>
                        <span className="text-sm font-bold text-green-600">
                          Rs.{(item.quantity * (item.sellingPrice - item.purchasePrice)).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty Cart Message */}
            {cartItems.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Search and add parts above to start</p>
              </div>
            )}

            {/* Party Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Party Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  placeholder="Enter party name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Handled By <span className="text-red-500">*</span>
                </label>
                <select
                  value={soldBy}
                  onChange={(e) => setSoldBy(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                >
                  <option value="Shop Manager">Shop Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Accountant">Accountant</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            {cartItems.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 p-6 rounded-xl border-2 border-green-300 shadow-lg">
                <h4 className="font-bold text-gray-800 mb-4 text-center text-xl flex items-center justify-center gap-2">
                  <Calculator className="w-6 h-6 text-green-600" />
                  Deal Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-300">
                    <span className="text-gray-700 font-semibold">Total Items:</span>
                    <span className="text-2xl font-bold text-gray-800">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)} units
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-300">
                    <span className="text-gray-700 font-semibold">Unique Materials:</span>
                    <span className="text-xl font-bold text-gray-800">{cartItems.length}</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border-2 border-blue-300">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-bold text-lg">Total Deposit / Credit Amount:</span>
                      <span className="text-3xl font-bold text-blue-700">Rs.{total.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="bg-green-200 rounded-lg p-3 border-2 border-green-400">
                    <div className="flex justify-between items-center">
                      <span className="text-green-800 font-bold text-lg">Total Commission:</span>
                      <span className="text-3xl font-bold text-green-700">Rs.{profit.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-600 pt-2">
                    Commission Margin: <span className="font-bold text-purple-600">
                      {total > 0 ? ((profit / total) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-white font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={cartItems.length === 0}
            className={`px-8 py-3 rounded-lg font-bold shadow-lg transition flex items-center gap-2 ${
              cartItems.length > 0
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
             Record Deal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== SUPPLIER MODAL (Add/Edit Party) ==========
const SupplierModal = ({ editItem, onClose, onSave }) => {
  const [formData, setFormData] = useState(editItem || {
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: ''
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {editItem ? 'Edit Party' : 'Add New Party'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Party Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Party / customer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Contact Person</label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Representative name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email address"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Full address"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transition"
          >
            {editItem ? 'Update' : 'Add'} Party
          </button>
        </div>
      </div>
    </div>
  );
};

// Continue with Module 5 for Receipt Modal...
// ============================================
// MODULE 5: Receipt Modal Component
// ============================================
// Add this component AFTER the other modal components
// This creates the professional receipt with print functionality

const ReceiptModal = ({ sale, allSales, onClose }) => {
  const receiptRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  if (!sale) return null;

  // Check if this is part of a multi-item sale (same customer, same date/time)
  const relatedSales = allSales.filter(s =>
    s.customer === sale.customer &&
    s.date === sale.date &&
    s.time === sale.time &&
    s.soldBy === sale.soldBy
  );

  const isMultiItem = relatedSales.length > 1;
  const itemsToShow = isMultiItem ? relatedSales : [sale];

  const grandTotal = itemsToShow.reduce((sum, s) => sum + s.total, 0);
  const grandCommission = itemsToShow.reduce((sum, s) => sum + s.profit, 0);

  return (
    <>
      {/* MODAL OVERLAY */}
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="glass-panel rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh]">

          {/* Header Buttons (Hidden when printing) */}
          <div className="flex justify-between items-center p-6 border-b print:hidden flex-shrink-0">
            <h3 className="text-2xl font-bold text-gray-800">
              Commission Sale Receipt {isMultiItem && `(${itemsToShow.length} items)`}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded-lg transition flex items-center gap-2"
              >
                <Printer className="w-6 h-6" />
                <span className="font-semibold">Print</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* SCROLLABLE Receipt Content */}
          <div className="overflow-y-auto flex-1 p-6 print:overflow-visible print:p-0">
            <div
              ref={receiptRef}
              id="receipt-content"
              className="border-4 border-blue-600 rounded-xl p-8 bg-white print:border-2"
            >

              {/* Company Header */}
              <div className="text-center border-b-4 border-blue-600 pb-6 mb-6 print:border-b-2">
                <div className="flex justify-center mb-3">
                  <Package className="w-16 h-16 text-blue-700 print:w-12 print:h-12" />
                </div>
                <h1 className="text-4xl font-bold text-blue-800 mb-2 print:text-2xl">
                  Commission Shop Management System
                </h1>
                <p className="text-sm text-gray-700 font-semibold mb-3 print:text-xs">
                  Cash Book, Material Book, Party Accounts & Commission Tracking
                </p>
                <div className="flex justify-center gap-6 text-xs text-gray-600 font-semibold flex-wrap print:gap-3 print:text-[10px]">
                  <span> Shop Manager: 0300-0000000</span>
                  <span> Cashier: 0300-0000001</span>
                </div>
              </div>

              {/* Receipt Details */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
                <div className="grid grid-cols-2 gap-4 text-sm print:text-xs">
                  <div>
                    <p className="text-gray-600 font-semibold">Receipt #:</p>
                    <p className="font-bold text-gray-800">{sale.id.slice(-8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 font-semibold">Date & Time:</p>
                    <p className="font-bold text-gray-800">{sale.date}</p>
                    <p className="font-bold text-gray-800">{sale.time}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Party:</p>
                    <p className="font-bold text-gray-800">{sale.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 font-semibold">Served By:</p>
                    <p className="font-bold text-gray-800">{sale.soldBy}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h4 className="font-bold text-lg mb-4 border-b-2 border-gray-300 pb-2 print:text-base">
                  ITEMS PURCHASED
                </h4>

                <div className="space-y-4">
                  {itemsToShow.map((item, index) => (
                    <div key={item.id} className="bg-blue-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300 print:text-xs">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isMultiItem && (
                              <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                                #{index + 1}
                              </span>
                            )}
                            <p className="font-bold text-gray-800 text-lg print:text-sm">{item.partName}</p>
                          </div>
                          <p className="text-sm text-gray-600 print:text-xs">Material Code: {item.partNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 print:text-xs">Qty: {item.quantity}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm print:text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Price/Unit:</span>
                          <span className="font-bold text-gray-800">Rs.{item.sellingPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Subtotal:</span>
                          <span className="font-bold text-blue-700">Rs.{item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Section */}
              <div className="border-t-4 border-blue-600 pt-4 print:border-t-2">
                {isMultiItem && (
                  <div className="mb-4 bg-gray-50 p-3 rounded-lg print:bg-white print:border">
                    <div className="flex justify-between text-sm print:text-xs">
                      <span className="font-semibold text-gray-700">Total Items:</span>
                      <span className="font-bold text-gray-800">{itemsToShow.length} items</span>
                    </div>
                    <div className="flex justify-between text-sm print:text-xs mt-1">
                      <span className="font-semibold text-gray-700">Total Quantity:</span>
                      <span className="font-bold text-gray-800">
                        {itemsToShow.reduce((sum, s) => sum + s.quantity, 0)} units
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg mb-4 print:bg-blue-600 print:p-3">
                  <div className="flex justify-between items-center print:text-sm">
                    <span className="text-xl font-bold print:text-base">GRAND TOTAL:</span>
                    <span className="text-3xl font-bold print:text-xl">Rs.{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600 mb-2 print:text-xs print:hidden">
                  <p>Commission on this deal: <span className="font-bold text-green-600">Rs.{grandCommission.toFixed(2)}</span></p>
                </div>
              </div>

              {/* Footer with Tagline */}
              <div className="text-center border-t-4 border-blue-600 pt-6 mt-6 print:border-t-2 print:pt-4 print:mt-4">
                <p className="text-lg font-bold text-gray-800 mb-2 print:text-sm">
                  Thank you for your business!
                </p>
                <p className="text-2xl font-bold text-blue-600 mb-3 print:text-base">
                  Drive Safe, Stay Happy!
                </p>
                <p className="text-sm text-gray-600 italic mb-4 print:text-xs">
                  Your satisfaction is our success
                </p>
                <div className="text-xs text-gray-500 border-t pt-3 print:text-[10px]">
                  <p>For any queries, please contact us at the numbers mentioned above</p>
                  <p className="mt-1">This is a computer-generated receipt</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons (Hidden when printing) */}
          <div className="flex justify-center gap-3 p-6 border-t print:hidden flex-shrink-0">
            <button
              onClick={handlePrint}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 hover:from-purple-700 hover:to-purple-800 shadow-lg transition"
            >
              <Printer className="w-5 h-5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY STYLES */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5cm;
          }

          body * {
            visibility: hidden;
          }

          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }

          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:text-xs {
            font-size: 0.75rem !important;
          }

          .print\\:text-sm {
            font-size: 0.875rem !important;
          }

          .print\\:text-base {
            font-size: 1rem !important;
          }

          .print\\:text-xl {
            font-size: 1.25rem !important;
          }

          .print\\:border-2 {
            border-width: 2px !important;
          }

          .print\\:p-0 {
            padding: 0 !important;
          }

          .print\\:p-3 {
            padding: 0.75rem !important;
          }

          .print\\:overflow-visible {
            overflow: visible !important;
          }

          .print\\:w-12 {
            width: 3rem !important;
          }

          .print\\:h-12 {
            height: 3rem !important;
          }
        }
      `}</style>
    </>
  );
};

const DashboardView = ({
  parts,
  sales,
  lowQuantityMaterials,
  outOfQuantityMaterials,
  totalValue,
  todayRevenue,
  todayCommission,
  totalRevenue,
  totalCommission
}) => (
  <div className="space-y-6">

    {/* ========== STATISTICS CARDS ========== */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Total Materials Card */}
      <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm font-medium">Total Materials</p>
            <p className="text-4xl font-bold mt-2">{parts.length}</p>
            <p className="text-slate-400 text-xs mt-2">In Material Book</p>
          </div>
          <Package className="w-14 h-14 opacity-30" />
        </div>
      </div>

      {/* Material Value Card */}
      <div className="rounded-2xl bg-emerald-600 p-6 text-white shadow-xl shadow-emerald-600/20 transition hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">Material Value</p>
            <p className="text-4xl font-bold mt-2">Rs.{totalValue.toFixed(0)}</p>
            <p className="text-green-100 text-xs mt-2">Purchase Price</p>
          </div>
          <DollarSign className="w-14 h-14 opacity-30" />
        </div>
      </div>

      {/* Low Quantity Items Card */}
      <div className="rounded-2xl bg-amber-500 p-6 text-white shadow-xl shadow-amber-500/20 transition hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm font-medium">Low Quantity Items</p>
            <p className="text-4xl font-bold mt-2">{lowQuantityMaterials.length}</p>
            <p className="text-orange-100 text-xs mt-2">Need Reorder</p>
          </div>
          <AlertTriangle className="w-14 h-14 opacity-30" />
        </div>
      </div>

      {/* Today's Commission Card */}
      <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium">Today's Commission</p>
            <p className="text-4xl font-bold mt-2">Rs.{todayCommission.toFixed(0)}</p>
            <p className="text-purple-100 text-xs mt-2">Cash Book Deposit / Credit Amount: Rs.{todayRevenue.toFixed(0)}</p>
          </div>
          <TrendingUp className="w-14 h-14 opacity-30" />
        </div>
      </div>
    </div>

    {/* ========== QUICK STATS ROW ========== */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="soft-card p-4 rounded-2xl border-l-4 border-blue-500">
        <p className="text-gray-600 text-sm font-semibold">Total Deals</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{sales.length}</p>
      </div>
      <div className="soft-card p-4 rounded-2xl border-l-4 border-emerald-500">
        <p className="text-gray-600 text-sm font-semibold">Total Cash Book Amount</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">Rs.{totalRevenue.toFixed(2)}</p>
      </div>
      <div className="soft-card p-4 rounded-2xl border-l-4 border-blue-500">
        <p className="text-gray-600 text-sm font-semibold">Total Commission</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">Rs.{totalCommission.toFixed(2)}</p>
      </div>
    </div>

    {/* ========== STOCK ALERTS ========== */}
    {(lowQuantityMaterials.length > 0 || outOfQuantityMaterials.length > 0) && (
      <div className="soft-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          Quantity Alerts - Action Required!
        </h3>
        <div className="space-y-3">
          {outOfQuantityMaterials.slice(0, 5).map(part => (
            <div key={part.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-2 border-red-200 hover:bg-red-100 transition">
              <div>
                <p className="font-semibold text-gray-800">{part.name}</p>
                <p className="text-sm text-gray-500">Material Code: {part.partNumber}</p>
              </div>
              <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                OUT OF STOCK
              </span>
            </div>
          ))}
          {lowQuantityMaterials.slice(0, 5).map(part => (
            <div key={part.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-2 border-orange-200 hover:bg-orange-100 transition">
              <div>
                <p className="font-semibold text-gray-800">{part.name}</p>
                <p className="text-sm text-gray-500">Material Code: {part.partNumber} - Quantity: {part.stock} (Min: {part.reorderLevel})</p>
              </div>
              <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                LOW STOCK
              </span>
            </div>
          ))}
          {(outOfQuantityMaterials.length > 5 || lowQuantityMaterials.length > 5) && (
            <p className="text-center text-sm text-gray-500 pt-2">
              + {(outOfQuantityMaterials.length + lowQuantityMaterials.length - 10)} more items need attention
            </p>
          )}
        </div>
      </div>
    )}

    {/* ========== RECENT SALES TABLE ========== */}
    <div className="soft-card rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Recent Material Sales</h3>
        <span className="text-sm text-gray-500">Last 10 transactions</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Date</th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Time</th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Part</th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Party</th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Handled By</th>
              <th className="text-right py-3 px-4 text-gray-600 font-semibold text-sm">Qty</th>
              <th className="text-right py-3 px-4 text-gray-600 font-semibold text-sm">Amount</th>
              <th className="text-right py-3 px-4 text-gray-600 font-semibold text-sm">Commission</th>
            </tr>
          </thead>
          <tbody>
            {sales.slice(-10).reverse().map(sale => (
              <tr key={sale.id} className="border-b border-gray-100 hover:bg-blue-50 transition">
                <td className="py-3 px-4 text-sm">{sale.date}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{sale.time}</td>
                <td className="py-3 px-4 font-medium text-sm">{sale.partName}</td>
                <td className="py-3 px-4 text-sm">{sale.customer}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{sale.soldBy}</td>
                <td className="py-3 px-4 text-right text-sm font-semibold">{sale.quantity}</td>
                <td className="py-3 px-4 text-right font-semibold text-sm">Rs.{sale.total.toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold text-green-600 text-sm">Rs.{sale.profit.toFixed(2)}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan="8" className="py-12 text-center text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No sales recorded yet</p>
                  <p className="text-sm mt-1">Record your first sale to see it here!</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* ========== QUICK INSIGHTS ========== */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Top Categories */}
      <div className="soft-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top Categories</h3>
        <div className="space-y-3">
          {(() => {
            const categoryCounts = {};
            parts.forEach(part => {
              categoryCounts[part.category] = (categoryCounts[part.category] || 0) + 1;
            });
            return Object.entries(categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{category}</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    {count} parts
                  </span>
                </div>
              ));
          })()}
        </div>
      </div>

      {/* Today's Activity */}
      <div className="soft-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="font-medium text-gray-700">Deals Made</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
              {sales.filter(s => s.date === new Date().toISOString().split('T')[0]).length}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-gray-700">Cash Book Amount Generated</span>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
              Rs.{todayRevenue.toFixed(0)}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="font-medium text-gray-700">Commission Earned</span>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
              Rs.{todayCommission.toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const InventoryView = ({
  filteredMaterials,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterQuantity,
  setFilterQuantity,
  categories,
  handleExportInventory,
  setModalType,
  setShowModal,
  setEditItem,
  handleDeletePart
}) => (
  <div className="space-y-4">
    <div className="soft-card rounded-2xl p-6">

      {/* ========== HEADER WITH ACTIONS ========== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Material Book</h2>
          <p className="text-sm text-gray-500 mt-1">
            Total: {filteredMaterials.length} materials
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportInventory}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-semibold shadow-md"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              setModalType('part');
              setShowModal(true);
              setEditItem(null);
            }}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Material
          </button>
        </div>
      </div>

      {/* ========== SEARCH AND FILTERS ========== */}
      <div className="flex gap-4 mb-6 flex-wrap">

         {/* Search Box - FIXED VERSION */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, material code, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
            autoComplete="off"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>

        {/* Quantity Status Filter */}
        <select
          value={filterQuantity}
          onChange={(e) => setFilterQuantity(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium bg-white"
        >
          <option value="all">All Quantity Levels</option>
          <option value="low">Low Quantity</option>
          <option value="out">Unavailable</option>
        </select>
      </div>

      {/* ========== PARTS TABLE ========== */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Material Code</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Name</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Category</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Grade</th>
              <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Purchase</th>
              <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Selling</th>
              <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Margin</th>
              <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Quantity</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Status</th>
              <th className="text-center py-4 px-4 text-gray-700 font-bold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map(part => (
              <tr key={part.id} className="border-b border-gray-100 hover:bg-blue-50 transition">

                {/* Material Code */}
                <td className="py-4 px-4 font-semibold text-blue-600">{part.partNumber}</td>

                {/* Material Name */}
                <td className="py-4 px-4 font-medium">{part.name}</td>

                {/* Category */}
                <td className="py-4 px-4 text-sm">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                    {part.category}
                  </span>
                </td>

                {/* Grade */}
                <td className="py-4 px-4 text-sm">{part.brand}</td>

                {/* Purchase Price */}
                <td className="py-4 px-4 text-right text-sm">Rs.{part.purchasePrice?.toFixed(2) || '0.00'}</td>

                {/* Selling Price */}
                <td className="py-4 px-4 text-right font-semibold text-sm">Rs.{part.sellingPrice?.toFixed(2) || '0.00'}</td>

                {/* Commission Margin */}
                <td className="py-4 px-4 text-right font-bold text-green-600 text-sm">
                  Rs.{((part.sellingPrice || 0) - (part.purchasePrice || 0)).toFixed(2)}
                </td>

                {/* Quantity */}
                <td className="py-4 px-4 text-right font-bold text-lg">
                  {part.stock}
                </td>

                {/* Status Badge */}
                <td className="py-4 px-4">
                  {part.stock === 0 ? (
                    <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold inline-block">
                      Unavailable
                    </span>
                  ) : part.stock <= part.reorderLevel ? (
                    <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold inline-block">
                      Low Quantity
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold inline-block">
                      Available
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-4 px-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setEditItem(part);
                        setModalType('part');
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Material"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePart(part.id)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                      title="Delete Part"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Empty State */}
            {filteredMaterials.length === 0 && (
              <tr>
                <td colSpan="10" className="py-12 text-center text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-semibold">No materials found</p>
                  <p className="text-sm mt-1">
                    {searchTerm || filterCategory !== 'all' || filterQuantity !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add your first part to get started!'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========== INVENTORY SUMMARY ========== */}
      {filteredMaterials.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-semibold">Total Items</p>
            <p className="text-2xl font-bold text-blue-700">{filteredMaterials.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-semibold">Total Units</p>
            <p className="text-2xl font-bold text-green-700">
              {filteredMaterials.reduce((sum, p) => sum + p.stock, 0)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-semibold">Purchase Value</p>
            <p className="text-2xl font-bold text-purple-700">
              Rs.{filteredMaterials.reduce((sum, p) => sum + (p.stock * (p.purchasePrice || 0)), 0).toFixed(0)}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-semibold">Selling Value</p>
            <p className="text-2xl font-bold text-orange-700">
              Rs.{filteredMaterials.reduce((sum, p) => sum + (p.stock * (p.sellingPrice || 0)), 0).toFixed(0)}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ============================================
// MODULE 9: Sales View Component
// ============================================
// Replace the placeholder "Sales View" section in Module 6

// Add this component AFTER the InventoryView component
// ============================================
// UPDATED SalesView Component with Delete Functionality
// ============================================
// Replace your existing SalesView component with this

const SalesView = ({
  sales,
  totalRevenue,
  totalCommission,
  todayRevenue,
  todayCommission,
  handleExportSales,
  setModalType,
  setShowModal,
  setShowReceipt,
  setLastSale,
  handleDeleteSale  //  ADD THIS PROP
}) => {
  const todaySales = sales.filter(s => s.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-4">
      <div className="soft-card rounded-2xl p-6">

        {/* ========== HEADER WITH ACTIONS ========== */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Accounts for Selling Material</h2>
            <p className="text-sm text-gray-500 mt-1">
              Total: {sales.length} sales | Today: {todaySales.length} sales
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportSales}
              className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-semibold shadow-md"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => {
                setModalType('sale');
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold shadow-md"
            >
              <Plus className="w-4 h-4" />
              New Material Sale
            </button>
          </div>
        </div>

        {/* ========== SALES STATISTICS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-l-4 border-green-500">
            <p className="text-sm text-green-700 font-semibold">Total Deals</p>
            <p className="text-3xl font-bold text-green-800 mt-1">{sales.length}</p>
            <p className="text-xs text-green-600 mt-1">All time</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-l-4 border-blue-500">
            <p className="text-sm text-blue-700 font-semibold">Total Cash Book Amount</p>
            <p className="text-3xl font-bold text-blue-800 mt-1">Rs.{totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-blue-600 mt-1">All time</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border-l-4 border-purple-500">
            <p className="text-sm text-purple-700 font-semibold">Total Commission</p>
            <p className="text-3xl font-bold text-purple-800 mt-1">Rs.{totalCommission.toFixed(2)}</p>
            <p className="text-xs text-purple-600 mt-1">
              Margin: {totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100).toFixed(1) : '0'}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border-l-4 border-orange-500">
            <p className="text-sm text-orange-700 font-semibold">Today's Deals</p>
            <p className="text-3xl font-bold text-orange-800 mt-1">{todaySales.length}</p>
            <p className="text-xs text-orange-600 mt-1">
              Cash Book Deposit / Credit Amount: Rs.{todayRevenue.toFixed(0)} | Commission: Rs.{todayCommission.toFixed(0)}
            </p>
          </div>
        </div>

        {/* ========== SALES TABLE ========== */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Date & Time</th>
                <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Receipt #</th>
                <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Part</th>
                <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Party</th>
                <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Handled By</th>
                <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Qty</th>
                <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Price</th>
                <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Total</th>
                <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Commission</th>
                <th className="text-center py-4 px-4 text-gray-700 font-bold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice().reverse().map((sale) => {
                const isToday = sale.date === new Date().toISOString().split('T')[0];
                return (
                  <tr
                    key={sale.id}
                    className={`border-b border-gray-100 hover:bg-blue-50 transition ${isToday ? 'bg-green-50' : ''}`}
                  >
                    {/* Date & Time */}
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium">{sale.date}</div>
                      <div className="text-xs text-gray-500">{sale.time}</div>
                    </td>

                    {/* Receipt Number */}
                    <td className="py-4 px-4 font-mono text-xs text-gray-600">
                      #{sale.id.slice(-8)}
                    </td>

                    {/* Part Details */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-sm">{sale.partName}</div>
                      <div className="text-xs text-gray-500">{sale.partNumber}</div>
                    </td>

                    {/* Party */}
                    <td className="py-4 px-4 text-sm">{sale.customer}</td>

                    {/* Handled By */}
                    <td className="py-4 px-4 text-sm text-gray-600">{sale.soldBy}</td>

                    {/* Quantity */}
                    <td className="py-4 px-4 text-right font-semibold text-sm">{sale.quantity}</td>

                    {/* Unit Price */}
                    <td className="py-4 px-4 text-right text-sm">
                      Rs.{sale.sellingPrice?.toFixed(2) || '0.00'}
                    </td>

                    {/* Total Deposit / Credit */}
                    <td className="py-4 px-4 text-right font-bold text-blue-600 text-sm">
                      Rs.{sale.total?.toFixed(2) || '0.00'}
                    </td>

                    {/* Commission */}
                    <td className="py-4 px-4 text-right font-bold text-green-600 text-sm">
                      Rs.{sale.profit?.toFixed(2) || '0.00'}
                    </td>

                    {/* Actions - Receipt & Delete Buttons */}
                    <td className="py-4 px-4">
                      <div className="flex justify-center gap-2">
                        {/* Receipt Button */}
                        <button
                          onClick={() => {
                            setLastSale(sale);
                            setShowReceipt(true);
                          }}
                          className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded-lg transition"
                          title="View Receipt"
                        >
                          <Receipt className="w-5 h-5" />
                        </button>

                        {/* Delete Button - NEW! */}
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                          title="Delete Sale"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty State */}
              {sales.length === 0 && (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-400">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-semibold">No sales recorded yet</p>
                    <p className="text-sm mt-1">Click "New Material Sale" to record your first sale!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ========== SALES SUMMARY ========== */}
        {sales.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border-2 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600 font-semibold">Average Sale</p>
                <p className="text-lg font-bold text-gray-800">
                  Rs.{(totalRevenue / sales.length).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Average Commission</p>
                <p className="text-lg font-bold text-green-600">
                  Rs.{(totalCommission / sales.length).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Total Items Sold</p>
                <p className="text-lg font-bold text-gray-800">
                  {sales.reduce((sum, s) => sum + s.quantity, 0)} units
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Commission Margin</p>
                <p className="text-lg font-bold text-purple-600">
                  {totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100).toFixed(1) : '0'}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Best Day</p>
                <p className="text-lg font-bold text-blue-600">
                  {(() => {
                    const salesByDate = {};
                    sales.forEach(s => {
                      salesByDate[s.date] = (salesByDate[s.date] || 0) + 1;
                    });
                    const best = Object.entries(salesByDate).sort((a, b) => b[1] - a[1])[0];
                    return best ? `${best[1]} sales` : 'N/A';
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========== TOP SALESPERSON ========== */}
        {sales.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const salesByPerson = {};
                sales.forEach(s => {
                  if (!salesByPerson[s.soldBy]) {
                    salesByPerson[s.soldBy] = { count: 0, revenue: 0, profit: 0 };
                  }
                  salesByPerson[s.soldBy].count += 1;
                  salesByPerson[s.soldBy].revenue += s.total;
                  salesByPerson[s.soldBy].profit += s.profit;
                });

                return Object.entries(salesByPerson)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([person, data]) => (
                    <div key={person} className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                          {person.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{person}</p>
                          <p className="text-xs text-gray-600">{data.count} sales</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cash Book Deposit / Credit Amount:</span>
                          <span className="font-bold text-blue-700">Rs.{data.revenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commission:</span>
                          <span className="font-bold text-green-700">Rs.{data.profit.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MODULE 10: Commission Analysis View Component
// ============================================
// Replace the placeholder "Commission Analysis View" section in Module 6

// Add this component AFTER the SalesView component
const ProfitView = ({
  sales,
  parts,
  totalCommission,
  totalRevenue,
  potentialCommission
}) => {
  const profitMargin = totalRevenue > 0 ? (totalCommission / totalRevenue * 100) : 0;

  // Calculate monthly sales data
  const monthlySales = {};
  sales.forEach(sale => {
    const month = sale.date.substring(0, 7); // YYYY-MM format
    if (!monthlySales[month]) {
      monthlySales[month] = { revenue: 0, profit: 0, count: 0 };
    }
    monthlySales[month].revenue += sale.total;
    monthlySales[month].profit += sale.profit;
    monthlySales[month].count += 1;
  });

  // Calculate top profitable parts
  const topCommissionableMaterials = (() => {
    const partCommission = {};
    sales.forEach(sale => {
      if (!partCommission[sale.partName]) {
        partCommission[sale.partName] = { profit: 0, revenue: 0, quantity: 0 };
      }
      partCommission[sale.partName].profit += sale.profit;
      partCommission[sale.partName].revenue += sale.total;
      partCommission[sale.partName].quantity += sale.quantity;
    });
    return Object.entries(partCommission)
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 10);
  })();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Commission Analysis</h2>

      {/* ========== SUMMARY CARDS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="soft-card p-6 rounded-2xl border-l-4 border-green-500 transform hover:scale-105 transition">
          <p className="text-gray-600 text-sm font-semibold">Total Commission Earned</p>
          <p className="text-4xl font-bold text-green-600 mt-2">Rs.{totalCommission.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">From {sales.length} sales</p>
        </div>

        <div className="soft-card p-6 rounded-2xl border-l-4 border-blue-500 transform hover:scale-105 transition">
          <p className="text-gray-600 text-sm font-semibold">Total Cash Book Amount</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">Rs.{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Gross sales amount</p>
        </div>

        <div className="soft-card p-6 rounded-2xl border-l-4 border-purple-500 transform hover:scale-105 transition">
          <p className="text-gray-600 text-sm font-semibold">Commission Margin</p>
          <p className="text-4xl font-bold text-purple-600 mt-2">{profitMargin.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">Average margin</p>
        </div>

        <div className="soft-card p-6 rounded-2xl border-l-4 border-orange-500 transform hover:scale-105 transition">
          <p className="text-gray-600 text-sm font-semibold">Potential Commission</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">Rs.{potentialCommission.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">From current stock</p>
        </div>
      </div>

      {/* ========== ADDITIONAL METRICS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
          <p className="text-sm text-green-700 font-semibold">Average Commission per Sale</p>
          <p className="text-3xl font-bold text-green-800 mt-2">
            Rs.{sales.length > 0 ? (totalCommission / sales.length).toFixed(2) : '0.00'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 font-semibold">Best Sale Commission</p>
          <p className="text-3xl font-bold text-blue-800 mt-2">
            Rs.{sales.length > 0 ? Math.max(...sales.map(s => s.profit)).toFixed(2) : '0.00'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
          <p className="text-sm text-purple-700 font-semibold">Total Material Cost</p>
          <p className="text-3xl font-bold text-purple-800 mt-2">
            Rs.{(totalRevenue - totalCommission).toFixed(2)}
          </p>
        </div>
      </div>

      {/* ========== MONTHLY PERFORMANCE TABLE ========== */}
      <div className="soft-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Month</th>
                <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Sales Count</th>
                <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Cash Book Amount</th>
                <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Commission</th>
                <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Margin</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(monthlySales)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([month, data]) => (
                  <tr key={month} className="border-b border-gray-100 hover:bg-blue-50 transition">
                    <td className="py-4 px-4 font-semibold">
                      {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">{data.count} sales</td>
                    <td className="py-4 px-4 text-right font-semibold">Rs.{data.revenue.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right font-bold text-green-600">Rs.{data.profit.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right font-bold text-purple-600">
                      {(data.profit / data.revenue * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              {Object.keys(monthlySales).length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    No sales data available for monthly analysis
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== TOP PROFITABLE PARTS ========== */}
      <div className="soft-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Top 10 Commission Materials</h3>
        <div className="space-y-3">
          {topCommissionableMaterials.map(([name, data], index) => (
            <div
              key={name}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{name}</p>
                  <p className="text-xs text-gray-500">
                    {data.quantity} units sold | Rs.{data.revenue.toFixed(2)} revenue
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">Rs.{data.profit.toFixed(2)}</p>
                <p className="text-xs text-gray-500">
                  {((data.profit / data.revenue) * 100).toFixed(1)}% margin
                </p>
              </div>
            </div>
          ))}
          {topCommissionableMaterials.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <TrendingUp className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p>No sales data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== PROFIT BY CATEGORY ========== */}
      {sales.length > 0 && (
        <div className="soft-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Commission by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const categoryCommission = {};
              sales.forEach(sale => {
                const part = parts.find(p => p.partNumber === sale.partNumber);
                if (part && part.category) {
                  if (!categoryCommission[part.category]) {
                    categoryCommission[part.category] = { profit: 0, revenue: 0 };
                  }
                  categoryCommission[part.category].profit += sale.profit;
                  categoryCommission[part.category].revenue += sale.total;
                }
              });

              return Object.entries(categoryCommission)
                .sort((a, b) => b[1].profit - a[1].profit)
                .map(([category, data]) => (
                  <div key={category} className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                    <p className="font-bold text-gray-800 mb-2">{category}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cash Book Deposit / Credit Amount:</span>
                        <span className="font-bold text-blue-700">Rs.{data.revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission:</span>
                        <span className="font-bold text-green-700">Rs.{data.profit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-bold text-purple-700">
                          {((data.profit / data.revenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}

      {/* ========== PROFIT INSIGHTS ========== */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <p className="font-semibold mb-2"> Average Daily Commission</p>
            <p className="text-2xl font-bold">
              Rs.{sales.length > 0 ? (totalCommission / [...new Set(sales.map(s => s.date))].length).toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <p className="font-semibold mb-2"> Highest Margin Item</p>
            <p className="text-xl font-bold">
              {(() => {
                if (topCommissionableMaterials.length === 0) return 'N/A';
                const highest = topCommissionableMaterials.reduce((max, [name, data]) => {
                  const margin = (data.profit / data.revenue) * 100;
                  return margin > max.margin ? { name, margin } : max;
                }, { name: '', margin: 0 });
                return `${highest.margin.toFixed(1)}%`;
              })()}
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <p className="font-semibold mb-2"> Total Items Sold</p>
            <p className="text-2xl font-bold">
              {sales.reduce((sum, s) => sum + s.quantity, 0)} units
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <p className="font-semibold mb-2"> Commission Growth</p>
            <p className="text-2xl font-bold">
              {(() => {
                const months = Object.keys(monthlySales).sort();
                if (months.length < 2) return 'N/A';
                const lastMonth = monthlySales[months[months.length - 1]].profit;
                const prevMonth = monthlySales[months[months.length - 2]].profit;
                const growth = ((lastMonth - prevMonth) / prevMonth * 100).toFixed(1);
                return `${growth > 0 ? '+' : ''}${growth}%`;
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MODULE 11: Parties View Component
// ============================================
// Replace the placeholder "Parties View" section in Module 6

// Add this component AFTER the ProfitView component
const SuppliersView = ({
  suppliers,
  parts,
  handleExportSuppliers,
  setModalType,
  setShowModal,
  setEditItem,
  handleDeleteSupplier
}) => (
  <div className="space-y-4">
    <div className="soft-card rounded-2xl p-6">

      {/* ========== HEADER WITH ACTIONS ========== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Party Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Total: {suppliers.length} suppliers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportSuppliers}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-semibold shadow-md"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              setModalType('supplier');
              setShowModal(true);
              setEditItem(null);
            }}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Party
          </button>
        </div>
      </div>

      {/* ========== SUPPLIERS GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(supplier => {
          const supplierMaterials = parts.filter(p => p.supplier === supplier.name);
          const supplierMaterialsValue = supplierMaterials.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);

          return (
            <div
              key={supplier.id}
              className="border-2 border-gray-100 rounded-xl p-5 hover:shadow-xl transition bg-gradient-to-br from-white to-blue-50 transform hover:scale-105"
            >
              {/* Party Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {supplier.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{supplier.name}</h3>
                    <p className="text-xs text-gray-500">Party ID: {supplier.id.slice(-6)}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditItem(supplier);
                      setModalType('supplier');
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Party"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                    title="Delete Party"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Party Details */}
              <div className="space-y-2 text-sm mb-4">
                {supplier.contact && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600"><strong>Contact:</strong> {supplier.contact}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600"><strong></strong> {supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600"><strong></strong> {supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600"><strong></strong> {supplier.address}</span>
                  </div>
                )}
              </div>

              {/* Party Stats */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">Materials Supplied</p>
                    <p className="text-2xl font-bold text-blue-700">{supplierMaterials.length}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">Quantity Value</p>
                    <p className="text-lg font-bold text-green-700">
                      Rs.{supplierMaterialsValue.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {suppliers.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400">
            <Users className="w-20 h-20 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-semibold mb-2">No parties added yet</p>
            <p className="text-sm">Click "Add Party" to add your first party</p>
          </div>
        )}
      </div>

      {/* ========== SUPPLIER SUMMARY ========== */}
      {suppliers.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Party Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 font-semibold">Total Parties</p>
              <p className="text-3xl font-bold text-blue-700">{suppliers.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 font-semibold">Total Materials</p>
              <p className="text-3xl font-bold text-green-700">
                {suppliers.reduce((sum, s) => sum + parts.filter(p => p.supplier === s.name).length, 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 font-semibold">Avg Materials/Party</p>
              <p className="text-3xl font-bold text-purple-700">
                {(suppliers.reduce((sum, s) => sum + parts.filter(p => p.supplier === s.name).length, 0) / suppliers.length).toFixed(1)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 font-semibold">Total Quantity Value</p>
              <p className="text-2xl font-bold text-orange-700">
                Rs.{suppliers.reduce((sum, s) => {
                  const supplierMaterials = parts.filter(p => p.supplier === s.name);
                  return sum + supplierMaterials.reduce((pSum, p) => pSum + (p.stock * p.purchasePrice), 0);
                }, 0).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== TOP SUPPLIERS ========== */}
      {suppliers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Parties by Materials Count</h3>
          <div className="space-y-3">
            {suppliers
              .map(s => ({
                ...s,
                partsCount: parts.filter(p => p.supplier === s.name).length,
                stockValue: parts.filter(p => p.supplier === s.name).reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0)
              }))
              .sort((a, b) => b.partsCount - a.partsCount)
              .slice(0, 5)
              .map((supplier, index) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{supplier.name}</p>
                      <p className="text-xs text-gray-500">
                        {supplier.phone || 'No phone'} | {supplier.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-700">{supplier.partsCount}</p>
                    <p className="text-xs text-gray-600">materials (Rs.{supplier.stockValue.toFixed(0)})</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

// ============================================
// MODULE 12: Books & Reports View Component (FINAL MODULE!)
// ============================================
// Replace the placeholder "Books & Reports View" section in Module 6

// Add this component AFTER the SuppliersView component
const ReportsView = ({
  parts,
  sales,
  categories,
  lowQuantityMaterials,
  outOfQuantityMaterials,
  totalValue,
  totalRevenue,
  totalCommission
}) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800">Books & Reports & Analytics</h2>

    {/* ========== SUMMARY CARDS ========== */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="soft-card p-6 rounded-2xl border-l-4 border-blue-500">
        <p className="text-gray-600 text-sm font-semibold">Total Materials</p>
        <p className="text-4xl font-bold text-gray-800 mt-2">{parts.length}</p>
        <p className="text-xs text-gray-500 mt-1">Unique items</p>
      </div>

      <div className="soft-card p-6 rounded-2xl border-l-4 border-green-500">
        <p className="text-gray-600 text-sm font-semibold">Total Material Value</p>
        <p className="text-4xl font-bold text-gray-800 mt-2">Rs.{totalValue.toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-1">Purchase price</p>
      </div>

      <div className="soft-card p-6 rounded-2xl border-l-4 border-purple-500">
        <p className="text-gray-600 text-sm font-semibold">Total Deals</p>
        <p className="text-4xl font-bold text-gray-800 mt-2">{sales.length}</p>
        <p className="text-xs text-gray-500 mt-1">Transactions</p>
      </div>

      <div className="soft-card p-6 rounded-2xl border-l-4 border-orange-500">
        <p className="text-gray-600 text-sm font-semibold">Total Cash Book Amount</p>
        <p className="text-4xl font-bold text-gray-800 mt-2">Rs.{totalRevenue.toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-1">All time</p>
      </div>
    </div>

    {/* ========== LOW STOCK REPORT ========== */}
    <div className="soft-card rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Low Quantity Report</h3>
        <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold">
          {lowQuantityMaterials.length} items
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Material Code</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Name</th>
              <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Current Quantity</th>
              <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Minimum Quantity Alert</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Party</th>
            </tr>
          </thead>
          <tbody>
            {lowQuantityMaterials.map(part => (
              <tr key={part.id} className="border-b border-gray-100 hover:bg-orange-50 transition">
                <td className="py-4 px-4 font-semibold text-blue-600">{part.partNumber}</td>
                <td className="py-4 px-4 font-medium">{part.name}</td>
                <td className="py-4 px-4 text-right text-orange-600 font-bold text-lg">{part.stock}</td>
                <td className="py-4 px-4 text-right">{part.reorderLevel}</td>
                <td className="py-4 px-4">{part.supplier || 'N/A'}</td>
              </tr>
            ))}
            {lowQuantityMaterials.length === 0 && (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>All parts are well stocked! </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* ========== OUT OF STOCK REPORT ========== */}
    <div className="soft-card rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Unavailable Report</h3>
        <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
          {outOfQuantityMaterials.length} items
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Material Code</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Name</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Category</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Party</th>
            </tr>
          </thead>
          <tbody>
            {outOfQuantityMaterials.map(part => (
              <tr key={part.id} className="border-b border-gray-100 hover:bg-red-50 transition">
                <td className="py-4 px-4 font-semibold text-blue-600">{part.partNumber}</td>
                <td className="py-4 px-4 font-medium">{part.name}</td>
                <td className="py-4 px-4">{part.category}</td>
                <td className="py-4 px-4">{part.supplier || 'N/A'}</td>
              </tr>
            ))}
            {outOfQuantityMaterials.length === 0 && (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No unavailable items! </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* ========== CATEGORY DISTRIBUTION ========== */}
    <div className="soft-card rounded-2xl p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Material Book by Category</h3>
      <div className="space-y-4">
        {categories.map(cat => {
          const catMaterials = parts.filter(p => p.category === cat.name);
          const catValue = catMaterials.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
          const percentage = parts.length > 0 ? (catMaterials.length / parts.length * 100) : 0;

          return (
            <div key={cat.id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-700">{cat.name}</span>
                <span className="text-sm text-gray-500 font-semibold">
                  {catMaterials.length} parts | Rs.{catValue.toFixed(2)} | {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* ========== TOP SELLING PARTS ========== */}
    <div className="soft-card rounded-2xl p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Top 10 Selling Materials</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Rank</th>
              <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm">Material Name</th>
              <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Qty Sold</th>
              <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Cash Book Amount</th>
              <th className="text-right py-4 px-4 text-gray-700 font-bold text-sm">Commission</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const partSales = {};
              sales.forEach(sale => {
                if (!partSales[sale.partName]) {
                  partSales[sale.partName] = { qty: 0, revenue: 0, profit: 0 };
                }
                partSales[sale.partName].qty += sale.quantity;
                partSales[sale.partName].revenue += sale.total;
                partSales[sale.partName].profit += sale.profit;
              });

              return Object.entries(partSales)
                .sort((a, b) => b[1].qty - a[1].qty)
                .slice(0, 10)
                .map(([name, data], index) => (
                  <tr key={name} className="border-b border-gray-100 hover:bg-blue-50 transition">
                    <td className="py-4 px-4">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium">{name}</td>
                    <td className="py-4 px-4 text-right font-bold text-lg">{data.qty}</td>
                    <td className="py-4 px-4 text-right font-bold text-blue-600">Rs.{data.revenue.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right font-bold text-green-600">Rs.{data.profit.toFixed(2)}</td>
                  </tr>
                ));
            })()}
            {sales.length === 0 && (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No sales data available</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* ========== BUSINESS HEALTH INDICATORS ========== */}
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6" />
        Business Health Indicators
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-semibold mb-2"> Quantity Health</p>
          <div className="text-3xl font-bold mb-1">
            {parts.length > 0
              ? Math.round(((parts.length - outOfQuantityMaterials.length) / parts.length) * 100)
              : 0}%
          </div>
          <p className="text-xs">
            {outOfQuantityMaterials.length} unavailable, {lowQuantityMaterials.length} low quantity
          </p>
        </div>

        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-semibold mb-2"> Commission Margin</p>
          <div className="text-3xl font-bold mb-1">
            {totalRevenue > 0
              ? ((totalCommission / totalRevenue) * 100).toFixed(1)
              : 0}%
          </div>
          <p className="text-xs">
            Average across all sales
          </p>
        </div>

        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-semibold mb-2"> Material Book Turnover</p>
          <div className="text-3xl font-bold mb-1">
            {parts.length > 0
              ? (sales.reduce((sum, s) => sum + s.quantity, 0) / parts.reduce((sum, p) => sum + p.stock, 1)).toFixed(2)
              : '0.00'}
          </div>
          <p className="text-xs">
            Sales / Available stock
          </p>
        </div>
      </div>
    </div>

    {/* ========== QUICK STATISTICS ========== */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="soft-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Statistics</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-gray-700">Total Units in Quantity</span>
            <span className="font-bold text-blue-700 text-xl">
              {parts.reduce((sum, p) => sum + p.stock, 0)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="font-medium text-gray-700">Total Units Sold</span>
            <span className="font-bold text-green-700 text-xl">
              {sales.reduce((sum, s) => sum + s.quantity, 0)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
            <span className="font-medium text-gray-700">Average Sale Value</span>
            <span className="font-bold text-purple-700 text-xl">
              Rs.{sales.length > 0 ? (totalRevenue / sales.length).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
            <span className="font-medium text-gray-700">Total Commission Earned</span>
            <span className="font-bold text-orange-700 text-xl">
              Rs.{totalCommission.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="soft-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-semibold text-gray-800">Last Part Added</p>
              <p className="text-sm text-gray-500">
                {parts.length > 0 ? parts[parts.length - 1].name : 'No parts yet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <ShoppingCart className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-semibold text-gray-800">Last Sale</p>
              <p className="text-sm text-gray-500">
                {sales.length > 0 ? `${sales[sales.length - 1].partName} to ${sales[sales.length - 1].customer}` : 'No sales yet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-purple-500" />
            <div>
              <p className="font-semibold text-gray-800">Best Sale</p>
              <p className="text-sm text-gray-500">
                {sales.length > 0
                  ? `Rs.${Math.max(...sales.map(s => s.total)).toFixed(2)}`
                  : 'No sales yet'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CommissionShopManagement = () => {
  // ========== STATE MANAGEMENT ==========
  const [currentView, setCurrentView] = useState('dashboard');
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([
    { id: '1', name: 'Engine Materials' },
    { id: '2', name: 'Transmission' },
    { id: '3', name: 'Brakes' },
    { id: '4', name: 'Suspension' },
    { id: '5', name: 'Electrical' },
    { id: '6', name: 'Body Materials' }
  ]);
  const [suppliers, setSuppliers] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterQuantity, setFilterQuantity] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [lastSale, setLastSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [user, setUser] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useDeviceDetection();
  const syncMessage = (result, message) => result?.pendingSync
    ? `${message}\n\nSaved on this device. It will sync automatically when the internet returns.`
    : message;

  // ========== INDEXEDDB FUNCTIONS ==========
  // ========== SUPABASE DATA LOADING ==========
const loadFromSupabase = async () => {
  try {
    console.log(' Loading data from Supabase...');

    const [loadedCategories, loadedParts, loadedSales, loadedSuppliers] = await Promise.all([
      fetchCategories(),
      fetchParts(),
      fetchSales(),
      fetchSuppliers()
    ]);

    if (loadedCategories.length) setCategories(loadedCategories);
    if (loadedParts.length) setParts(loadedParts);
    if (loadedSales.length) setSales(loadedSales);
    if (loadedSuppliers.length) setSuppliers(loadedSuppliers);

    console.log(' Data loaded from Supabase!');
    console.log(` Materials: ${loadedParts.length},  Sales: ${loadedSales.length},  Parties: ${loadedSuppliers.length}`);
  } catch (error) {
    console.error(' Error loading from Supabase:', error);
    alert('Failed to load data from cloud. Please check your internet connection and refresh.');
  }
};
  // ========== USEEFFECTS ==========
  useEffect(() => {
    const refreshAfterSync = () => loadFromSupabase();

    initialiseOfflineSync();
    const initialLoad = window.setTimeout(loadFromSupabase, 0);
    window.addEventListener('commission-shop-sync-complete', refreshAfterSync);

    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener('commission-shop-sync-complete', refreshAfterSync);
    };
  }, []);

// No more auto-save useEffect needed! Supabase saves immediately on each action

  // ========== FIREBASE AUTH LISTENER ==========
  useEffect(() => {
    console.log(' Setting up Firebase auth listener...');

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log(' Auth state changed:', currentUser?.email || 'No user');

      if (currentUser) {
        console.log(' User is logged in:', currentUser.email);
        setUser(currentUser);
      } else {
        console.log(' No user logged in');
        setUser(null);
      }

      setLoading(false);
      console.log(' Loading set to false');
    });

    return () => {
      console.log(' Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // ========== SHOW LOADING SCREEN ==========
  if (loading) {
    console.log(' Currently in loading state');
    return (
      <div className="app-shell min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 shadow-2xl shadow-slate-950/20">
            <Package className="w-9 h-9 text-emerald-300 animate-pulse" />
          </div>
          <p className="text-slate-700 font-semibold text-lg">Loading...</p>
          <p className="text-slate-400 text-sm mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // ========== SHOW LOGIN IF NO USER ==========
  if (!user) {
    console.log(' No user, showing login screen');
    return (
      <div className="app-shell min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 shadow-2xl shadow-slate-950/20">
              <Package className="w-9 h-9 text-emerald-300" />
            </div>
            <h1 className="text-3xl font-bold text-slate-950">Commission Shop Management System</h1>
            <p className="text-slate-600 mt-2">Authorized Access Only</p>
            <p className="text-sm text-slate-500 mt-1">Contact admin for account creation</p>
          </div>

          {/* Only Login - No Signup */}
          <Login setUser={setUser} />

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
            <p className="text-sm text-blue-900 text-center">
              <strong>Need an account?</strong><br />
              Contact: Shop Admin (0300-0000000)
            </p>
          </div>
        </div>
      </div>
    );
  }

  console.log(' User authenticated, rendering main app for:', user.email);

  // ========== STATISTICS CALCULATIONS ==========
  const filteredMaterials = parts.filter(part => {
    const matchesSearch = part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || part.category === filterCategory;
    const matchesQuantity = filterQuantity === 'all' ||
                        (filterQuantity === 'low' && part.stock <= part.reorderLevel) ||
                        (filterQuantity === 'out' && part.stock === 0);
    return matchesSearch && matchesCategory && matchesQuantity;
  });

  const lowQuantityMaterials = parts.filter(p => p.stock <= p.reorderLevel && p.stock > 0);
  const outOfQuantityMaterials = parts.filter(p => p.stock === 0);
  const totalValue = parts.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
  const totalSellingValue = parts.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
  const potentialCommission = totalSellingValue - totalValue;
  const todaySales = sales.filter(s => s.date === new Date().toISOString().split('T')[0]);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayCommission = todaySales.reduce((sum, s) => sum + s.profit, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCommission = sales.reduce((sum, s) => sum + s.profit, 0);

  // Continue with Module 2 for Excel Import/Export functions...
  // ============================================
// MODULE 2: Excel Import/Export Functions
// ============================================
// Add these functions inside your CommissionShopManagement component
// (after the statistics calculations section)

  // ========== EXCEL IMPORT/EXPORT FUNCTIONS ==========

  // NEW: Function to save directly to your specified folder
  const saveExcelToDesktop = async (workbook, filename) => {
    const XLSX = await loadXlsx();
    // Generate the Excel file as a blob
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    // Create download link with suggested filename
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename; // Browser will ask to save/replace

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show message to user
    alert(`File ready to save!\n\nSave to: C:\\Users\\qossa\\Desktop\\Shop Data\\${filename}\n\nIf file exists, browser will ask if you want to replace it.`);
  };

  // Import from Excel
  const handleImportExcel = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await loadXlsx();
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        if (type === 'parts') {
          const imported = data.map((row, idx) => ({
            id: row.id || String(Date.now() + idx),
            partNumber: row.partNumber || row['Material Code'] || '',
            name: row.name || row['Material Name'] || '',
            category: row.category || row['Category'] || '',
            brand: row.brand || row['Grade'] || '',
            purchasePrice: parseFloat(row.purchasePrice || row['Purchase Price'] || 0),
            sellingPrice: parseFloat(row.sellingPrice || row['Selling Price'] || row['Price'] || 0),
            stock: parseInt(row.stock || row['Available Quantity'] || 0),
            reorderLevel: parseInt(row.reorderLevel || row['Minimum Quantity Alert'] || 10),
            supplier: row.supplier || row['Party'] || '',
            location: row.location || row['Location'] || ''
          }));
          setParts([...parts, ...imported]);
          alert(`Imported ${imported.length} parts successfully!`);
        }
        else if (type === 'suppliers') {
          const imported = data.map((row, idx) => ({
            id: row.id || String(Date.now() + idx),
            name: row.name || row['Party Name'] || '',
            contact: row.contact || row['Contact Person'] || '',
            phone: row.phone || row['Phone'] || '',
            email: row.email || row['Email'] || '',
            address: row.address || row['Address'] || ''
          }));
          setSuppliers([...suppliers, ...imported]);
          alert(`Imported ${imported.length} suppliers successfully!`);
        }
        else if (type === 'sales') {
          const imported = data.map((row, idx) => ({
            id: row.id || String(Date.now() + idx),
            date: row.date || row['Date'] || new Date().toISOString().split('T')[0],
            time: row.time || row['Time'] || new Date().toLocaleTimeString(),
            partNumber: row.partNumber || row['Material Code'] || '',
            partName: row.partName || row['Material Name'] || '',
            quantity: parseInt(row.quantity || row['Quantity'] || 0),
            purchasePrice: parseFloat(row.purchasePrice || row['Purchase Price'] || 0),
            sellingPrice: parseFloat(row.sellingPrice || row['Selling Price'] || 0),
            total: parseFloat(row.total || row['Total'] || 0),
            profit: parseFloat(row.profit || row['Commission'] || 0),
            customer: row.customer || row['Party'] || '',
            soldBy: row.soldBy || row['Handled By'] || ''
          }));
          setSales([...sales, ...imported]);
          alert(`Imported ${imported.length} sales successfully!`);
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing file. Please check the file format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Export Complete Database
  const handleExportComplete = async () => {
    const XLSX = await loadXlsx();
    const wb = XLSX.utils.book_new();

    // Material Book Sheet
    const partsData = parts.map(p => ({
      'Material Code': p.partNumber,
      'Material Name': p.name,
      'Category': p.category,
      'Grade': p.brand,
      'Purchase Price': p.purchasePrice,
      'Selling Price': p.sellingPrice,
      'Commission Per Unit': p.sellingPrice - p.purchasePrice,
      'Available Quantity': p.stock,
      'Minimum Quantity Alert': p.reorderLevel,
      'Party': p.supplier,
      'Location': p.location
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partsData), 'Material Book');

    // Parties Sheet
    const suppliersData = suppliers.map(s => ({
      'Party Name': s.name,
      'Contact Person': s.contact,
      'Phone': s.phone,
      'Email': s.email,
      'Address': s.address
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppliersData), 'Parties');

    // Sales Sheet
    const salesData = sales.map(s => ({
      'Date': s.date,
      'Time': s.time,
      'Receipt #': s.id,
      'Material Code': s.partNumber,
      'Material Name': s.partName,
      'Quantity': s.quantity,
      'Purchase Price': s.purchasePrice,
      'Selling Price': s.sellingPrice,
      'Total Deposit / Credit': s.total,
      'Commission': s.profit,
      'Party': s.customer,
      'Handled By': s.soldBy
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesData), 'Sales');

    // Summary Sheet
    const summaryData = [
      { 'Metric': 'Total Materials', 'Value': parts.length },
      { 'Metric': 'Total Material Value (Purchase)', 'Value': `Rs.${totalValue.toFixed(2)}` },
      { 'Metric': 'Total Material Value (Selling)', 'Value': `Rs.${totalSellingValue.toFixed(2)}` },
      { 'Metric': 'Potential Commission', 'Value': `Rs.${potentialCommission.toFixed(2)}` },
      { 'Metric': 'Total Deals Count', 'Value': sales.length },
      { 'Metric': 'Total Cash Book Amount', 'Value': `Rs.${totalRevenue.toFixed(2)}` },
      { 'Metric': 'Total Commission Earned', 'Value': `Rs.${totalCommission.toFixed(2)}` },
      { 'Metric': 'Today Sales', 'Value': todaySales.length },
      { 'Metric': 'Today Cash Book Amount', 'Value': `Rs.${todayRevenue.toFixed(2)}` },
      { 'Metric': 'Today Commission', 'Value': `Rs.${todayCommission.toFixed(2)}` },
      { 'Metric': 'Low Quantity Items', 'Value': lowQuantityMaterials.length },
      { 'Metric': 'Unavailable Items', 'Value': outOfQuantityMaterials.length }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');

    // Save with date in filename
    const date = new Date().toISOString().split('T')[0];
    saveExcelToDesktop(wb, `Commission_Shop_Complete_${date}.xlsx`);
  };

  // Export Material Book Only
  const handleExportInventory = async () => {
    const XLSX = await loadXlsx();
    const wb = XLSX.utils.book_new();
    const data = parts.map(p => ({
      'Material Code': p.partNumber,
      'Material Name': p.name,
      'Category': p.category,
      'Grade': p.brand,
      'Purchase Price': p.purchasePrice,
      'Selling Price': p.sellingPrice,
      'Commission Per Unit': p.sellingPrice - p.purchasePrice,
      'Available Quantity': p.stock,
      'Quantity Value (Purchase)': p.stock * p.purchasePrice,
      'Quantity Value (Selling)': p.stock * p.sellingPrice,
      'Minimum Quantity Alert': p.reorderLevel,
      'Party': p.supplier,
      'Location': p.location
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Material Book');

    const date = new Date().toISOString().split('T')[0];
    saveExcelToDesktop(wb, `Commission_Material_Book_${date}.xlsx`);
  };

  // Export Selling Accounts Only
  const handleExportSales = async () => {
    const XLSX = await loadXlsx();
    const wb = XLSX.utils.book_new();
    const data = sales.map(s => ({
      'Date': s.date,
      'Time': s.time,
      'Receipt #': s.id,
      'Material Code': s.partNumber,
      'Material Name': s.partName,
      'Quantity': s.quantity,
      'Purchase Price': s.purchasePrice,
      'Selling Price': s.sellingPrice,
      'Total Deposit / Credit': s.total,
      'Commission': s.profit,
      'Party': s.customer,
      'Handled By': s.soldBy
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Sales');

    const date = new Date().toISOString().split('T')[0];
    saveExcelToDesktop(wb, `Commission_Selling_Accounts_${date}.xlsx`);
  };

  // Export Parties Only
  const handleExportSuppliers = async () => {
    const XLSX = await loadXlsx();
    const wb = XLSX.utils.book_new();
    const data = suppliers.map(s => ({
      'Party Name': s.name,
      'Contact Person': s.contact,
      'Phone': s.phone,
      'Email': s.email,
      'Address': s.address,
      'Materials Count': parts.filter(p => p.supplier === s.name).length
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Parties');

    const date = new Date().toISOString().split('T')[0];
    saveExcelToDesktop(wb, `Commission_Parties_${date}.xlsx`);
  };

  // Continue with Module 3 for CRUD operations...
  // ============================================
// MODULE 3: CRUD Operations
// ============================================
// Add these functions inside your CommissionShopManagement component
// (after the Excel import/export functions)

  // ========== PARTS CRUD OPERATIONS ==========

  const handleAddPart = async (formData) => {
  try {
    console.log(' Attempting to add part with data:', formData);
    const newPart = await addPartToDb(formData);
    console.log(' Part added successfully:', newPart);
    setParts([...parts, newPart]);
    setShowModal(false);
    alert(syncMessage(newPart, 'Part added successfully!'));
  } catch (error) {
    console.error(' Complete error object:', error);
    console.error(' Error message:', error.message);
    console.error(' Error code:', error.code);
    console.error(' Error details:', error.details);
    console.error(' Error hint:', error.hint);
    alert(`Failed to add part: ${error.message || 'Unknown error. Check console for details.'}`);
  }
};

const handleEditPart = async (formData) => {
  try {
    const updatedPart = await updatePartInDb(editItem.id, formData);
    setParts(parts.map(p => p.id === editItem.id ? updatedPart : p));
    setShowModal(false);
    setEditItem(null);
    alert(syncMessage(updatedPart, 'Part updated successfully!'));
  } catch (error) {
    console.error('Error updating part:', error);
    alert('Failed to update part. Please try again.');
  }
};

const handleDeletePart = async (id) => {
  if (window.confirm('Are you sure you want to delete this part?\n\nThis action cannot be undone.')) {
    try {
      const result = await deletePartFromDb(id);
      setParts(parts.filter(p => p.id !== id));
      alert(syncMessage(result, 'Part deleted successfully!'));
    } catch (error) {
      console.error('Error deleting part:', error);
      alert('Failed to delete part. Please try again.');
    }
  }
};

  // ========== SALES CRUD OPERATIONS ==========
  const handleAddSale = async (formData) => {
  // Check if this is multi-item sale (new format) or single-item (old format)
  const isMultiItem = formData.items && Array.isArray(formData.items);

  if (isMultiItem) {
    // MULTI-ITEM SALE LOGIC
    try {
      console.log(' Processing multi-item sale...');

      // Validate all items have sufficient stock
      for (const item of formData.items) {
        const part = parts.find(p => p.partNumber === item.partNumber);
        if (!part) {
          alert(`Error: Part ${item.partNumber} not found!`);
          return;
        }
        if (part.stock < item.quantity) {
          alert(`Insufficient quantity for ${part.name}!\nAvailable: ${part.stock}, Requested: ${item.quantity}`);
          return;
        }
      }

      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Create individual sale records for each item
      const newSales = [];
      const updatedParts = [];

      for (const item of formData.items) {
        const part = parts.find(p => p.partNumber === item.partNumber);

        // Calculate totals
        const total = item.quantity * item.sellingPrice;
        const profit = (item.sellingPrice - item.purchasePrice) * item.quantity;

        // Create sale record
        const saleData = {
          date,
          time,
          partNumber: item.partNumber,
          partName: item.partName,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          total,
          profit,
          customer: formData.customer,
          soldBy: formData.soldBy
        };

        // Update inventory
        const newQuantity = part.stock - item.quantity;
        const updatedPartData = {
          partNumber: part.partNumber,
          name: part.name,
          category: part.category,
          brand: part.brand || '',
          purchasePrice: parseFloat(part.purchasePrice),
          sellingPrice: parseFloat(part.sellingPrice),
          stock: parseInt(newQuantity),
          reorderLevel: parseInt(part.reorderLevel),
          supplier: part.supplier || '',
          location: part.location || ''
        };

        console.log(` Updating ${part.name}: ${part.stock}  ${newQuantity}`);
        const updatedPart = await updatePartInDb(part.id, updatedPartData);
        updatedParts.push({ oldId: part.id, newPart: updatedPart });

        console.log(` Recording sale for ${item.partName}...`);
        const newSale = await addSaleToDb(saleData);
        newSales.push(newSale);
      }

      // Update local state
      console.log(' Updating local state...');
      setParts(currentParts => {
        let updated = [...currentParts];
        updatedParts.forEach(({ oldId, newPart }) => {
          updated = updated.map(p => p.id === oldId ? newPart : p);
        });
        return updated;
      });

      setSales(currentSales => [...currentSales, ...newSales]);

      // Show receipt for the first item
      setLastSale(newSales[0]);
      setShowModal(false);
      setShowReceipt(true);

      console.log(` Multi-item sale completed! ${formData.items.length} items sold.`);
      alert(syncMessage(newSales.find((sale) => sale.pendingSync), `Sale recorded successfully!\n\n${formData.items.length} items sold to ${formData.customer}`));

    } catch (error) {
      console.error(' Multi-item sale failed:', error);
      alert(`Failed to record sale!\n\nError: ${error.message}`);
    }

  } else {
    // SINGLE-ITEM SALE LOGIC (keep your existing single-item code)
    const part = parts.find(p => p.partNumber === formData.partNumber);
    if (!part) {
      alert('Error: Part not found!');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (part.stock < quantity) {
      alert(`Insufficient quantity!\nAvailable: ${part.stock}\nRequested: ${quantity}`);
      return;
    }

    const sellingPrice = parseFloat(formData.sellingPrice || part.sellingPrice);
    const total = quantity * sellingPrice;
    const profit = (sellingPrice - part.purchasePrice) * quantity;

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const saleData = {
      date,
      time,
      partNumber: formData.partNumber,
      partName: part.name,
      quantity,
      purchasePrice: part.purchasePrice,
      sellingPrice,
      total,
      profit,
      customer: formData.customer,
      soldBy: formData.soldBy
    };

    try {
      const newQuantity = part.stock - quantity;
      const updatedPartData = {
        partNumber: part.partNumber,
        name: part.name,
        category: part.category,
        brand: part.brand || '',
        purchasePrice: parseFloat(part.purchasePrice),
        sellingPrice: parseFloat(part.sellingPrice),
        stock: parseInt(newQuantity),
        reorderLevel: parseInt(part.reorderLevel),
        supplier: part.supplier || '',
        location: part.location || ''
      };

      const updatedPart = await updatePartInDb(part.id, updatedPartData);
      const newSale = await addSaleToDb(saleData);

      setParts(currentParts => currentParts.map(p => p.id === part.id ? updatedPart : p));
      setSales(currentSales => [...currentSales, newSale]);

      setLastSale(newSale);
      setShowModal(false);
      setShowReceipt(true);
      alert(syncMessage(newSale, 'Sale recorded successfully!'));

    } catch (error) {
      console.error(' Sale failed:', error);
      alert(`Failed to record sale!\n\nError: ${error.message}`);
    }
  }
};

// ========== DELETE SALE FUNCTION ==========
const handleDeleteSale = async (saleId) => {
  if (window.confirm('Delete this sale?\n\n Warning: Quantity will NOT be restored.\n\nThis action cannot be undone.')) {
    try {
      console.log(' Deleting sale:', saleId);
      const result = await deleteSaleFromDb(saleId);
      setSales(sales.filter(s => s.id !== saleId));
      console.log(' Sale deleted successfully!');
      alert(syncMessage(result, 'Sale deleted successfully!'));
    } catch (error) {
      console.error(' Error deleting sale:', error);
      alert(`Failed to delete sale!\n\nError: ${error.message}`);
    }
  }
};

  // ========== SUPPLIERS CRUD OPERATIONS ==========

  const handleAddSupplier = async (formData) => {
  try {
    const newSupplier = await addSupplierToDb(formData);
    setSuppliers([...suppliers, newSupplier]);
    setShowModal(false);
    alert(syncMessage(newSupplier, 'Party added successfully!'));
  } catch (error) {
    console.error('Error adding supplier:', error);
    alert('Failed to add supplier. Please try again.');
  }
};

const handleEditSupplier = async (formData) => {
  try {
    const updatedSupplier = await updateSupplierInDb(editItem.id, formData);
    setSuppliers(suppliers.map(s => s.id === editItem.id ? updatedSupplier : s));
    setShowModal(false);
    setEditItem(null);
    alert(syncMessage(updatedSupplier, 'Party updated successfully!'));
  } catch (error) {
    console.error('Error updating supplier:', error);
    alert('Failed to update supplier. Please try again.');
  }
};

const handleDeleteSupplier = async (id) => {
  const partsCount = parts.filter(p => p.supplier === suppliers.find(s => s.id === id)?.name).length;

  if (partsCount > 0) {
    if (!window.confirm(`This supplier has ${partsCount} parts associated.\n\nAre you sure you want to delete?`)) {
      return;
    }
  }

  if (window.confirm('Delete this supplier?\n\nThis action cannot be undone.')) {
    try {
      const result = await deleteSupplierFromDb(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
      alert(syncMessage(result, 'Party deleted successfully!'));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Failed to delete supplier. Please try again.');
    }
  }
};

// At the end of CommissionShopManagement component, replace the return with:

if (isMobile) {
  return (
    <>
      <MobileLayout
        currentView={currentView}
        setCurrentView={setCurrentView}
        onAddClick={() => {
          if (currentView === 'inventory') {
            setModalType('part');
            setShowModal(true);
            setEditItem(null);
          } else if (currentView === 'sales') {
            setModalType('sale');
            setShowModal(true);
          }
        }}
      >
        {currentView === 'dashboard' && (
          <MobileDashboard
            parts={parts}
            sales={sales}
            lowQuantityMaterials={lowQuantityMaterials}
            outOfQuantityMaterials={outOfQuantityMaterials}
            totalValue={totalValue}
            todayRevenue={todayRevenue}
            todayCommission={todayCommission}
          />
        )}

        {currentView === 'inventory' && (
  <MobileInventory
    parts={parts}
    categories={categories}
    suppliers={suppliers}
    onEditPart={(part) => {
      setEditItem(part);
      setModalType('part');
      setShowModal(true);
    }}
    onDeletePart={handleDeletePart}  //  ADD THIS
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
  />
)}

        {currentView === 'sales' && (
  <MobileSales
    sales={sales}
    totalRevenue={totalRevenue}
    totalCommission={totalCommission}
    todayRevenue={todayRevenue}
    todayCommission={todayCommission}
    onViewReceipt={(sale) => {
      setLastSale(sale);
      setShowReceipt(true);
    }}
    onDeleteSale={handleDeleteSale}  //  ADD THIS
  />
)}

        {/*  NEW - Mobile Commission View */}
        {currentView === 'profit' && (
          <MobileProfit
            sales={sales}
            parts={parts}
            totalCommission={totalCommission}
            totalRevenue={totalRevenue}
            todayCommission={todayCommission}
            todayRevenue={todayRevenue}
            potentialCommission={potentialCommission}
          />
        )}

        {/*  NEW - Mobile More/Settings View */}
        {(currentView === 'suppliers' || currentView === 'reports') && (
          <MobileMore
            userEmail={user?.email || 'User'}
            onChangePassword={() => setShowChangePassword(true)}
            onLogout={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                auth.signOut();
                setUser(null);
              }
            }}
            onExportComplete={handleExportComplete}
            onExportInventory={handleExportInventory}
            onExportSales={handleExportSales}
            onExportSuppliers={handleExportSuppliers}
            onAddSupplier={() => {
              setEditItem(null);
              setModalType('supplier');
              setShowModal(true);
            }}
            onImport={() => {
              const type = prompt('Import as:\n\n1. parts\n2. suppliers\n3. sales\n\nType the name:');
              if (type && ['parts', 'suppliers', 'sales'].includes(type.toLowerCase())) {
                document.getElementById('mobile-import-input')?.click();
              }
            }}
            stats={{
              totalMaterials: parts.length,
              totalSales: sales.length,
              totalSuppliers: suppliers.length,
              totalRevenue: totalRevenue
            }}
          />
        )}
      </MobileLayout>

      {/* Hidden file input for import */}
      <input
        id="mobile-import-input"
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const type = prompt('Import as:\n\n1. parts\n2. suppliers\n3. sales\n\nType the name:');
          if (type && ['parts', 'suppliers', 'sales'].includes(type.toLowerCase())) {
            handleImportExcel(e, type.toLowerCase());
          }
        }}
      />

      {/* Modals */}
      {showModal && modalType === 'part' && isMobile && (
        <MobileAddPart
          categories={categories}
          suppliers={suppliers}
          editItem={editItem}
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
          onSave={(data) => {
            if (editItem) {
              handleEditPart(data);
            } else {
              handleAddPart(data);
            }
            setShowModal(false);
            setEditItem(null);
          }}
        />
      )}

      {showModal && modalType === 'sale' && isMobile && (
        <MobileMultiItemSale
          parts={parts}
          onClose={() => setShowModal(false)}
          onSave={(data) => {
            handleAddSale(data);
            setShowModal(false);
          }}
        />
      )}

      {showModal && modalType === 'supplier' && isMobile && (
        <SupplierModal
          editItem={editItem}
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
          onSave={(data) => {
            if (editItem) {
              handleEditSupplier(data);
            } else {
              handleAddSupplier(data);
            }
            setShowModal(false);
            setEditItem(null);
          }}
        />
      )}

      {showReceipt && lastSale && (
        <ReceiptModal
          sale={lastSale}
          allSales={sales}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {showChangePassword && (
        <ChangePassword
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </>
  );
}

return (
    <div className="app-shell min-h-screen">

      {/* ========== HEADER WITH BRANDING ========== */}
      <div className="border-b border-white/70 bg-slate-950 text-white shadow-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">

            {/* Company Info */}
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Commission Shop Management System
                </h1>
                <p className="text-slate-300 text-sm mt-1 font-medium">
                  Cash Book, Material Book, Party Accounts & Commission Tracking
                </p>
                <div className="flex gap-2 mt-3 text-xs text-slate-200 flex-wrap">
                  <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">Shop Manager: 0300-0000000</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">Cashier: 0300-0000001</span>
                </div>
              </div>
            </div>

            {/* Import/Export Buttons + User Menu */}
            <div className="flex gap-2 flex-wrap items-center">
              {/* Import Button */}
              <label className="cursor-pointer rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const type = prompt('Import as:\n\n1. parts (Material Book)\n2. suppliers (Parties)\n3. sales (Selling Accounts)\n\nType the name:');
                    if (type && ['parts', 'suppliers', 'sales'].includes(type.toLowerCase())) {
                      handleImportExcel(e, type.toLowerCase());
                    } else if (type) {
                      alert('Invalid type! Please choose: parts, suppliers, or sales');
                    }
                  }}
                />
              </label>

              {/* Export Complete Button */}
              <button
                onClick={handleExportComplete}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 hover:bg-emerald-400 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export All Books
              </button>

              {/* Quick Book Export Dropdown */}
              <div className="relative group">
                <button className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 flex items-center gap-2">
                  <FileDown className="w-4 h-4" />
                  Quick Book Export
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={handleExportInventory}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 font-medium rounded-t-lg flex items-center gap-2"
                  >
                    <Boxes className="w-4 h-4" />
                    Material Book Only
                  </button>
                  <button
                    onClick={handleExportSales}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Selling Accounts Only
                  </button>
                  <button
                    onClick={handleExportSuppliers}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 font-medium rounded-b-lg flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Parties Only
                  </button>
                </div>
              </div>

              {/* USER MENU - NEW SECTION */}
              <div className="flex items-center gap-2 border-l border-white/15 pl-3 ml-2">
                <span className="hidden rounded-full bg-white/10 px-3 py-1.5 text-xs text-slate-200 md:block">
                  {auth.currentUser?.email}
                </span>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300"
                >
                  Change Password
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to logout?')) {
                      auth.signOut();
                      setUser(null);
                    }
                  }}
                  className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-400"
                >
                  Logout
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT CONTAINER ========== */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6 flex-wrap lg:flex-nowrap">

          {/* ========== SIDEBAR NAVIGATION ========== */}
          <div className="glass-panel w-full rounded-2xl p-3 lg:sticky lg:top-6 lg:w-72 lg:self-start">
            <nav className="space-y-1.5">

              {/* Accounts Dashboard Button */}
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                  currentView === 'dashboard'
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Accounts Dashboard</span>
              </button>

              {/* Material Book Button */}
              <button
                onClick={() => setCurrentView('inventory')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                  currentView === 'inventory'
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <Boxes className="w-5 h-5" />
                <span>Material Book</span>
                {parts.length > 0 && (
                  <span className="ml-auto bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
                    {parts.length}
                  </span>
                )}
              </button>

              {/* Sales Button */}
              <button
                onClick={() => setCurrentView('sales')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                  currentView === 'sales'
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Sales</span>
                {sales.length > 0 && (
                  <span className="ml-auto bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-bold">
                    {sales.length}
                  </span>
                )}
              </button>

              {/* Commission Analysis Button */}
              <button
                onClick={() => setCurrentView('profit')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                  currentView === 'profit'
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Commission Analysis</span>
              </button>

              {/* Parties Button */}
              <button
                onClick={() => setCurrentView('suppliers')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                  currentView === 'suppliers'
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Parties</span>
                {suppliers.length > 0 && (
                  <span className="ml-auto bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-bold">
                    {suppliers.length}
                  </span>
                )}
              </button>

              {/* Books & Reports Button */}
              <button
                onClick={() => setCurrentView('reports')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                  currentView === 'reports'
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Books & Reports</span>
              </button>

              {/* Quantity Alerts */}
              {(lowQuantityMaterials.length > 0 || outOfQuantityMaterials.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="font-bold text-orange-800 text-sm">Quantity Alerts</span>
                    </div>
                    {outOfQuantityMaterials.length > 0 && (
                      <p className="text-xs text-orange-700">
                        <span className="font-bold">{outOfQuantityMaterials.length}</span> unavailable
                      </p>
                    )}
                    {lowQuantityMaterials.length > 0 && (
                      <p className="text-xs text-orange-700">
                        <span className="font-bold">{lowQuantityMaterials.length}</span> low quantity
                      </p>
                    )}
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* ========== MAIN CONTENT AREA ========== */}
          <div className="min-w-0 flex-1">
            {/* Views will be rendered here based on currentView */}
            {currentView === 'dashboard' && (
  <DashboardView
    parts={parts}
    sales={sales}
    lowQuantityMaterials={lowQuantityMaterials}
    outOfQuantityMaterials={outOfQuantityMaterials}
    totalValue={totalValue}
    todayRevenue={todayRevenue}
    todayCommission={todayCommission}
    totalRevenue={totalRevenue}
    totalCommission={totalCommission}
  />
)}

            {currentView === 'inventory' && (
  <InventoryView
    filteredMaterials={filteredMaterials}
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    filterCategory={filterCategory}
    setFilterCategory={setFilterCategory}
    filterQuantity={filterQuantity}
    setFilterQuantity={setFilterQuantity}
    categories={categories}
    handleExportInventory={handleExportInventory}
    setModalType={setModalType}
    setShowModal={setShowModal}
    setEditItem={setEditItem}
    handleDeletePart={handleDeletePart}
  />
)}

            {currentView === 'sales' && (
  <SalesView
    sales={sales}
    totalRevenue={totalRevenue}
    totalCommission={totalCommission}
    todayRevenue={todayRevenue}
    todayCommission={todayCommission}
    handleExportSales={handleExportSales}
    setModalType={setModalType}
    setShowModal={setShowModal}
    setShowReceipt={setShowReceipt}
    setLastSale={setLastSale}
    handleDeleteSale={handleDeleteSale}
  />
)}

            {currentView === 'profit' && (
  <ProfitView
    sales={sales}
    parts={parts}
    totalCommission={totalCommission}
    totalRevenue={totalRevenue}
    potentialCommission={potentialCommission}
  />
)}

            {currentView === 'suppliers' && (
  <SuppliersView
    suppliers={suppliers}
    parts={parts}
    handleExportSuppliers={handleExportSuppliers}
    setModalType={setModalType}
    setShowModal={setShowModal}
    setEditItem={setEditItem}
    handleDeleteSupplier={handleDeleteSupplier}
  />
)}

            {currentView === 'reports' && (
  <ReportsView
    parts={parts}
    sales={sales}
    categories={categories}
    lowQuantityMaterials={lowQuantityMaterials}
    outOfQuantityMaterials={outOfQuantityMaterials}
    totalValue={totalValue}
    totalRevenue={totalRevenue}
    totalCommission={totalCommission}
  />
)}
          </div>
        </div>
      </div>

      {/* ========== MODALS ========== */}
      {/* Part Modal */}
      {showModal && modalType === 'part' && (
        <PartModal
          editItem={editItem}
          categories={categories}
          suppliers={suppliers}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={editItem ? handleEditPart : handleAddPart}
        />
      )}

      {/* Sales Modal */}
      {showModal && modalType === 'sale' && (
        <SaleModal
          parts={parts}
          onClose={() => setShowModal(false)}
          onSave={handleAddSale}
        />
      )}

      {/* Party Modal */}
      {showModal && modalType === 'supplier' && (
        <SupplierModal
          editItem={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={editItem ? handleEditSupplier : handleAddSupplier}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <ReceiptModal
          sale={lastSale}
          allSales={sales}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Change Password Modal - NEW */}
{showChangePassword && (
  <ChangePassword
    onClose={() => setShowChangePassword(false)}
  />
)}
    </div>
  );


};


export default CommissionShopManagement;
