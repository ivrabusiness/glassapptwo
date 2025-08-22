import React from 'react';
import { Package, ShoppingCart, FileText, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { InventoryItem, Product, WorkOrder } from '../types';

const Dashboard: React.FC = () => {
  const [inventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [products] = useSupabaseData<Product>('products', []);
  const [workOrders] = useSupabaseData<WorkOrder>('work_orders', []);

  const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity);
  const activeOrders = workOrders.filter(order => order.status === 'in-progress');
  const pendingOrders = workOrders.filter(order => order.status === 'pending');
  const completedOrders = workOrders.filter(order => order.status === 'completed'); // KLJUČNO: Završeni nalozi
  const completedToday = workOrders.filter(order => {
    if (order.status !== 'completed' || !order.completedAt) return false;
    const today = new Date().toDateString();
    const completedDate = new Date(order.completedAt).toDateString();
    return today === completedDate;
  });

  // KLJUČNO: Ažurirane statistike s završenim nalozima
  const stats = [
    {
      name: 'Artikli u skladištu',
      value: inventory.length,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      name: 'Proizvodi',
      value: products.length,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100'
    },
    {
      name: 'Aktivni nalozi',
      value: activeOrders.length,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-100'
    },
    {
      name: 'Završeni nalozi', // KLJUČNO: Nova kartica za završene naloge
      value: completedOrders.length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100'
    },
    {
      name: 'Nalozi na čekanju',
      value: pendingOrders.length,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100'
    }
  ];

  return (
    <div className="space-y-6">

      {/* Stats Grid - Elegantniji dizajn s 5 kartica */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className={`bg-white border ${stat.borderColor} rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* KLJUČNO: Dodana nova sekcija za završene naloge danas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert - Profesionalniji dizajn */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Niska zaliha</h3>
              </div>
              {lowStockItems.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {lowStockItems.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-amber-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Kod: {item.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-700">
                        {item.quantity} {item.unit}
                      </p>
                      <p className="text-xs text-gray-500">Min: {item.minQuantity}</p>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2 border-t border-gray-100">
                    i još {lowStockItems.length - 5} artikala...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Sve zalihe su na zadovoljavajućoj razini</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Orders - Profesionalniji dizajn */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Čekaju obradu</h3>
              </div>
              {pendingOrders.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {pendingOrders.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            {pendingOrders.length > 0 ? (
              <div className="space-y-3">
                {pendingOrders.slice(0, 5).map((order) => {
                  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                  const product = firstItem ? products.find(p => p.id === firstItem.productId) : null;
                  const totalQuantity = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                  const totalArea = order.items ? order.items.reduce((sum, item) => sum + (item.dimensions?.area || 0), 0) : 0;
                  
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{product?.name || 'Nepoznat proizvod'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-700">
                          {totalQuantity} kom
                        </p>
                        <p className="text-xs text-gray-500">
                          {totalArea.toFixed(2)} m²
                        </p>
                      </div>
                    </div>
                  );
                })}
                {pendingOrders.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2 border-t border-gray-100">
                    i još {pendingOrders.length - 5} naloga...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Nema naloga na čekanju</p>
              </div>
            )}
          </div>
        </div>

        {/* KLJUČNO: Nova sekcija - Završeni nalozi danas */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Završeno danas</h3>
              </div>
              {completedToday.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {completedToday.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            {completedToday.length > 0 ? (
              <div className="space-y-3">
                {completedToday.slice(0, 5).map((order) => {
                  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                  const product = firstItem ? products.find(p => p.id === firstItem.productId) : null;
                  const totalQuantity = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                  const totalArea = order.items ? order.items.reduce((sum, item) => sum + (item.dimensions?.area || 0), 0) : 0;
                  
                  return (
                    <div key={order.id} className="p-3 bg-green-50 border border-green-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                            <p className="text-xs text-gray-500">{product?.name || 'Nepoznat proizvod'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-700">
                            {totalQuantity} kom
                          </p>
                          <p className="text-xs text-gray-500">
                            {totalArea.toFixed(2)} m²
                          </p>
                        </div>
                      </div>

                    </div>
                  );
                })}
                {completedToday.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2 border-t border-gray-100">
                    i još {completedToday.length - 5} naloga...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Nema završenih naloga danas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
