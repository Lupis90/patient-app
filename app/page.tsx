'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { Camera, Calendar, Users, ChevronUp, ChevronDown, X, ChevronRight, ChevronDown as ChevronDownFold, Bell, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  date: string;
  photos: Photo[];
}

interface Patient {
  id?: number;
  firstName: string;
  lastName: string;
  visits: Visit[];
}

class PatientVisitsDB extends Dexie {
  patients!: Dexie.Table<Patient, number>;

  constructor() {
    super('PatientVisitsDB');
    this.version(3).stores({
      patients: '++id, firstName, lastName'
    });
  }
}

const db = new PatientVisitsDB();

const PatientVisitApp: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [newVisit, setNewVisit] = useState<{ firstName: string; lastName: string; date: string; photos: Photo[] }>({ firstName: '', lastName: '', date: '', photos: [] });
  const [sortField, setSortField] = useState<keyof Patient>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showGooglePhotosSelector, setShowGooglePhotosSelector] = useState(false);
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadPatients = async () => {
      const allPatients = await db.patients.toArray();
      setPatients(allPatients);
    };
    loadPatients();
  }, [refreshTrigger]);

  const mainDeleteVisit = async (patientId: number, visitDate: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        patient.visits = patient.visits.filter(v => v.date !== visitDate);
        await db.patients.put(patient);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Errore nell'eliminazione della visita:", error);
    }
  };

  const deletePatient = async (patientId: number) => {
    try {
      await db.patients.delete(patientId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Errore nell'eliminazione del paziente:", error);
    }
  };

  const isLastVisitOld = (visits: Visit[]) => {
    if (visits.length === 0) return false;
    const lastVisitDate = new Date(visits[visits.length - 1].date);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return lastVisitDate < twoWeeksAgo;
  };

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
            // If prev is null, return a new Visit object
            return { date: '', photos: photoData };
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
                return { date: '', photos: photoData };
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
            photos: prev.photos.filter((_, i) => i !== index)
          };
        }
            return { date: '', photos: [] };
      });
    } else {
      setNewVisit(prev => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index)
      }));
    }
  };
  const addVisit = async () => {
    try {
      const { firstName, lastName, date, photos } = newVisit;
      let patient = patients.find(p => p.firstName === firstName && p.lastName === lastName);
      
      if (!patient) {
        patient = { firstName, lastName, visits: [] };
        const id = await db.patients.add(patient);
        patient.id = id;
      }

      const newVisitObj: Visit = { date, photos };
      patient.visits.push(newVisitObj);

      await db.patients.put(patient);

      setNewVisit({ firstName: '', lastName: '', date: '', photos: [] });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Errore nell'aggiunta della visita:", error);
    }
  };


  const updateVisit = async () => {
    if (selectedPatient && selectedVisit) {
      try {
        const updatedPatient = { ...selectedPatient };
        updatedPatient.visits = updatedPatient.visits.map(visit => 
          visit.date === selectedVisit.date ? selectedVisit : visit
        );

        await db.patients.put(updatedPatient);

        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        setIsEditMode(false);
        setSelectedVisit(null);
        setSelectedPatient(null);
      } catch (error) {
        console.error("Errore nell'aggiornamento della visita:", error);
      }
    }
  };

  const handleSort = (field: keyof Patient) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [patients, sortField, sortDirection]);

  const deleteVisit = async (patientId: number, visitDate: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        patient.visits = patient.visits.filter(v => v.date !== visitDate);
        await db.patients.put(patient);
        setPatients(prev => prev.map(p => p.id === patientId ? patient : p));
        setSelectedVisit(null);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Errore nell'eliminazione della visita:", error);
    }
  };

  const togglePatientExpansion = (patientId: number) => {
    setExpandedPatients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
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
            <Button onClick={addVisit} className="w-full">Aggiungi Visita</Button>
          </div>
        </CardContent>
      </Card>
  
      <Card>
        <CardHeader>
          <CardTitle>Pazienti e Visite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
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
                  <th className="text-left p-2">Visite</th>
                  <th className="text-left p-2">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {sortedPatients.map((patient) => (
                  <React.Fragment key={patient.id}>
                    <tr>
                      <td className="p-2">
                        {patient.lastName}
                        {isLastVisitOld(patient.visits) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Bell className="inline-block ml-2 text-yellow-500" size={16} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ultima visita più di due settimane fa</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </td>
                      <td className="p-2">{patient.firstName}</td>
                      <td className="p-2">{patient.visits.length}</td>
                      <td className="p-2 flex items-center space-x-2">
                        <Button variant="outline" onClick={() => togglePatientExpansion(patient.id!)}>
                          {expandedPatients.has(patient.id!) ? <ChevronDownFold /> : <ChevronRight />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei sicuro di voler eliminare questo paziente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Tutte le visite associate a questo paziente saranno eliminate.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => patient.id && deletePatient(patient.id)}>
                                Conferma
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                    {expandedPatients.has(patient.id!) && patient.visits.map((visit, index) => (
                      <tr key={index} className="bg-gray-50">
                        <td colSpan={2} className="p-2 pl-8">{visit.date}</td>
                        <td className="p-2">{visit.photos.length} foto</td>
                        <td className="p-2 flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" onClick={() => {
                                setSelectedPatient(patient);
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
                              {selectedPatient && selectedVisit && (
                                <div>
                                  <p><strong>Paziente:</strong> {selectedPatient.lastName} {selectedPatient.firstName}</p>
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
                                      {selectedVisit.photos.map((photo, index) => (
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
                                          onClick={() => selectedPatient.id && deleteVisit(selectedPatient.id, selectedVisit.date)}
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Sei sicuro di voler eliminare questa visita?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Questa azione non può essere annullata.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={() => patient.id && mainDeleteVisit(patient.id, visit.date)}>
                                  Conferma
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
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