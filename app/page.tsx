'use client'
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Camera, Calendar, Users, ChevronUp, ChevronDown, X, ChevronRight, ChevronDown as ChevronDownFold, Bell, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from 'next/image';
import GooglePhotosSelector from '@/components/GooglePhotosSelector';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner'; 
import LoadingSpinnerW from '@/components/LoadingSpinnerW';
import { User } from '@supabase/supabase-js';

interface Photo {
  name: string;
  type: string;
  data: string;
}

interface Visit {
  id?: number;
  patient_id: number;
  date: string;
  photos: Photo[];
}

interface Patient {
  id?: number;
  first_name: string;
  last_name: string;
  visits: Visit[];
}

const PatientVisitApp: React.FC = () => {
  const router = useRouter();
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [newVisit, setNewVisit] = useState<{ firstName: string; lastName: string; date: string; photos: Photo[] }>({ firstName: '', lastName: '', date: '', photos: [] });
  const [sortField, setSortField] = useState<keyof Patient>('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showGooglePhotosSelector, setShowGooglePhotosSelector] = useState(false);
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
          };
    fetchUser();
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*');

        if (patientsError) throw patientsError;

        const { data: visitsData, error: visitsError } = await supabase
          .from('visits')
          .select('*');

        if (visitsError) throw visitsError;

        const patientsWithVisits = patientsData.map((patient: Patient) => ({
          ...patient,
          visits: visitsData.filter((visit: Visit) => visit.patient_id === patient.id)
        }));

        setPatients(patientsWithVisits);
      } catch (error) {
        console.error("Error loading data:", error);
        // Here you might want to set an error state and display it to the user
      } finally {
         }
    };

    if (user) {
      loadPatients();
    }
  }, [user, refreshTrigger]);


  const mainDeleteVisit = async (patientId: number, visitDate: string) => {
    try {
      setLocalLoading(true);
      const { error } = await supabase
        .from('visits')
        .delete()
        .match({ patient_id: patientId, date: visitDate });

      if (error) throw error;

      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting visit:", error);
      // Here you might want to show an error message to the user
    } finally {
      setLocalLoading(false);
    }
  };

  const deletePatient = async (patientId: number) => {
    try {
      setLocalLoading(true);
      const { error: visitsError } = await supabase
        .from('visits')
        .delete()
        .match({ patient_id: patientId });

      if (visitsError) throw visitsError;

      const { error: patientError } = await supabase
        .from('patients')
        .delete()
        .match({ id: patientId });

      if (patientError) throw patientError;

      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting patient:", error);
      // Here you might want to show an error message to the user
    } finally {
      setLocalLoading(false);
    }
  };

  const isLastVisitOld = (visits: Visit[]): { isOld: boolean; lastVisitDate?: string } => {
    if (visits.length === 0) return { isOld: false };
    
    const lastVisitDate = new Date(visits[visits.length - 1].date);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    if (lastVisitDate < twoWeeksAgo) {
      return { isOld: true, lastVisitDate: lastVisitDate.toISOString().split('T')[0] };
    }
    
    return { isOld: false };
  };

  const sendNotification = useCallback(async (patientName: string, lastVisitDate: string) => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
  
    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      const title = 'Promemoria Visita Paziente';
      const body = `${patientName} non ha visite da ${lastVisitDate}. Potrebbe essere necessario un controllo.`;
      
      await registration.showNotification(title, { body });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await sendNotification(patientName, lastVisitDate);
      }
    }
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
            return { patient_id: 0, date: '', photos: photoData };
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
        return { patient_id: 0, date: '', photos: photoData };
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
        return { patient_id: 0, date: '', photos: [] };
      });
    } else {
      setNewVisit(prev => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index)
      }));
    }
  };

  const addVisit = async () => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setIsAddingVisit(true);

    try {
      const { firstName, lastName, date, photos } = newVisit;
      
      console.log("Attempting to add visit with data:", { firstName, lastName, date, photosCount: photos.length });

      // Check if patient exists
      const { data: existingPatients, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .eq('user_id', user.id);

      if (patientError) {
        console.error("Error checking existing patients:", patientError);
        throw patientError;
      }

      console.log("Existing patients:", existingPatients);

      let patientId;

      if (existingPatients && existingPatients.length > 0) {
        patientId = existingPatients[0].id;
        console.log("Using existing patient with ID:", patientId);
      } else {
        console.log("Creating new patient");
        // Create new patient
        const { data: newPatient, error: newPatientError } = await supabase
          .from('patients')
          .insert({ 
            user_id: user.id,
            first_name: firstName, 
            last_name: lastName 
          })
          .select();

        if (newPatientError) {
          console.error("Error creating new patient:", newPatientError);
          throw newPatientError;
        }
        patientId = newPatient[0].id;
        console.log("Created new patient with ID:", patientId);
      }

      // Add new visit
      console.log("Adding new visit for patient ID:", patientId);
      const { data: newVisitData, error: visitError } = await supabase
        .from('visits')
        .insert({ patient_id: patientId, date, photos })
        .select();

      if (visitError) {
        console.error("Error adding new visit:", visitError);
        throw visitError;
      }

      console.log("Successfully added new visit:", newVisitData);

      setNewVisit({ firstName: '', lastName: '', date: '', photos: [] });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error adding visit:", error);
      // Here you might want to show an error message to the user
    } finally {
      setIsAddingVisit(false);
    }
  };


  const updateVisit = async () => {
    if (selectedPatient && selectedVisit) {
      try {
        const { error } = await supabase
          .from('visits')
          .update({ date: selectedVisit.date, photos: selectedVisit.photos })
          .match({ id: selectedVisit.id });

        if (error) throw error;

        setRefreshTrigger(prev => prev + 1);
        setIsEditMode(false);
        setSelectedVisit(null);
        setSelectedPatient(null);
      } catch (error) {
        console.error("Error updating visit:", error);
        // Here you might want to show an error message to the user
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
      const { error } = await supabase
        .from('visits')
        .delete()
        .match({ patient_id: patientId, date: visitDate });

      if (error) throw error;

      setRefreshTrigger(prev => prev + 1);
      setSelectedVisit(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error deleting visit:", error);
      // Here you might want to show an error message to the user
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered successfully:', registration);
  
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          });
  
          // Send the subscription to your server
          const response = await fetch('/api/register-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
          });
  
          if (response.ok) {
            console.log('User subscribed to push notifications');
          } else {
            console.error('Failed to register push subscription');
          }
        }
      } catch (error) {
        console.error('Error during Service Worker registration:', error);
      }
    }
  };
  
  // Call this function when the app starts
  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const checkForOldVisits = async () => {
      patients.forEach(patient => {
        const { isOld, lastVisitDate } = isLastVisitOld(patient.visits);
        if (isOld && lastVisitDate) {
          sendNotification(`${patient.first_name} ${patient.last_name}`, lastVisitDate);
        }
      });
    };

    checkForOldVisits();
  }, [patients, sendNotification]);

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
      } 
      else {
        // If no user is logged in, redirect to login
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // Redirect to login page after logout
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
      
      {/* Display User Info */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800 text-white p-4 flex justify-between items-center">
      <p>Logged in as: {user?.email}</p>
        <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded">
          Logout
        </button>
      </div>
  
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
  
      <Card>
        <CardHeader>
          <CardTitle>Pazienti e Visite</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {localLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
              <LoadingSpinner />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">
                    <Button variant="ghost" onClick={() => handleSort('last_name')}>
                      Cognome
                      {sortField === 'last_name' && (sortDirection === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-left p-2">
                    <Button variant="ghost" onClick={() => handleSort('first_name')}>
                      Nome
                      {sortField === 'first_name' && (sortDirection === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-left p-2">Visite</th>
                  <th className="text-left p-2">Azioni</th>
                </tr>
              </thead>
              <tbody>
              {sortedPatients.map((patient) => {
                  const { isOld, lastVisitDate } = isLastVisitOld(patient.visits);
                  return (
                    <React.Fragment key={patient.id}>
                      <tr>
                        <td className="p-2">
                          {patient.last_name}
                          {isOld && lastVisitDate && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Bell className="inline-block ml-2 text-yellow-500" size={16} />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ultima visita: {lastVisitDate}</p>
                                  <p>Più di due settimane fa</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </td>
                        <td className="p-2">{patient.first_name}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientVisitApp;