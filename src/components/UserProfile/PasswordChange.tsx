import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react';

const PasswordChange: React.FC = () => {
  const { reauthenticate, updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Check password strength if the field is newPassword
    if (name === 'newPassword') {
      const strength = {
        score: 0,
        hasMinLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecial: /[^A-Za-z0-9]/.test(value)
      };
      
      // Calculate score (1 point for each criteria met)
      strength.score = [
        strength.hasMinLength,
        strength.hasUppercase,
        strength.hasLowercase,
        strength.hasNumber,
        strength.hasSpecial
      ].filter(Boolean).length;
      
      setPasswordStrength(strength);
    }
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError('Molimo unesite trenutnu lozinku');
      return false;
    }
    
    if (!formData.newPassword) {
      setError('Molimo unesite novu lozinku');
      return false;
    }
    
    if (formData.newPassword.length < 6) {
      setError('Nova lozinka mora imati najmanje 6 znakova');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Nova lozinka i potvrda lozinke se ne podudaraju');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // First, verify the current password by reauthenticating
      const { error: signInError } = await reauthenticate(formData.currentPassword);

      if (signInError) {
        throw new Error('Trenutna lozinka nije ispravna');
      }

      // Then update the password via context helper
      const { error: updateError } = await updatePassword(formData.newPassword);

      if (updateError) throw updateError;
      
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Reset password strength
      setPasswordStrength({
        score: 0,
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false
      });
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Greška pri promjeni lozinke');
    } finally {
      setLoading(false);
    }
  };

  // Get password strength color and text
  const getStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-gray-200';
    if (passwordStrength.score < 2) return 'bg-red-500';
    if (passwordStrength.score < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength.score === 0) return '';
    if (passwordStrength.score < 2) return 'Slaba';
    if (passwordStrength.score < 4) return 'Srednja';
    return 'Jaka';
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Promjena lozinke</h2>
      <p className="text-gray-600 mb-6">Ažurirajte svoju lozinku za povećanje sigurnosti</p>
      
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
              <p className="text-sm font-medium text-green-800">Lozinka je uspješno promijenjena!</p>
              <p className="text-sm text-green-700 mt-1">Vaša nova lozinka je spremljena i aktivna.</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Trenutna lozinka
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Unesite trenutnu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nova lozinka
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Unesite novu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Password strength meter */}
              {formData.newPassword && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Jačina lozinke:</span>
                    <span className="text-xs font-medium">
                      {getStrengthText() && (
                        <span className={`px-2 py-0.5 rounded-full ${
                          passwordStrength.score < 2 ? 'bg-red-100 text-red-800' :
                          passwordStrength.score < 4 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {getStrengthText()}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                      style={{ width: `${passwordStrength.score * 20}%` }}
                    ></div>
                  </div>
                  
                  {/* Password requirements */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${passwordStrength.hasMinLength ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-xs ${passwordStrength.hasMinLength ? 'text-green-700' : 'text-gray-500'}`}>
                        Najmanje 8 znakova
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${passwordStrength.hasUppercase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-xs ${passwordStrength.hasUppercase ? 'text-green-700' : 'text-gray-500'}`}>
                        Veliko slovo
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${passwordStrength.hasLowercase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-xs ${passwordStrength.hasLowercase ? 'text-green-700' : 'text-gray-500'}`}>
                        Malo slovo
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${passwordStrength.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-xs ${passwordStrength.hasNumber ? 'text-green-700' : 'text-gray-500'}`}>
                        Broj
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${passwordStrength.hasSpecial ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={`text-xs ${passwordStrength.hasSpecial ? 'text-green-700' : 'text-gray-500'}`}>
                        Poseban znak
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Potvrda nove lozinke
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent ${
                    formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="Ponovite novu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Password match indicator */}
              {formData.newPassword && formData.confirmPassword && (
                <div className="mt-1">
                  {formData.newPassword === formData.confirmPassword ? (
                    <p className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Lozinke se podudaraju
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Lozinke se ne podudaraju
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-500">
            <Shield className="h-4 w-4 text-gray-500 mr-2" />
            <span>Redovito mijenjajte lozinku za veću sigurnost</span>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Spremam...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Promijeni lozinku
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center mb-3">
          <Shield className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-800">Savjeti za sigurnu lozinku</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Preporučeno:</h4>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Koristite minimalno 8 znakova</li>
              <li>Kombinirajte velika i mala slova</li>
              <li>Dodajte brojeve i posebne znakove</li>
              <li>Koristite jedinstvenu lozinku za svaki račun</li>
              <li>Mijenjajte lozinku svakih 90 dana</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Izbjegavajte:</h4>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Osobne podatke (ime, datum rođenja)</li>
              <li>Jednostavne nizove (123456, abcdef)</li>
              <li>Česte lozinke (password, admin)</li>
              <li>Korištenje iste lozinke na više mjesta</li>
              <li>Zapisivanje lozinke na papir ili u nezaštićene datoteke</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordChange;
