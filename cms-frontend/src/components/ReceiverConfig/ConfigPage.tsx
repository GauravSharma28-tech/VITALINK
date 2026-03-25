import { useState } from 'react';
import NavSub from '../NavSub';
import ConfigList from './ConfigList';
import { useNavigate } from 'react-router-dom';
import { RiAddCircleLine } from 'react-icons/ri';
import ConfigSettings from './ConfigSettings';

const ConfigPage = () => {
  const navigate = useNavigate();
  const menuOptions = ['zones', 'settings'];
  const [selectedOption, setSelectedOption] = useState('zones');
  return (
    <div className="mt-10 overflow-x-auto px-5">
      <div className="flex items-center justify-between mb">
        <NavSub
          options={menuOptions}
          selectedOption={selectedOption}
          onSelect={setSelectedOption}
        />

        <button
          onClick={() => navigate('/configure-add')}
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 py-2 px-4 rounded-md text-white text-sm font-medium transition-colors duration-200 shadow-sm w-full sm:w-auto">
          <div className="text-lg">
            <RiAddCircleLine />
          </div>
          <div>Add Configuration</div>
        </button>
      </div>
      <hr className="text-gray-300 w-full mb-8" />
      {selectedOption === 'zones' && <ConfigList />}
      {selectedOption === 'settings' && <ConfigSettings />}
    </div>
  );
};

export default ConfigPage;
