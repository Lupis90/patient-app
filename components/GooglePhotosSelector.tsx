import React, { useState, useEffect, useCallback } from 'react';
   import { useGoogleLogin } from '@react-oauth/google';
   import axios from 'axios';
   import { Button } from '@/components/ui/button';
   import Image from 'next/image';
   
   interface Photo {
     name: string;
     type: string;
     data: string;
   }

   interface GooglePhotosSelectorProps {
     onPhotoSelect: (photos: Photo[]) => void;
   }

   interface GooglePhotosResponse {
     mediaItems?: Array<{ id: string; baseUrl: string }>;
   }

   const GooglePhotosSelector: React.FC<GooglePhotosSelectorProps> = ({ onPhotoSelect }) => {
     const [accessToken, setAccessToken] = useState<string | null>(null);
     const [photos, setPhotos] = useState<Array<{ id: string; baseUrl: string }>>([]);
     const [selectedPhotos, setSelectedPhotos] = useState<Array<{ id: string; baseUrl: string }>>([]);
     const [isLoading, setIsLoading] = useState(false);

     const login = useGoogleLogin({
       onSuccess: (tokenResponse) => {
         console.log("Login successful, token:", tokenResponse.access_token);
         setAccessToken(tokenResponse.access_token);
       },
       onError: (error) => console.error("Login Failed:", error),
       scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
     });

     const fetchPhotos = useCallback(async () => {
       if (!accessToken) return;
       setIsLoading(true);
       try {
         const response = await axios.get<GooglePhotosResponse>('https://photoslibrary.googleapis.com/v1/mediaItems', {
           headers: { Authorization: `Bearer ${accessToken}` },
           params: { pageSize: 50 },
         });
         setPhotos(response.data.mediaItems || []);
       } catch (error) {
         console.error('Error fetching photos:', error);
       } finally {
         setIsLoading(false);
       }
     }, [accessToken]);
  useEffect(() => {
    if (accessToken) {
      fetchPhotos();
    }
  }, [accessToken, fetchPhotos]);

  const handlePhotoSelect = (photo: { id: string; baseUrl: string }) => {
    setSelectedPhotos(prev => 
      prev.some(p => p.id === photo.id)
        ? prev.filter(p => p.id !== photo.id)
        : [...prev, photo]
    );
  };

  const handleConfirmSelection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/download-google-photos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: selectedPhotos }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to download photos');
      }
      
      const downloadedPhotos: Photo[] = await response.json();
      console.log('Downloaded photos:', downloadedPhotos.length);
      onPhotoSelect(downloadedPhotos);
      setSelectedPhotos([]);
    } catch (error) {
      console.error('Error downloading photos:', error);
      // Handle the error (e.g., show a message to the user)
    } finally {
      setIsLoading(false);
    }
  };

  if (!accessToken) {
    return <Button onClick={() => login()}>Accedi con Google</Button>;
  }

  if (isLoading && photos.length === 0) {
    return <div>Caricamento foto...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Seleziona foto da Google Photos</h3>
      {photos.length === 0 ? (
        <div>Nessuna foto trovata. <Button onClick={fetchPhotos}>Riprova</Button></div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative cursor-pointer ${
                selectedPhotos.some((p) => p.id === photo.id) ? 'border-2 border-blue-500' : ''
              }`}
              onClick={() => handlePhotoSelect(photo)}
            >
              <Image src={photo.baseUrl} alt="Google Photo" className="w-full h-32 object-cover" />
            </div>
          ))}
        </div>
      )}
      <Button 
        onClick={handleConfirmSelection} 
        disabled={selectedPhotos.length === 0 || isLoading}
      >
        {isLoading ? 'Downloading...' : `Confirm selection (${selectedPhotos.length})`}
      </Button>
    </div>
  );
};

export default GooglePhotosSelector;