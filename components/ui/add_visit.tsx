import React, { useState, useMemo } from 'react';
import { Camera, Calendar, Users, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';

interface Photo {
  name: string;
  type: string;
  data: string;
}

interface Visit {
  id: number;
  patientName: string;
  date: string;
  photos: Photo[];
}

const PatientVisitApp: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [newVisit, setNewVisit] = useState<Visit>({ id: 0, patientName: '', date: '', photos: [] });
  const [sortField, setSortField] = useState<keyof Visit>('patientName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVisit({ ...newVisit, [e.target.name]: e.target.value });
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
        setNewVisit(prev => ({ ...prev, photos: [...prev.photos, ...photoData] }));
      });
    }
  };

  const addVisit = () => {
    const visit: Visit = { ...newVisit, id: Date.now() };
    setVisits([...visits, visit]);
    setNewVisit({ id: 0, patientName: '', date: '', photos: [] });
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

  const removePhoto = (index: number) => {
    setNewVisit(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Patient Visit Tracker</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Add New Visit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <Users className="mr-2" />
              <Input
                name="patientName"
                value={newVisit.patientName}
                onChange={handleInputChange}
                placeholder="Patient Name"
              />
            </div>
            <div className="flex items-center">
              <Calendar className="mr-2" />
              <Input
                type="date"
                name="date"
                value={newVisit.date}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex items-center">
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
            <div className="grid grid-cols-4 gap-2">
              {newVisit.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <Image
                    src={photo.data}
                    alt={`Uploaded ${index + 1}`}
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
            <Button onClick={addVisit} className="w-full">Add Visit</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patient Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">
                    <Button variant="ghost" onClick={() => handleSort('patientName')}>
                      Patient Name
                      {sortField === 'patientName' && (sortDirection === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-left p-2">
                    <Button variant="ghost" onClick={() => handleSort('date')}>
                      Date
                      {sortField === 'date' && (sortDirection === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                    </Button>
                  </th>
                  <th className="text-left p-2">Photos</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td className="p-2">{visit.patientName}</td>
                    <td className="p-2">{visit.date}</td>
                    <td className="p-2">{visit.photos.length}</td>
                    <td className="p-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" onClick={() => setSelectedVisit(visit)}>View</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Visit Details</DialogTitle>
                          </DialogHeader>
                          {selectedVisit && (
                            <div>
                              <p><strong>Patient:</strong> {selectedVisit.patientName}</p>
                              <p><strong>Date:</strong> {selectedVisit.date}</p>
                              <div className="mt-4">
                                <h3 className="font-semibold mb-2">Photos:</h3>
                                <div className="grid grid-cols-2 gap-2">
                                  {selectedVisit.photos.map((photo, index) => (
                                    <Image
                                      key={index}
                                      src={photo.data}
                                      alt={`Visit ${index + 1}`}
                                      width={200}
                                      height={150}
                                      className="w-full h-32 object-cover rounded"
                                    />
                                  ))}
                                </div>
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
};

export default PatientVisitApp;