import React from 'react';
import { ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownFold, Bell, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Patient, Visit } from '../types';
import { isLastVisitOld } from '../utils/helperFunctions';

interface PatientsListProps {
  patients: Patient[];
  sortField: keyof Patient;
  sortDirection: 'asc' | 'desc';
  expandedPatients: Set<number>;
  localLoading: boolean;
  handleSort: (field: keyof Patient) => void;
  togglePatientExpansion: (patientId: number) => void;
  deletePatient: (patientId: number) => void;
  mainDeleteVisit: (patientId: number, visitDate: string) => void;
  setSelectedPatient: (patient: Patient) => void;
  setSelectedVisit: (visit: Visit) => void;
  setIsEditMode: (isEdit: boolean) => void;
}

export const PatientsList: React.FC<PatientsListProps> = ({
  patients,
  sortField,
  sortDirection,
  expandedPatients,
  localLoading,
  handleSort,
  togglePatientExpansion,
  deletePatient,
  mainDeleteVisit,
  setSelectedPatient,
  setSelectedVisit,
  setIsEditMode
}) => {
  const renderPatientRow = (patient: Patient) => {
    const { isOld, lastVisitDate } = isLastVisitOld(patient.visits);
    return (
      <tr key={patient.id}>
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
    );
  };

  const renderVisitRow = (patient: Patient, visit: Visit, index: number) => (
    <tr key={`${patient.id}-${index}`} className="bg-gray-50">
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
              <DialogTitle>Dettagli Visita</DialogTitle>
            </DialogHeader>
            {/* VisitDetails component will be rendered here */}
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
  );

  return (
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
              {patients.map((patient) => (
                <React.Fragment key={patient.id}>
                  {renderPatientRow(patient)}
                  {expandedPatients.has(patient.id!) && patient.visits.map((visit, index) => (
                    renderVisitRow(patient, visit, index)
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
