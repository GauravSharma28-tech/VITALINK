import { IconType } from 'react-icons';
import logo from '../assets/images/logo.png';
import { menuLinks, adminLinks } from '../constants';
import { accountLinks } from '../constants';
import { useContext } from 'react';
import GlobalContext from '../context/GlobalContext';
import { Link } from 'react-router-dom';

interface NavLink {
  label: string;
  href: string;
  symbol: IconType;
}

const Nav = () => {
  const { selectedMenu, setSelectedMenu, auth } = useContext(GlobalContext);
  const isActive = (href: string) => {
    return (
      location.pathname === href ||
      (href !== '/' && location.pathname.startsWith(href))
    );
  };

  return (
    <div className="flex flex-col w-64 h-full bg-white shadow-md z-10 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* logo */}
        <div className="flex justify-center items-center py-6 border-b border-gray-100">
          <img src={logo} className="w-32 h-auto" />
        </div>

        {/* Menu */}
        <nav className="py-6 flex-1">
          <h1 className="text-md text-gray-600 font-semibold uppercase tracking-wider px-8 mb-4">
            Menu
          </h1>
          <ul>
            {menuLinks.map((item: NavLink) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  onClick={() => setSelectedMenu(item.label)}
                  className={`flex items-center px-8 py-3 rounded-lg rounded-r-full transition-colors duration-200 group ${isActive(item.href)
                      ? 'bg-green-100 text-green-600 font-semibold'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                    }`}>
                  <item.symbol
                    className={`w-5 h-5 mr-3 ${isActive(item.href)
                        ? 'text-green-600'
                        : 'text-gray-500 group-hover:text-green-600'
                      }`}
                  />
                  <span className="text-md">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Admin Menu (only for admin users) */}
        {auth.role === 'admin' && (
          <>
            <div className="border-t border-gray-100 my-4" />
            <nav className="py-6">
              <h1 className="text-md text-gray-600 font-semibold uppercase tracking-wider px-8 mb-4">
                Admin
              </h1>
              <ul>
                {adminLinks.map((item: NavLink) => (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      onClick={() => setSelectedMenu(item.label)}
                      className={`flex items-center px-8 py-3 rounded-lg rounded-r-full transition-colors duration-200 group ${isActive(item.href)
                          ? 'bg-purple-100 text-purple-600 font-semibold'
                          : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                        }`}>
                      <item.symbol
                        className={`w-5 h-5 mr-3 ${isActive(item.href)
                            ? 'text-purple-600'
                            : 'text-gray-500 group-hover:text-purple-600'
                          }`}
                      />
                      <span className="text-md">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}

        <div className="border-t border-gray-100 my-4" />

        {/* Account */}
        <nav className="py-6">
          <h1 className="text-md text-gray-600 font-semibold uppercase tracking-wider px-8 mb-4">
            Account
          </h1>
          <ul className="space-y-1">
            {accountLinks.map((item: NavLink) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  onClick={() => setSelectedMenu(item.label)}
                  className={`flex items-center px-8 py-3 rounded-lg rounded-r-full transition-colors duration-200 group ${isActive(item.href)
                      ? 'bg-violet-100 text-violet-600 font-semibold'
                      : 'text-gray-700 hover:bg-violet-50 hover:text-violet-600'
                    }`}>
                  <item.symbol
                    className={`w-5 h-5 mr-3 ${isActive(item.href)
                        ? 'text-violet-600'
                        : 'text-gray-500 group-hover:text-violet-600'
                      }`}
                  />
                  <span className="text-md">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Nav;

