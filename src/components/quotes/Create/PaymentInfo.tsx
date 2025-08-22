import React from 'react';
import { CreditCard } from 'lucide-react';
import { PaymentBarcode } from '../PaymentBarcode';

interface PaymentInfoProps {
  paymentInfo: {
    iban: string;
    model: string;
    reference: string;
    purpose: string;
    companyName?: string;
  };
  onPaymentInfoChange: (info: any) => void;
  amount: number;
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({
  paymentInfo,
  onPaymentInfoChange,
  amount
}) => {
  const handleChange = (field: string, value: string) => {
    onPaymentInfoChange({
      ...paymentInfo,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Podaci za plaćanje</h3>
      
      <div className="space-y-4">
        {/* IBAN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            IBAN
          </label>
          <input
            type="text"
            value={paymentInfo.iban}
            onChange={(e) => handleChange('iban', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="HR1234567890123456789"
          />
        </div>
        
        {/* Model i poziv na broj */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={paymentInfo.model}
              onChange={(e) => handleChange('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="HR00">HR00</option>
              <option value="HR01">HR01</option>
              <option value="HR02">HR02</option>
              <option value="HR03">HR03</option>
              <option value="HR05">HR05</option>
              <option value="HR06">HR06</option>
              <option value="HR07">HR07</option>
              <option value="HR08">HR08</option>
              <option value="HR09">HR09</option>
              <option value="HR10">HR10</option>
              <option value="HR11">HR11</option>
              <option value="HR12">HR12</option>
              <option value="HR13">HR13</option>
              <option value="HR14">HR14</option>
              <option value="HR15">HR15</option>
              <option value="HR16">HR16</option>
              <option value="HR17">HR17</option>
              <option value="HR18">HR18</option>
              <option value="HR23">HR23</option>
              <option value="HR24">HR24</option>
              <option value="HR26">HR26</option>
              <option value="HR27">HR27</option>
              <option value="HR28">HR28</option>
              <option value="HR29">HR29</option>
              <option value="HR30">HR30</option>
              <option value="HR31">HR31</option>
              <option value="HR33">HR33</option>
              <option value="HR34">HR34</option>
              <option value="HR40">HR40</option>
              <option value="HR41">HR41</option>
              <option value="HR42">HR42</option>
              <option value="HR43">HR43</option>
              <option value="HR55">HR55</option>
              <option value="HR62">HR62</option>
              <option value="HR63">HR63</option>
              <option value="HR64">HR64</option>
              <option value="HR65">HR65</option>
              <option value="HR67">HR67</option>
              <option value="HR68">HR68</option>
              <option value="HR69">HR69</option>
              <option value="HR83">HR83</option>
              <option value="HR84">HR84</option>
              <option value="HR99">HR99</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poziv na broj
            </label>
            <input
              type="text"
              value={paymentInfo.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Poziv na broj"
            />
          </div>
        </div>
        
        {/* Svrha plaćanja */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Šifra namjene
          </label>
          <select
            value={paymentInfo.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="CMDT">CMDT - Plaćanje robe</option>
            <option value="GDSV">GDSV - Plaćanje robe i usluga</option>
            <option value="GDDS">GDDS - Kupnja/prodaja robe</option>
            <option value="SERV">SERV - Plaćanje usluga</option>
            <option value="CSDB">CSDB - Gotovinska uplata</option>
            <option value="OTHR">OTHR - Ostalo</option>
          </select>
        </div>
        
        {/* 2D Barcode Preview */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
            2D barkod za plaćanje
          </h4>
          
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
            <PaymentBarcode
              data={{
                paymentModel: paymentInfo.model,
                paymentReference: paymentInfo.reference,
                payerName: "",
                payerAddress: "",
                payerPlace: "",
                recipientName: paymentInfo.companyName || "",
                recipientAddress: "Ulica grada Vukovara 269D",
                recipientPlace: "10000 Zagreb",
                recipientIBAN: paymentInfo.iban,
                amount: amount,
                purposeCode: paymentInfo.purpose,
                purposeText: "Plaćanje po ponudi"
              }}
              size={180}
            />
          </div>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            2D barkod omogućuje brzo plaćanje skeniranjem putem mobilnog bankarstva
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfo;
