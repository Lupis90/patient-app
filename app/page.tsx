'use client'
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { usePatientVisit } from './hooks/usePatientVisit';
import { Header } from './components/Header';
import { AddVisitForm } from './components/AddVisitForm';
import { PatientsList } from './components/PatientsList';
import { VisitDetails } from './components/VisitDetails';
import { registerServiceWorker, sendNotification, isLastVisitOld } from './utils/helperFunctions';
import { Patient, Photo } from './types';

const PatientVisitApp: React.FC = () => {
  const router = useRouter();
  const {
    user,
    setUser,
    patients,
    newVisit,
    setNewVisit,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    selectedPatient,
    setSelectedPatient,
    selectedVisit,
    setSelectedVisit,
    isEditMode,
    setIsEditMode,
    expandedPatients,
    setExpandedPatients,
    setRefreshTrigger,
    localLoading,
    setLocalLoading,
    operationInProgress,
    setOperationInProgress,
    isAddingVisit,
    setIsAddingVisit,
    sortedPatients
  } = usePatientVisit();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
      } 
      else {
        router.push('/login');
      }
    };

    fetchUser();
  }, [router, setUser]);

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
  }, [patients]);

  useEffect(() => {
    setLocalLoading(operationInProgress);
  }, [operationInProgress, setLocalLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
            return { patient_id: 0, date: '', photos: photoData };
          });
        } else {
          setNewVisit(prev => ({ ...prev, photos: [...prev.photos, ...photoData] }));
        }
      });
    }
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

  const handleSort = (field: keyof Patient) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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

  const addVisit = async () => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setIsAddingVisit(true);
    setOperationInProgress(true);

    try {
      const { firstName, lastName, date, photos } = newVisit;
      
      console.log("Attempting to add visit with data:", { firstName, lastName, date, photosCount: photos.length });

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
    } finally {
      setIsAddingVisit(false);
      setOperationInProgress(false);
    }
  };

  const updateVisit = async () => {
    if (selectedPatient && selectedVisit) {
      setOperationInProgress(true);
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
      } finally {
        setOperationInProgress(false);
      }
    }
  };

  const deleteVisit = async (patientId: number, visitDate: string) => {
    setOperationInProgress(true);
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
    } finally {
      setOperationInProgress(false);
    }
  };

  const deletePatient = async (patientId: number) => {
    setOperationInProgress(true);
    try {
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
    } finally {
      setOperationInProgress(false);
    }
  };

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
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Registro Visite Pazienti</h1>
      
      <Header user={user} onLogout={handleLogout} />
      
      <AddVisitForm
        newVisit={newVisit}
        handleInputChange={handleInputChange}
        handlePhotoUpload={handlePhotoUpload}
        removePhoto={removePhoto}
        addVisit={addVisit}
        isAddingVisit={isAddingVisit}
      />
      
      <PatientsList
        patients={sortedPatients}
        sortField={sortField}
        sortDirection={sortDirection}
        expandedPatients={expandedPatients}
        localLoading={localLoading}
        handleSort={handleSort}
        togglePatientExpansion={togglePatientExpansion}
        deletePatient={deletePatient}
        mainDeleteVisit={mainDeleteVisit}
        setSelectedPatient={setSelectedPatient}
        setSelectedVisit={setSelectedVisit}
        setIsEditMode={setIsEditMode}
      />
      
      <VisitDetails
        selectedPatient={selectedPatient}
        selectedVisit={selectedVisit}
        isEditMode={isEditMode}
        handleInputChange={handleInputChange}
        handlePhotoUpload={handlePhotoUpload}
        removePhoto={removePhoto}
        updateVisit={updateVisit}
        deleteVisit={deleteVisit}
        setIsEditMode={setIsEditMode}
      />
    </div>
  );
};

export default PatientVisitApp;
