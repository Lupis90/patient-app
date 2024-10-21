import { useState, useMemo, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { Patient, Visit, Photo } from '../types';

export const usePatientVisit = () => {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [newVisit, setNewVisit] = useState<{ firstName: string; lastName: string; date: string; photos: Photo[] }>({ firstName: '', lastName: '', date: '', photos: [] });
  const [sortField, setSortField] = useState<keyof Patient>('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [isAddingVisit, setIsAddingVisit] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadPatients = async () => {
      if (!user) return;

      setLocalLoading(true);
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

        if (isMounted) {
          setPatients(patientsWithVisits);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        if (isMounted) {
          setLocalLoading(false);
        }
      }
    };

    if (user) {
      loadPatients();
    }

    return () => {
      isMounted = false;
    };
  }, [user, refreshTrigger]);

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [patients, sortField, sortDirection]);

  return {
    user,
    setUser,
    patients,
    setPatients,
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
    refreshTrigger,
    setRefreshTrigger,
    localLoading,
    setLocalLoading,
    operationInProgress,
    setOperationInProgress,
    isAddingVisit,
    setIsAddingVisit,
    sortedPatients
  };
};
