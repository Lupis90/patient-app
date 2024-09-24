'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { Camera, Calendar, Users, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import Dexie from 'dexie';
import GooglePhotosSelector from '@/components/GooglePhotosSelector';

interface Photo {
  name: string;
  type: string;
  data: string;
}

interface Visit {
  id?: number;
  firstName: string;
  lastName: string;
  date: string;
  photos: Photo[];
}

// Define the database
class PatientVisitsDB extends Dexie {
  visits!: Dexie.Table<Visit, number>;

  constructor() {
    super('PatientVisitsDB');
    this.version(2).stores({
      visits: '++id, firstName, lastName, date'
    });
  }
}

const db = new PatientVisitsDB();

const PatientVisitApp: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [newVisit, setNewVisit] = useState<Visit>({ firstName: '', lastName: '', date: '', photos: [] });
  const [sortField, setSortField] = useState<keyof Visit>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showGooglePhotosSelector, setShowGooglePhotosSelector] = useState(false);

  // Load visits from IndexedDB on initial render
  useEffect(() => {
    const loadVisits = async () => {
      const allVisits = await db.visits.toArray();
      setVisits(allVisits);
    };
    loadVisits();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (isEditMode && selectedVisit) {
      setSelectedVisit({ ...selectedVisit, [name]: value });
    } else {
      setNewVisit({ ...newVisit, [name]: value });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      Promise.all(files.map(file => 
        new Promise<Photo>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ name: file.name, type: file.type, data: reader.result as string });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      )).then(photoData => {
        if (isEditMode && selectedVisit) {
          setSelectedVisit(prev => {
            if (prev) {
              return { ...prev, photos: [...prev.photos, ...photoData] };
            }
            return prev;
          });
        } else {
          setNewVisit(prev => ({ ...prev, photos: [...prev.photos, ...photoData] }));
        }
      });
    }
  };

  const handleGooglePhotoSelect = (selectedPhotos: Array<{ name: string; data: string }>) => {
    const photoData = selectedPhotos.map(photo => ({
      ...photo,
      type: 'image/jpeg',
    }));
  
    if (isEditMode && selectedVisit) {
      setSelectedVisit(prev => {
        if (prev) {
          return { ...prev, photos: [...prev.photos, ...photoData] };
        }
        return prev;
      });
    } else {
      setNewVisit(prev => ({ ...prev, photos: [...prev.photos, ...photoData] }));
    }
  
    setShowGooglePhotosSelector(false);
  };

  const removePhoto = (index: number) => {
    if (isEditMode && selectedVisit) {
      setSelectedVisit(prev => {
        if (prev) {
          return {
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index),
          };
        }
        return prev;
      });
    } else {
      setNewVisit({
        ...newVisit,
        photos: newVisit.photos.filter((_, i) => i !== index),
      });
    }
  };

  const addVisit = async () => {
    try {
      const id = await db.visits.add(newVisit);
      const addedVisit = await db.visits.get(id);
      if (addedVisit) {
        setVisits(prev => [...prev, addedVisit]);
      }
      setNewVisit({ firstName: '', lastName: '', date: '', photos: [] });
    } catch (error) {
      console.error("Errore nell'aggiunta della visita:", error);
    }
  };

  const updateVisit = async () => {
    if (selectedVisit && selectedVisit.id) {
      try {
        await db.visits.update(selectedVisit.id, {
          firstName: selectedVisit.firstName,
          lastName: selectedVisit.lastName,
          date: selectedVisit.date,
          photos: selectedVisit.photos
        });
        setVisits(prev => prev.map(visit => visit.id === selectedVisit.id ? selectedVisit : visit));
        setIsEditMode(false);
        setSelectedVisit(null);
      } catch (error) {
        console.error("Errore nell'aggiornamento della visita:", error);
      }
    }
  };

  const handleSort = (field: keyof Visit) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [visits, sortField, sortDirection]);

  const deleteVisit = async (id: number) => {
    try {
      await db.visits.delete(id);
      setVisits(prev => prev.filter(visit => visit.id !== id));
      setSelectedVisit(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("Errore nell'eliminazione della visita:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Registro Visite Pazienti</h1>
      
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
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="w-full"
              />
              <Button onClick={() => setShowGooglePhotosSelector(true)} className="w-full sm:w-auto">
                Seleziona da Google Photos
              </Button>
            </div>
            {showGooglePhotosSelector && (
              <GooglePhotosSelector onPhotoSelect={handleGooglePhotoSelect} />
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {newVisit.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <Image
                    src={photo.data}
                    alt={`Caricata ${index + 1}`}
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
            <Button onClick={addVisit} className="w-full">Aggiungi Visita</Button>
          </div>
        </CardContent>
      </Card>
  
      <Card>
        <CardHeader>
          <CardTitle>Visite Pazienti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="hidden sm:table-header-group">
                <tr>
                  <th className="text-left p-2">
                    <Button variant="ghost" onClick={() => handleSort('lastName')}>
                      Cognome
                      {sortField === 'lastName' && (sortDirection === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-left p-2">
                    <Button variant="ghost" onClick={() => handleSort('firstName')}>
                      Nome
                      {sortField === 'firstName' && (sortDirection === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-left p-2">
                    <Button variant="ghost" onClick={() => handleSort('date')}>
                      Data
                      {sortField === 'date' && (sortDirection === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-left p-2">Foto</th>
                  <th className="text-left p-2">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {sortedVisits.map((visit) => (
                  <tr key={visit.id} className="block sm:table-row mb-4 sm:mb-0">
                    <td className="block sm:table-cell p-2">
                      <span className="sm:hidden font-bold">Cognome: </span>{visit.lastName}
                    </td>
                    <td className="block sm:table-cell p-2">
                      <span className="sm:hidden font-bold">Nome: </span>{visit.firstName}
                    </td>
                    <td className="block sm:table-cell p-2">
                      <span className="sm:hidden font-bold">Data: </span>{visit.date}
                    </td>
                    <td className="block sm:table-cell p-2">
                      <span className="sm:hidden font-bold">Foto: </span>{visit.photos.length}
                    </td>
                    <td className="block sm:table-cell p-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" onClick={() => {
                            setSelectedVisit(visit);
                            setIsEditMode(false);
                          }}>
                            Visualizza
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-full sm:max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>{isEditMode ? "Modifica Visita" : "Dettagli Visita"}</DialogTitle>
                          </DialogHeader>
                          {selectedVisit && (
                            <div>
                              {isEditMode ? (
                                <>
                                  <Input
                                    name="firstName"
                                    value={selectedVisit.firstName}
                                    onChange={handleInputChange}
                                    placeholder="Nome"
                                    className="mb-2"
                                  />
                                  <Input
                                    name="lastName"
                                    value={selectedVisit.lastName}
                                    onChange={handleInputChange}
                                    placeholder="Cognome"
                                    className="mb-2"
                                  />
                                  <Input
                                    type="date"
                                    name="date"
                                    value={selectedVisit.date}
                                    onChange={handleInputChange}
                                    className="mb-2"
                                  />
                                </>
                              ) : (
                                <>
                                  <p><strong>Paziente:</strong> {selectedVisit.lastName} {selectedVisit.firstName}</p>
                                  <p><strong>Data:</strong> {selectedVisit.date}</p>
                                </>
                              )}
                              <div className="mt-4">
                                <h3 className="font-semibold mb-2">Foto:</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  {selectedVisit.photos.map((photo, index) => (
                                    <div key={index} className="relative">
                                      <Image
                                        src={photo.data}
                                        alt={`Visita ${index + 1}`}
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
                                  <Button onClick={() => setShowGooglePhotosSelector(true)} className="w-full sm:w-auto">
                                    Seleziona da Google Photos
                                  </Button>
                                  {showGooglePhotosSelector && (
                                    <GooglePhotosSelector onPhotoSelect={handleGooglePhotoSelect} />
                                  )}
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
                                      onClick={() => selectedVisit.id && deleteVisit(selectedVisit.id)}
                                      className="w-full sm:w-auto"
                                    >
                                      Elimina Visita
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PatientVisitApp;