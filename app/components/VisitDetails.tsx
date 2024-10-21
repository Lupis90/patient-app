import React from 'react';
import { X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Patient, Visit, Photo } from '../types';
import Image from 'next/image';

interface VisitDetailsProps {
  selectedPatient: Patient | null;
  selectedVisit: Visit | null;
  isEditMode: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  updateVisit: () => void;
  deleteVisit: (patientId: number, visitDate: string) => void;
  setIsEditMode: (isEdit: boolean) => void;
}

export const VisitDetails: React.FC<VisitDetailsProps> = ({
  selectedPatient,
  selectedVisit,
  isEditMode,
  handleInputChange,
  handlePhotoUpload,
  removePhoto,
  updateVisit,
  deleteVisit,
  setIsEditMode,
}) => {
  if (!selectedPatient || !selectedVisit) return null;

  return (
    <div>
      <p><strong>Paziente:</strong> {selectedPatient.last_name} {selectedPatient.first_name}</p>
      {isEditMode ? (
        <Input
          type="date"
          name="date"
          value={selectedVisit.date}
          onChange={handleInputChange}
          className="mb-2"
        />
      ) : (
        <p><strong>Data:</strong> {selectedVisit.date}</p>
      )}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Foto:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {selectedVisit.photos.map((photo: Photo, index: number) => (
            <div key={index} className="relative">
              <Image
                src={photo.data}
                alt={`Visita ${index + 1}`}
                width={300}
                height={200}
                className="w-full h-32 sm:h-40 object-cover rounded"
              />
              {isEditMode && (
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {isEditMode && (
        <div className="mt-4 space-y-2">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
          />
        </div>
      )}
      <div className="mt-4 space-y-2 sm:space-y-0 sm:space-x-2">
        {isEditMode ? (
          <>
            <Button onClick={updateVisit} className="w-full sm:w-auto">Salva Modifiche</Button>
            <Button variant="outline" onClick={() => setIsEditMode(false)} className="w-full sm:w-auto">Annulla</Button>
          </>
        ) : (
          <>
            <Button onClick={() => setIsEditMode(true)} className="w-full sm:w-auto">Modifica</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedPatient.id && deleteVisit(selectedPatient.id, selectedVisit.date)}
              className="w-full sm:w-auto"
            >
              Elimina Visita
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
