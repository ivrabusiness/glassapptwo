import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

import { Upload, Trash2, Camera, RefreshCw, AlertCircle, CheckCircle, Image, User, Scissors } from 'lucide-react';

const AVATAR_BUCKET = 'avatars';

const Avatar: React.FC = () => {
  const { user, refreshSession, updateUserMetadata } = useAuth();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    }
  }, [user]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Slika ne smije biti veća od 2MB');
        return;
      }

      // Check file type
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) {
        setError('Dozvoljeni formati: JPG, PNG, GIF');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error handling file select:', err);
      setError(err instanceof Error ? err.message : 'Greška pri odabiru slike');
    }
  };

  const uploadAvatar = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      setUploading(true);
      setError(null);
      
      const fileInput = document.getElementById('avatar') as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        throw new Error('Molimo odaberite sliku za upload');
      }

      const file = fileInput.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

      // Update user metadata with avatar URL
      const { error: updateError } = await updateUserMetadata({
        avatar_url: data.publicUrl
      });

      if (updateError) {
        throw updateError;
      }

      // Refresh session to get updated user data
      await refreshSession();
      
      setAvatarUrl(data.publicUrl);
      setPreviewUrl(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Greška pri uploadu slike');
    } finally {
      setUploading(false);
      // Reset file input
      const fileInput = document.getElementById('avatar') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const cancelUpload = () => {
    setPreviewUrl(null);
    const fileInput = document.getElementById('avatar') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const removeAvatar = async () => {
    try {
      setLoading(true);
      setError(null);

      // If there's an existing avatar, try to delete it from storage
      if (avatarUrl) {
        // Extract file path from URL
        const urlParts = avatarUrl.split('/');
        const filePath = urlParts[urlParts.length - 1];
        
        // Delete file from storage (don't throw error if this fails)
        await supabase.storage
          .from(AVATAR_BUCKET)
          .remove([filePath]);
      }

      // Update user metadata to remove avatar URL
      const { error: updateError } = await updateUserMetadata({
        avatar_url: null
      });

      if (updateError) {
        throw updateError;
      }

      // Refresh session to get updated user data
      await refreshSession();
      
      setAvatarUrl(null);
      setPreviewUrl(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error removing avatar:', err);
      setError(err instanceof Error ? err.message : 'Greška pri uklanjanju slike');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Profilna slika</h2>
      <p className="text-gray-600 mb-6">Postavite ili ažurirajte svoju profilnu sliku</p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Profilna slika je uspješno ažurirana!</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Avatar Display */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 rounded-lg border border-gray-200 shadow-sm w-full">
            <h3 className="text-center text-sm font-medium text-gray-900 mb-4">Trenutna slika</h3>
            
            <div className="flex justify-center">
              <div className="relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="h-48 w-48 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-48 w-48 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white text-6xl font-bold shadow-lg">
                    {user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-10 w-10 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.full_name || 'Korisnik'}
              </p>
              <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
            </div>
            
            {avatarUrl && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={removeAvatar}
                  disabled={loading || uploading}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ukloni sliku
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Upload Form */}
        <div>
          {previewUrl ? (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Pregled prije spremanja</h3>
              
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="h-48 w-48 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gray-600 text-white p-2 rounded-full shadow-lg">
                    <Scissors className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={cancelUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Odustani
                </button>
                <button
                  onClick={uploadAvatar}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Spremi sliku
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Promijeni profilnu sliku</h3>
              
              <div className="mb-6">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-12 h-12 mb-3 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-700 font-medium">Kliknite za odabir slike</p>
                      <p className="text-xs text-gray-600">SVG, PNG, JPG ili GIF (max. 2MB)</p>
                    </div>
                    <input 
                      id="avatar" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileSelect}
                      disabled={uploading || loading}
                    />
                  </label>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center">
                  <Image className="h-5 w-5 text-gray-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-800">Upute za profilnu sliku</h4>
                </div>
                <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Maksimalna veličina datoteke: 2MB</li>
                  <li>Podržani formati: JPG, PNG, GIF</li>
                  <li>Preporučena dimenzija: kvadratna (1:1 omjer)</li>
                  <li>Slika će biti prikazana kao kružna</li>
                </ul>
              </div>
            </form>
          )}
          
          <div className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-sm font-medium text-gray-800">Savjeti za dobru profilnu sliku:</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Koristite sliku dobrog osvjetljenja</li>
              <li>Izaberite neutralnu pozadinu</li>
              <li>Fokusirajte se na lice (za osobne profile)</li>
              <li>Za poslovne profile možete koristiti logo tvrtke</li>
              <li>Izbjegavajte slike s više osoba ili previše detalja</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Avatar;
