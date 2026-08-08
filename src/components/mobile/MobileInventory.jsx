import React, { useState } from 'react';
import { Search, Edit2, AlertCircle, Package, Trash2 } from 'lucide-react';
import MobileCard from './MobileCard';

const MobileInventory = ({ 
  parts, 
  categories,
  onEditPart,
  onDeletePart,  //  NEW PROP
  searchTerm,
  setSearchTerm
}) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterQuantity, setFilterQuantity] = useState('all');

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

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <FilterChip
          label="All"
          active={filterQuantity === 'all'}
          onClick={() => setFilterQuantity('all')}
        />
        <FilterChip
          label="Low Quantity"
          active={filterQuantity === 'low'}
          onClick={() => setFilterQuantity('low')}
          color="orange"
        />
        <FilterChip
          label="Unavailable"
          active={filterQuantity === 'out'}
          onClick={() => setFilterQuantity('out')}
          color="red"
        />
      </div>

      {/* Category Filter */}
      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="all">All Categories</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.name}>{cat.name}</option>
        ))}
      </select>

      {/* Materials Count */}
      <div className="flex justify-between items-center px-1">
        <span className="text-sm text-gray-600 font-semibold">
          {filteredMaterials.length} {filteredMaterials.length === 1 ? 'part' : 'parts'}
        </span>
      </div>

      {/* Materials List */}
      <div className="space-y-3">
        {filteredMaterials.map(part => (
          <PartCard 
            key={part.id} 
            part={part} 
            onEdit={onEditPart}
            onDelete={onDeletePart}  //  PASS DELETE HANDLER
          />
        ))}
        {filteredMaterials.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">No materials found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterChip = ({ label, active, onClick, color = 'blue' }) => {
  const colorClasses = {
    blue: active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600',
    orange: active ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600',
    red: active ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${colorClasses[color]}`}
    >
      {label}
    </button>
  );
};

const PartCard = ({ part, onEdit, onDelete }) => {
  const getQuantityStatus = () => {
    if (part.stock === 0) return { label: 'Unavailable', color: 'bg-red-100 text-red-700 border-red-200' };
    if (part.stock <= part.reorderLevel) return { label: 'Low Quantity', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { label: 'Available', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const status = getQuantityStatus();
  const profitPerUnit = part.sellingPrice - part.purchasePrice;

  const handleDelete = () => {
    if (window.confirm(`Delete this part?\n\nMaterial: ${part.name}\nMaterial Code: ${part.partNumber}\nQuantity: ${part.stock} units\n\n This cannot be undone!`)) {
      onDelete(part.id);
    }
  };

  return (
    <MobileCard>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-lg">{part.name}</h3>
          <p className="text-sm text-gray-500">#{part.partNumber}</p>
        </div>
        
        {/*  ACTION BUTTONS */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(part)}
            className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition active:scale-95"
            title="Edit Material"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleDelete}
            className="text-red-600 p-2 hover:bg-red-50 rounded-lg transition active:scale-95"
            title="Delete Part"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Category</p>
          <p className="text-sm font-semibold text-gray-800">{part.category}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Grade</p>
          <p className="text-sm font-semibold text-gray-800">{part.brand || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Purchase Price</p>
          <p className="text-sm font-semibold text-gray-800">Rs.{part.purchasePrice?.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Selling Price</p>
          <p className="text-sm font-semibold text-blue-600">Rs.{part.sellingPrice?.toFixed(0)}</p>
        </div>
      </div>

      {/* Commission Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
        <p className="text-xs text-green-700 text-center">
          <span className="font-semibold">Commission per unit:</span> Rs.{profitPerUnit.toFixed(0)}
        </p>
      </div>

      {/* Quantity & Status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Quantity</p>
          <p className="text-3xl font-bold text-gray-800">{part.stock}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Location */}
      {part.location && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Location:</span> {part.location}
          </p>
        </div>
      )}
    </MobileCard>
  );
};

export default MobileInventory;

