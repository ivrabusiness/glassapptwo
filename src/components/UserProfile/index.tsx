import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileInfo from './ProfileInfo';
import PasswordChange from './PasswordChange';
import Avatar from './Avatar';
import { User, Lock, Image, ChevronRight, Shield, Bell, CreditCard, HelpCircle, FileText, BarChart3, Wallet, Truck } from 'lucide-react';
import BankAccounts from './BankAccounts';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'avatar' | 'bank-accounts'>('info');

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Korisnik nije prijavljen</h3>
        <p className="text-gray-600 mt-2">Molimo prijavite se za pristup profilu</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">


      {/* Tabs and Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Tabs */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              <button
                onClick={() => setActiveTab('info')}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                  activeTab === 'info' 
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-l-4 border-gray-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <User className={`h-5 w-5 mr-3 ${activeTab === 'info' ? 'text-gray-700' : 'text-gray-500'}`} />
                  <span className="font-medium">Osobni podaci</span>
                </div>
                <ChevronRight className={`h-4 w-4 ${activeTab === 'info' ? 'text-gray-700' : 'text-gray-400'}`} />
              </button>
              
              <button
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                  activeTab === 'password' 
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-l-4 border-gray-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Lock className={`h-5 w-5 mr-3 ${activeTab === 'password' ? 'text-gray-700' : 'text-gray-500'}`} />
                  <span className="font-medium">Promjena lozinke</span>
                </div>
                <ChevronRight className={`h-4 w-4 ${activeTab === 'password' ? 'text-gray-700' : 'text-gray-400'}`} />
              </button>
              
              <button
                onClick={() => setActiveTab('avatar')}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                  activeTab === 'avatar' 
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-l-4 border-gray-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Image className={`h-5 w-5 mr-3 ${activeTab === 'avatar' ? 'text-gray-700' : 'text-gray-500'}`} />
                  <span className="font-medium">Profilna slika</span>
                </div>
                <ChevronRight className={`h-4 w-4 ${activeTab === 'avatar' ? 'text-gray-700' : 'text-gray-400'}`} />
              </button>
              
              <button
                onClick={() => setActiveTab('bank-accounts')}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                  activeTab === 'bank-accounts' 
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-l-4 border-gray-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Wallet className={`h-5 w-5 mr-3 ${activeTab === 'bank-accounts' ? 'text-gray-700' : 'text-gray-500'}`} />
                  <span className="font-medium">Bankovni računi</span>
                </div>
                <ChevronRight className={`h-4 w-4 ${activeTab === 'bank-accounts' ? 'text-gray-700' : 'text-gray-400'}`} />
              </button>
              
              {/* Additional menu items (disabled for now) */}
              <div className="w-full flex items-center justify-between p-5 text-left text-gray-400 cursor-not-allowed">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-3" />
                  <span className="font-medium">Obavijesti</span>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Uskoro</span>
              </div>
              
              <div className="w-full flex items-center justify-between p-5 text-left text-gray-400 cursor-not-allowed">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-3" />
                  <span className="font-medium">Sigurnost</span>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Uskoro</span>
              </div>
              
              <div className="w-full flex items-center justify-between p-5 text-left text-gray-400 cursor-not-allowed">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-3" />
                  <span className="font-medium">Pretplate</span>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Uskoro</span>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="p-5 bg-gray-50 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Brzi linkovi</h3>
              <div className="space-y-3">
                <a href="/dashboard" className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span>Nadzorna ploča</span>
                </a>
                <a href="/work-orders" className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Radni nalozi</span>
                </a>
                <a href="/delivery-notes" className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  <Truck className="h-4 w-4 mr-2" />
                  <span>Otpremnice</span>
                </a>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-xs text-gray-600">Trebate pomoć?</span>
                </div>
                <a href="mailto:support@tolicapp.hr" className="text-xs text-gray-600 hover:underline mt-1 block">
                  support@tolicapp.hr
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3 bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {activeTab === 'info' && <ProfileInfo />}
          {activeTab === 'password' && <PasswordChange />}
          {activeTab === 'avatar' && <Avatar />}
          {activeTab === 'bank-accounts' && <BankAccounts />}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
