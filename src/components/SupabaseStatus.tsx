import React, { useState, useEffect } from 'react';
import { Cloud, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured, testConnection } from '../lib/supabase';

interface SupabaseStatusProps {
  onMigrate?: () => void;
}

const SupabaseStatus: React.FC<SupabaseStatusProps> = ({ onMigrate }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);
    
    if (configured) {
      const { success } = await testConnection();
      setIsConnected(success);
    }
    
    setLastCheck(new Date());
    setIsLoading(false);
  };

  const getStatusConfig = () => {
    if (!isConfigured) {
      return {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        text: '❌ SUPABASE OBAVEZAN',
        description: 'Aplikacija NEĆE raditi bez Supabase konfiguracije!'
      };
    }
    
    if (isConnected) {
      return {
        icon: Cloud,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        text: '✅ Supabase Aktivan',
        description: 'Svi podaci se spremaju u cloud bazu'
      };
    }
    
    return {
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      text: '⚠️ Greška konekcije',
      description: 'Problem s pristupom Supabase bazi - PODACI SE NEĆE SPREMITI!'
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <div className={`rounded-lg border ${status.borderColor} ${status.bgColor} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <StatusIcon className={`h-5 w-5 ${status.color}`} />
          <div>
            <p className={`text-sm font-medium ${status.color}`}>
              {status.text}
            </p>
            <p className="text-xs text-gray-600">
              {status.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={checkStatus}
            disabled={isLoading}
            className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showDetails ? 'Sakrij' : 'Detalji'}
          </button>
        </div>
      </div>
      
      {/* 🚨 KRITIČNO UPOZORENJE ako Supabase nije konfiguriran */}
      {!isConfigured && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              KRITIČNO: Aplikacija neće raditi bez Supabase!
            </span>
          </div>
          <p className="text-xs text-red-700 mt-1">
            Svi podaci će se izgubiti. Molimo konfigurirajte Supabase odmah.
          </p>
        </div>
      )}
      
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Supabase URL:</span>
              <span className={isConfigured ? 'text-green-600' : 'text-red-500'}>
                {isConfigured ? '✓ Postavljen' : '✗ NEDOSTAJE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>API ključ:</span>
              <span className={isConfigured ? 'text-green-600' : 'text-red-500'}>
                {isConfigured ? '✓ Postavljen' : '✗ NEDOSTAJE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Konekcija:</span>
              <span className={isConnected ? 'text-green-600' : 'text-red-500'}>
                {isConnected ? '✓ Aktivna' : '✗ NEAKTIVNA'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Način rada:</span>
              <span className={`font-medium ${isConfigured && isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConfigured && isConnected ? '✅ SAMO SUPABASE' : '❌ NEĆE RADITI'}
              </span>
            </div>
            {lastCheck && (
              <div className="flex justify-between">
                <span>Zadnja provjera:</span>
                <span>{lastCheck.toLocaleTimeString('hr-HR')}</span>
              </div>
            )}
          </div>
          
          {!isConfigured && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
              <p className="font-medium text-blue-900 mb-1">🚨 HITNO - Kako konfigurirati Supabase:</p>
              <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                <li>Kreirajte .env datoteku u root direktoriju</li>
                <li>Dodajte: VITE_SUPABASE_URL=https://your-project.supabase.co</li>
                <li>Dodajte: VITE_SUPABASE_ANON_KEY=your-anon-key</li>
                <li>Restartajte aplikaciju (npm run dev)</li>
              </ol>
              <p className="text-red-700 font-medium mt-2">
                ⚠️ BEZ OVOGA APLIKACIJA NEĆE RADITI!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupabaseStatus;
