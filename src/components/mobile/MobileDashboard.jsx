import React from 'react';
import { Package, DollarSign, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';
import MobileCard from './MobileCard';

const MobileDashboard = ({ 
  parts, 
  sales, 
  lowQuantityMaterials, 
  outOfQuantityMaterials, 
  totalValue, 
  todayRevenue, 
  todayCommission
}) => {
  const todaySales = sales.filter(s => s.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-4">
      {/* Account Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Package className="w-6 h-6" />}
          label="Total Materials"
          value={parts.length}
          color="blue"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Material Value"
          value={`Rs.${(totalValue / 1000).toFixed(0)}k`}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Low Quantity"
          value={lowQuantityMaterials.length}
          color="orange"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Today's Commission"
          value={`Rs.${(todayCommission / 1000).toFixed(1)}k`}
          color="purple"
        />
      </div>

      {/* Today's Summary */}
      <MobileCard>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          Today's Summary
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Deals Made:</span>
            <span className="font-bold text-gray-800">{todaySales.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Cash Book Deposit / Credit Amount:</span>
            <span className="font-bold text-blue-600">Rs.{todayRevenue.toFixed(0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Commission:</span>
            <span className="font-bold text-green-600">Rs.{todayCommission.toFixed(0)}</span>
          </div>
        </div>
      </MobileCard>

      {/* Quantity Alerts */}
      {(lowQuantityMaterials.length > 0 || outOfQuantityMaterials.length > 0) && (
        <MobileCard className="border-l-4 border-orange-500">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Quantity Alerts
          </h3>
          <div className="space-y-2">
            {outOfQuantityMaterials.slice(0, 3).map(part => (
              <div key={part.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{part.name}</p>
                  <p className="text-xs text-gray-500">{part.partNumber}</p>
                </div>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                  Out
                </span>
              </div>
            ))}
            {lowQuantityMaterials.slice(0, 3).map(part => (
              <div key={part.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{part.name}</p>
                  <p className="text-xs text-gray-500">Quantity: {part.stock}</p>
                </div>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                  Low
                </span>
              </div>
            ))}
          </div>
        </MobileCard>
      )}

      {/* Recent Material Sales */}
      <MobileCard>
        <h3 className="font-bold text-gray-800 mb-3">Recent Material Sales</h3>
        <div className="space-y-3">
          {sales.slice(-5).reverse().map(sale => (
            <div key={sale.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{sale.partName}</p>
                <p className="text-xs text-gray-500">{sale.customer}  {sale.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-blue-600">Rs.{sale.total.toFixed(0)}</p>
                <p className="text-xs text-green-600">+Rs.{sale.profit.toFixed(0)}</p>
              </div>
            </div>
          ))}
          {sales.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">No sales yet</p>
          )}
        </div>
      </MobileCard>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <MobileCard className={colorClasses[color]}>
      <div className="flex flex-col items-center text-center">
        {icon}
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-xs font-semibold mt-1">{label}</p>
      </div>
    </MobileCard>
  );
};

export default MobileDashboard;


