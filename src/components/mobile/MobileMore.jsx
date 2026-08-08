import React from 'react';
import { 
  User, 
  Key, 
  LogOut, 
  Download, 
  Upload, 
  FileText,
  Users,
  Package,
  ShoppingCart,
  Info,
  ChevronRight
} from 'lucide-react';
import MobileCard from './MobileCard';

const MenuItem = ({ icon: Icon, label, onClick, color = "blue", badge }) => (
  <MobileCard onClick={onClick} className="active:scale-95 transition-transform">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`bg-${color}-100 p-2 rounded-lg`}>
          {React.createElement(Icon, { className: `w-5 h-5 text-${color}-600` })}
        </div>
        <span className="font-semibold text-gray-800">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
            {badge}
          </span>
        )}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  </MobileCard>
);

const MobileMore = ({ 
  userEmail,
  onChangePassword,
  onLogout,
  onExportComplete,
  onExportInventory,
  onExportSales,
  onExportSuppliers,
  onAddSupplier,
  onImport,
  stats
}) => {
  return (
    <div className="space-y-4">
      {/* User Info Card */}
      <MobileCard className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-full">
            <User className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-sm opacity-90">Logged in as</p>
            <p className="font-bold text-lg truncate">{userEmail}</p>
          </div>
        </div>
      </MobileCard>

      {/* Account Summary */}
      <MobileCard>
        <h3 className="font-bold text-gray-800 mb-3 text-lg"> Account Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <Package className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{stats?.totalMaterials || 0}</p>
            <p className="text-xs text-gray-600">Materials</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <ShoppingCart className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{stats?.totalSales || 0}</p>
            <p className="text-xs text-gray-600">Sales</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-600">{stats?.totalSuppliers || 0}</p>
            <p className="text-xs text-gray-600">Parties</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <FileText className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-600">
              Rs.{((stats?.totalRevenue || 0) / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-gray-600">Cash Book Amount</p>
          </div>
        </div>
      </MobileCard>

      {/* Parties Section */}
      <div>
        <h3 className="font-bold text-gray-700 mb-2 px-1">Parties</h3>
        <MenuItem
          icon={Users}
          label="Add Party"
          onClick={onAddSupplier}
          color="purple"
        />
      </div>

      {/* Export Section */}
      <div>
        <h3 className="font-bold text-gray-700 mb-2 px-1">Export Data</h3>
        <div className="space-y-2">
          <MenuItem 
            icon={Download} 
            label="Export All Books" 
            onClick={onExportComplete}
            color="green"
          />
          <MenuItem 
            icon={Package} 
            label="Export Material Book" 
            onClick={onExportInventory}
            color="blue"
          />
          <MenuItem 
            icon={ShoppingCart} 
            label="Export Sales" 
            onClick={onExportSales}
            color="green"
          />
          <MenuItem 
            icon={Users} 
            label="Export Parties" 
            onClick={onExportSuppliers}
            color="purple"
          />
        </div>
      </div>

      {/* Import Section */}
      <div>
        <h3 className="font-bold text-gray-700 mb-2 px-1">Import Data</h3>
        <MenuItem 
          icon={Upload} 
          label="Import from Excel" 
          onClick={onImport}
          color="orange"
        />
      </div>

      {/* Account Section */}
      <div>
        <h3 className="font-bold text-gray-700 mb-2 px-1">Account</h3>
        <div className="space-y-2">
          <MenuItem 
            icon={Key} 
            label="Change Password" 
            onClick={onChangePassword}
            color="yellow"
          />
          <MenuItem 
            icon={LogOut} 
            label="Logout" 
            onClick={onLogout}
            color="red"
          />
        </div>
      </div>

      {/* App Info */}
      <MobileCard className="bg-gray-50">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-gray-400" />
          <div className="text-sm text-gray-600">
            <p className="font-semibold">Commission Shop Management System</p>
            <p className="text-xs">Commission Shop System v1.0</p>
          </div>
        </div>
      </MobileCard>
    </div>
  );
};

export default MobileMore;


