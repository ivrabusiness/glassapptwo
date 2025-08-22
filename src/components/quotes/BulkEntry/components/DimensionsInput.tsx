import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';

interface DimensionsInputProps {
  dimensionsText: string;
  onDimensionsChange: (text: string) => void;
  error?: string | null;
}

/**
 * Komponenta za unos dimenzija u bulk entry modalu
 */
const DimensionsInput: React.FC<DimensionsInputProps> = ({
  dimensionsText,
  onDimensionsChange,
  error
}) => {
  return (
    <div className="mb-6">
      <label htmlFor="dimensions-textarea" className="block text-sm font-medium text-gray-900 mb-2">
        <FileText className="h-4 w-4 inline mr-2" />
        Unesite dimenzije
      </label>
      <textarea
        id="dimensions-textarea"
        value={dimensionsText}
        onChange={(e) => onDimensionsChange(e.target.value)}
        rows={8}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        placeholder="Unesite dimenzije u jednom od formata:&#10;300x300x1&#10;300 300 1&#10;300,300,1&#10;&#10;Svaki red predstavlja jednu stavku."
      />
      
      {/* Pomoć za format */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Podržani formati:</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <div><code className="bg-blue-100 px-1 rounded">300x300x1</code> - širina x visina x količina</div>
          <div><code className="bg-blue-100 px-1 rounded">300 300 1</code> - širina visina količina</div>
          <div><code className="bg-blue-100 px-1 rounded">300,300,1</code> - širina,visina,količina</div>
          <div className="text-blue-700 mt-2">
            <strong>Napomena:</strong> Ako ne unesete količinu, automatski će se postaviti na 1.
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DimensionsInput;

