import React from 'react';
import { FileText, Truck, ExternalLink } from 'lucide-react';

interface NotesSectionProps {
  workOrderNotes?: string;
  deliveryNoteNotes?: string;
  onViewWorkOrder?: () => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({ workOrderNotes, deliveryNoteNotes, onViewWorkOrder }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
        Napomene
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workOrderNotes && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-yellow-900 mb-1">Napomene radnog naloga</h4>
                <p className="text-sm text-yellow-700 whitespace-pre-wrap">{workOrderNotes}</p>
              </div>
              {onViewWorkOrder && (
                <button 
                  onClick={onViewWorkOrder}
                  className="ml-2 p-1.5 text-yellow-600 hover:text-yellow-800 bg-yellow-100 rounded-full hover:bg-yellow-200 transition-colors"
                  title="Pregledaj radni nalog"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
        
        {deliveryNoteNotes && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Napomene otpremnice</h4>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{deliveryNoteNotes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!workOrderNotes && !deliveryNoteNotes && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Nema dodatnih napomena za ovu otpremnicu ili radni nalog.</p>
        </div>
      )}
    </div>
  );
};

export default NotesSection;
