import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface MaterialRequirement {
  name: string;
  required: number;
  available: number;
  unit: string;
  sufficient: boolean;
}

interface MaterialRequirementsProps {
  requirements: MaterialRequirement[];
}

const MaterialRequirements: React.FC<MaterialRequirementsProps> = ({ requirements }) => {
  const insufficientMaterials = requirements.filter(req => !req.sufficient);
  const sufficientMaterials = requirements.filter(req => req.sufficient);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Potrebni materijali</h3>
      
      {/* Warning for insufficient materials */}
      {insufficientMaterials.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-800">
              {insufficientMaterials.length} materijal{insufficientMaterials.length > 1 ? 'a' : ''} nema dovoljno zaliha
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Show insufficient materials first */}
        {insufficientMaterials.map((req, index) => (
          <div key={`insufficient-${index}`} className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-900">{req.name}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                Nedovoljno
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <div>Potrebno: <span className="font-semibold text-red-700">{req.required.toFixed(req.unit === 'kom' ? 0 : 4)} {req.unit}</span></div>
              <div>Dostupno: {req.available.toFixed(req.unit === 'kom' ? 0 : 4)} {req.unit}</div>
              <div className="text-red-700 font-medium">
                Nedostaje: {(req.required - req.available).toFixed(req.unit === 'kom' ? 0 : 4)}
              </div>
            </div>
          </div>
        ))}

        {/* Show sufficient materials */}
        {sufficientMaterials.map((req, index) => (
          <div key={`sufficient-${index}`} className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-900">{req.name}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" /> OK
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <div><span className="font-medium">Jedinica mjere:</span> {req.unit}</div>
              <div><span className="font-medium">Jedinica mjere:</span> {req.unit}</div>
              <div>Potrebno: {req.required.toFixed(req.unit === 'kom' ? 0 : 4)} {req.unit}</div>
              <div>Dostupno: <span className="font-semibold text-green-700">{req.available.toFixed(req.unit === 'kom' ? 0 : 4)} {req.unit}</span></div>
              <div className="text-green-700">
                Ostaje: {(req.available - req.required).toFixed(req.unit === 'kom' ? 0 : 4)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Ukupno materijala:</span>
            <span className="font-medium">{requirements.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Dostupno:</span>
            <span className="font-medium text-green-600">{sufficientMaterials.length}</span>
          </div>
          {insufficientMaterials.length > 0 && (
            <div className="flex justify-between">
              <span>Nedovoljno:</span>
              <span className="font-medium text-red-600">{insufficientMaterials.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialRequirements;
