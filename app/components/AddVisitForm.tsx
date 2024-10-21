import React from 'react';
import { Camera, Calendar, Users, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import LoadingSpinnerW from '../../components/LoadingSpinnerW';
import { Photo } from '../types';
import Image from 'next/image';

interface AddVisitFormProps {
  newVisit: {
    firstName: string;
    lastName: string;
    date: string;
    photos: Photo[];
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  addVisit: () => void;
  isAddingVisit: boolean;
}

export const AddVisitForm: React.FC<AddVisitFormProps> = ({
  newVisit,
  handleInputChange,
  handlePhotoUpload,
  removePhoto,
  addVisit,
  isAddingVisit,
}) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Aggiungi Nuova Visita</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Users className="mr-2" />
            <Input
              name="firstName"
              value={newVisit.firstName}
              onChange={handleInputChange}
              placeholder="Nome"
              className="w-full sm:w-1/2"
            />
            <Input
              name="lastName"
              value={newVisit.lastName}
              onChange={handleInputChange}
              placeholder="Cognome"
              className="w-full sm:w-1/2"
            />
          </div>
          <div className="flex items-center">
            <Calendar className="mr-2" />
            <Input
              type="date"
              name="date"
              value={newVisit.date}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Camera className="mr-2" />
            <label className="cursor-pointer bg-white border border-gray-300 rounded-md py-2 px-4 w-full text-sm text-gray-500 hover:bg-gray-50">
              <span>Clicca qui per aggiungere Foto</span>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {newVisit.photos.map((photo, index) => (
              <div key={index} className="relative">
                <Image
                  src={photo.data}
                  alt={`Caricata ${index + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <Button 
            onClick={addVisit} 
            className="w-full" 
            disabled={isAddingVisit}
          >
            {isAddingVisit ? (
              <div className="flex items-center justify-center">
                <LoadingSpinnerW />
                <span className="ml-2">Aggiungendo...</span>
              </div>
            ) : (
              'Aggiungi Visita'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
