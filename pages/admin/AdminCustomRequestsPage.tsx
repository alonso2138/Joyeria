import React, { useEffect, useState } from 'react';
import { fetchCustomRequests } from '../../services/api';
import { CustomRequest } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';

const AdminCustomRequestsPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-serif">Seccion desactivada</h1>
      <p className="text-gray-300">Los encargos personalizados no estan disponibles en este panel.</p>
    </div>
  );
};

export default AdminCustomRequestsPage;
