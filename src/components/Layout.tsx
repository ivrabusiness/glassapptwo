import React, { useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import NotificationIcon from './notifications/NotificationIcon';
import { 
  Package, 
  ShoppingCart,
  Briefcase,
  FileText, 
  BarChart3,
  Cog,
  Menu,
  X,
  User,
  LogOut,
  Building,
  Users,
  ChevronDown,
  Truck,
  UserCircle,
  FileCheck,
  Plus,
  Settings,
  ClipboardList,
  LayoutDashboard,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [managementDropdownOpen, setManagementDropdownOpen] = useState(false);
  const [documentsDropdownOpen, setDocumentsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const managementDropdownRef = useRef<HTMLDivElement>(null);
  const documentsDropdownRef = useRef<HTMLDivElement>(null);
  
  // Get current page from pathname
  const currentPage = location.pathname.split('/')[1] || 'dashboard';

  // KLJUČNO: Dodaj event listener za klik izvan dropdown-a
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSettingsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (managementDropdownRef.current && !managementDropdownRef.current.contains(event.target as Node)) {
        setManagementDropdownOpen(false);
      }
      if (documentsDropdownRef.current && !documentsDropdownRef.current.contains(event.target as Node)) {
        setDocumentsDropdownOpen(false);
      }
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target as Node)) {
        setProductsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const mainMenuItems = [
    { id: 'dashboard', name: 'Nadzorna ploča', icon: LayoutDashboard },
    { id: 'inventory', name: 'Skladište', icon: Package }
  ];
  
  const productMenuItems = [
    { id: 'products', name: 'Proizvodi', icon: ShoppingCart },
    { id: 'services', name: 'Usluge', icon: Briefcase }
  ];
  
  const documentMenuItems = [
    { id: 'quotes', name: 'Ponude', icon: FileCheck },
    { id: 'work-orders', name: 'Radni nalozi', icon: FileText },
    { id: 'delivery-notes', name: 'Otpremnice', icon: Truck },
  ];

  const settingsMenuItems = [
    { id: 'processes', name: 'Procesi', icon: Cog },
    { id: 'process-management', name: 'Upravljanje nalozima', icon: ClipboardList },
    { id: 'device-management', name: 'Upravljanje uređajima', icon: Smartphone },
    { id: 'suppliers', name: 'Dobavljači', icon: Building },
    { id: 'clients', name: 'Klijenti', icon: Users },
    { id: 'settings', name: 'Postavke', icon: Settings },
  ];

  const isSettingsItem = settingsMenuItems.some(item => item.id === currentPage);
  const isDocumentItem = documentMenuItems.some(item => item.id === currentPage);
  const isProductItem = productMenuItems.some(item => item.id === currentPage);

  const handleLogoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    navigate('/');
    setMobileMenuOpen(false);
    event.currentTarget.blur();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // KLJUČNO: Nova funkcija za direktno kreiranje naloga
  const handleCreateNewOrder = () => {
    // Navigiraj na work-orders stranicu sa state flagom
    navigate('/work-orders', { state: { action: 'create' } });
    
    // Zatvori mobile menu ako je otvoren
    setMobileMenuOpen(false);
  };

  // NOVO: Nova funkcija za direktno kreiranje ponude
  const handleCreateNewQuote = () => {
    // Navigiraj na quotes stranicu sa state flagom
    navigate('/quotes', { state: { action: 'create' } });
    
    // Zatvori mobile menu ako je otvoren
    setMobileMenuOpen(false);
  };

  // KLJUČNO: Funkcija za toggle dropdown-a
  const toggleSettingsDropdown = () => {
    setSettingsDropdownOpen(!settingsDropdownOpen);
  };
  
  // Helper function to render dropdown items
  const renderDropdownItem = (item: { id: string; name: string; icon: any }, setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => {
          navigate(`/${item.id}`);
          setDropdownOpen(false);
        }}
        className={`
          w-full flex items-center px-4 py-2 text-sm transition-colors
          ${currentPage === item.id
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50'
          }
        `}
      >
        <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
        <span>{item.name}</span>
      </button>
    );
  };

  // Funkcija za toggle korisničkog dropdown-a
  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  // Funkcija za toggle upravljanje dropdown-a
  const toggleManagementDropdown = () => {
    setManagementDropdownOpen(!managementDropdownOpen);
  };

  // Funkcija za toggle dokumenata dropdown-a
  const toggleDocumentsDropdown = () => {
    setDocumentsDropdownOpen(!documentsDropdownOpen);
  };
  
  // Funkcija za toggle proizvoda dropdown-a
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const productsDropdownRef = useRef<HTMLDivElement>(null);
  
  const toggleProductsDropdown = () => {
    setProductsDropdownOpen(!productsDropdownOpen);
  };

  // Funkcija za navigaciju na profil
  const navigateToProfile = () => {
    navigate('/profile');
    setUserDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with improved navigation */}
        <header className="bg-gray-800 shadow-lg">
        {/* KLJUČNO: Povećana maksimalna širina s max-w-7xl na max-w-[1600px] */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <button
                  onClick={handleLogoClick}
                  className="text-xl font-bold text-white transition-colors duration-200 focus:outline-none rounded px-2 py-1"
                  title="Idi na početnu stranicu"
                >
                  Svijet stakla
                </button>
              </div>
              
              {/* Upravljanje Dropdown */}
              <nav className="hidden md:ml-8 md:flex md:space-x-1">
                {/* Main Menu Items */}
                {mainMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={`/${item.id}`}
                      className={`
                        flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${currentPage === item.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Products Dropdown */}
                <div className="relative" ref={productsDropdownRef}>
                  <button
                    onClick={toggleProductsDropdown}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isProductItem || productsDropdownOpen
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <ShoppingCart className="mr-3 h-4 w-4" />
                      <span className="font-medium">Proizvodi</span>
                    </div>
                    <ChevronDown className={`ml-2 h-3 w-3 transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Products Dropdown Menu */}
                  {productsDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-52 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {productMenuItems.map((item) => renderDropdownItem(item, setProductsDropdownOpen))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Documents Dropdown */}
                <div className="relative" ref={documentsDropdownRef}>
                  <button
                    onClick={toggleDocumentsDropdown}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isDocumentItem || documentsDropdownOpen
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <ClipboardList className="mr-3 h-4 w-4" />
                      <span className="font-medium">Dokumenti</span>
                    </div>
                    <ChevronDown className={`ml-2 h-3 w-3 transition-transform duration-200 ${documentsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Documents Dropdown Menu */}
                  {documentsDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-52 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {documentMenuItems.map((item) => renderDropdownItem(item, setDocumentsDropdownOpen))}
                      </div>
                    </div>
                  )}
                </div>

                {/* KLJUČNO: Poboljšani Settings Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleSettingsDropdown}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isSettingsItem || settingsDropdownOpen
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <Settings className="mr-3 h-4 w-4" />
                      <span className="font-medium">Upravljanje</span>
                    </div>
                    <ChevronDown className={`ml-2 h-3 w-3 transition-transform duration-200 ${settingsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {settingsDropdownOpen && (
                    <div
                      className="absolute left-0 mt-1 w-52 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                    >
                      <div className="py-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {settingsMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                navigate(`/${item.id}`);
                                setSettingsDropdownOpen(false);
                              }}
                              className={`
                                w-full flex items-center px-4 py-2 text-sm transition-colors
                                ${currentPage === item.id
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                                }
                              `}
                            >
                              <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                              <span>{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right side - User menu and actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <NotificationIcon />
              
              {/* Quick Actions Dropdown */}
              <div className="relative" ref={managementDropdownRef}>
                <button
                  onClick={toggleManagementDropdown}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Novo</span>
                  <ChevronDown className={`ml-2 h-3 w-3 transition-transform duration-200 ${managementDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Quick Actions Dropdown */}
                {managementDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleCreateNewQuote();
                          setManagementDropdownOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <FileCheck className="mr-3 h-4 w-4 text-purple-600" />
                        <span>Nova ponuda</span>
                      </button>
                      <button
                        onClick={() => {
                          handleCreateNewOrder();
                          setManagementDropdownOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                      >
                        <FileText className="mr-3 h-4 w-4 text-green-600" />
                        <span>Novi radni nalog</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white p-2 rounded-md transition-colors"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      className="h-8 w-8 rounded-full object-cover border-2 border-gray-700"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm">{user?.user_metadata?.full_name || user?.email}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={navigateToProfile}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <UserCircle className="mr-3 h-4 w-4 text-blue-600" />
                        Moj profil
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="mr-3 h-4 w-4 text-red-600" />
                        Odjava
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-700">
              {/* Logo button in mobile menu */}
              <button
                onClick={() => {
                  navigate('/dashboard');
                  setMobileMenuOpen(false); 
                }}
                className="w-full flex items-center px-3 py-2 text-lg font-bold text-white bg-gray-800 rounded-md mb-4"
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Svijet stakla - Početna
              </button>

              {/* Main Menu Items */}
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(`/${item.id}`);
                      setMobileMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${currentPage === item.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </button>
                );
              })}

              {/* Products Section */}
              <div className="pt-2 border-t border-gray-600">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Proizvodi i usluge
                </div>
                {productMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/${item.id}`);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${currentPage === item.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </button>
                  );
                })}
              </div>

              {/* Documents Section */}
              <div className="pt-2 border-t border-gray-600">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Dokumenti
                </div>
                {documentMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/${item.id}`);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${currentPage === item.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </button>
                  );
                })}
              </div>

              {/* Settings Section */}
              <div className="pt-2 border-t border-gray-600">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Upravljanje
                </div>
                {settingsMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/${item.id}`);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${currentPage === item.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
              
              {/* Mobile New Quote Button */}
              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Brze akcije</h3>
                <button
                  onClick={() => {
                    handleCreateNewQuote(); 
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                >
                  <FileCheck className="h-4 w-4 mr-3" />
                  Nova ponuda
                </button>
                
                <button
                  onClick={() => {
                    handleCreateNewOrder();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Novi radni nalog
                </button>
              </div>

              {/* Mobile User Profile Button */}
              <button
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 mt-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <UserCircle className="h-4 w-4 mr-3" />
                Moj profil
              </button>

              {/* Mobile User Info */}
              <div className="pt-4 border-t border-gray-600">
                <div className="flex items-center px-3 py-2 text-gray-300">
                  <User className="h-4 w-4 mr-2" />
                  <span className="text-sm">{user?.user_metadata?.full_name || user?.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-600 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Odjava
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
