import React from 'react';
import { TrendingUp, DollarSign, Target, Zap } from 'lucide-react';
import MobileCard from './MobileCard';

const MobileProfit = ({ 
  sales, 
  totalCommission, 
  totalRevenue,
  todayCommission,
  todayRevenue,
  potentialCommission 
}) => {
  const profitMargin = totalRevenue > 0 ? (totalCommission / totalRevenue * 100) : 0;
  const todayCommissionMargin = todayRevenue > 0 ? (todayCommission / todayRevenue * 100) : 0;

  // Calculate monthly performance
  const monthlySales = {};
  sales.forEach(sale => {
    const month = sale.date.substring(0, 7);
    if (!monthlySales[month]) {
      monthlySales[month] = { revenue: 0, profit: 0, count: 0 };
    }
    monthlySales[month].revenue += sale.total;
    monthlySales[month].profit += sale.profit;
    monthlySales[month].count += 1;
  });

  // Top profitable parts
  const topCommissionableMaterials = (() => {
    const partCommission = {};
    sales.forEach(sale => {
      if (!partCommission[sale.partName]) {
        partCommission[sale.partName] = { profit: 0, quantity: 0 };
      }
      partCommission[sale.partName].profit += sale.profit;
      partCommission[sale.partName].quantity += sale.quantity;
    });
    return Object.entries(partCommission)
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 5);
  })();

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <MobileCard className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex flex-col items-center text-center">
            <DollarSign className="w-8 h-8 mb-2" />
            <p className="text-sm font-semibold opacity-90">Total Commission</p>
            <p className="text-2xl font-bold mt-1">Rs.{(totalCommission / 1000).toFixed(1)}k</p>
          </div>
        </MobileCard>

        <MobileCard className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex flex-col items-center text-center">
            <TrendingUp className="w-8 h-8 mb-2" />
            <p className="text-sm font-semibold opacity-90">Commission Margin</p>
            <p className="text-2xl font-bold mt-1">{profitMargin.toFixed(1)}%</p>
          </div>
        </MobileCard>

        <MobileCard className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex flex-col items-center text-center">
            <Target className="w-8 h-8 mb-2" />
            <p className="text-sm font-semibold opacity-90">Today's Commission</p>
            <p className="text-2xl font-bold mt-1">Rs.{(todayCommission / 1000).toFixed(1)}k</p>
          </div>
        </MobileCard>

        <MobileCard className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex flex-col items-center text-center">
            <Zap className="w-8 h-8 mb-2" />
            <p className="text-sm font-semibold opacity-90">Potential</p>
            <p className="text-2xl font-bold mt-1">Rs.{(potentialCommission / 1000).toFixed(1)}k</p>
          </div>
        </MobileCard>
      </div>

      {/* Today's Performance */}
      <MobileCard>
        <h3 className="font-bold text-gray-800 mb-3 text-lg"> Today's Performance</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Cash Book Deposit / Credit Amount:</span>
            <span className="font-bold text-blue-600">Rs.{todayRevenue.toFixed(0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Commission:</span>
            <span className="font-bold text-green-600">Rs.{todayCommission.toFixed(0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Margin:</span>
            <span className="font-bold text-purple-600">{todayCommissionMargin.toFixed(1)}%</span>
          </div>
        </div>
      </MobileCard>

      {/* Key Metrics */}
      <MobileCard>
        <h3 className="font-bold text-gray-800 mb-3 text-lg"> Key Metrics</h3>
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Average Commission per Sale</p>
            <p className="text-xl font-bold text-blue-600">
              Rs.{sales.length > 0 ? (totalCommission / sales.length).toFixed(0) : '0'}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Total Cash Book Amount</p>
            <p className="text-xl font-bold text-green-600">Rs.{totalRevenue.toFixed(0)}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Material Cost</p>
            <p className="text-xl font-bold text-purple-600">
              Rs.{(totalRevenue - totalCommission).toFixed(0)}
            </p>
          </div>
        </div>
      </MobileCard>

      {/* Monthly Performance */}
      <MobileCard>
        <h3 className="font-bold text-gray-800 mb-3 text-lg"> Monthly Performance</h3>
        <div className="space-y-3">
          {Object.entries(monthlySales)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 3)
            .map(([month, data]) => (
              <div key={month} className="border-b last:border-0 pb-3 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800">
                    {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-sm text-gray-500">{data.count} sales</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Cash Book Amount</p>
                    <p className="font-bold text-blue-600">Rs.{(data.revenue / 1000).toFixed(1)}k</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Commission</p>
                    <p className="font-bold text-green-600">Rs.{(data.profit / 1000).toFixed(1)}k</p>
                  </div>
                </div>
              </div>
            ))}
          {Object.keys(monthlySales).length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">No sales data yet</p>
          )}
        </div>
      </MobileCard>

      {/* Top Commission Materials */}
      <MobileCard>
        <h3 className="font-bold text-gray-800 mb-3 text-lg"> Top Commission Materials</h3>
        <div className="space-y-2">
          {topCommissionableMaterials.map(([name, data], index) => (
            <div key={name} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate text-sm">{name}</p>
                <p className="text-xs text-gray-500">{data.quantity} units sold</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-green-600 text-sm">Rs.{(data.profit / 1000).toFixed(1)}k</p>
              </div>
            </div>
          ))}
          {topCommissionableMaterials.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">No sales data yet</p>
          )}
        </div>
      </MobileCard>
    </div>
  );
};

export default MobileProfit;

