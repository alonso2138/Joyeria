import React, { useEffect, useState } from 'react';
import { fetchCustomRequests } from '../../services/api';
import { CustomRequest } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';

const AdminCustomRequestsPage: React.FC = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<CustomRequest | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const data = await fetchCustomRequests(token);
        setRequests(data);
      } catch (err) {
        console.error('Error fetching custom requests', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner text="Cargando encargos..." /></div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-serif">Encargos personalizados</h1>
          <span className="text-sm text-gray-400">{requests.length} registros</span>
        </div>
        <div className="bg-black bg-opacity-30 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-black bg-opacity-50 uppercase tracking-wider">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Material</th>
                <th className="p-3">Resumen</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer" onClick={() => setSelected(req)}>
                  <td className="p-3">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{req.pieceType}</td>
                  <td className="p-3">{req.material}</td>
                  <td className="p-3 text-gray-300 truncate max-w-xs">{req.description || req.details || '-'}</td>
                  <td className="p-3 text-[var(--primary-color)]">Pendiente</td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && <p className="p-6 text-center text-gray-400">Sin encargos aun.</p>}
        </div>
      </div>

      {selected && (
        <div className="w-full lg:w-96 bg-black bg-opacity-40 border border-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Detalle</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">Cerrar</button>
          </div>
          <p className="text-sm text-gray-400">{new Date(selected.createdAt).toLocaleString()}</p>
          <p><strong>Tipo:</strong> {selected.pieceType}</p>
          <p><strong>Material:</strong> {selected.material}</p>
          {selected.measurements && <p><strong>Medidas:</strong> {selected.measurements}</p>}
          {selected.stonesOrColors && <p><strong>Piedra:</strong> {selected.stonesOrColors}</p>}
          {selected.engraving && <p><strong>Grabado:</strong> {selected.engraving}</p>}
          {selected.description && <p className="text-gray-300 whitespace-pre-wrap"><strong>Descripcion:</strong> {selected.description}</p>}
          {selected.customerName && <p><strong>Cliente:</strong> {selected.customerName}</p>}
          {selected.customerEmail && <p><strong>Email:</strong> {selected.customerEmail}</p>}
          {selected.customerPhone && <p><strong>Tel:</strong> {selected.customerPhone}</p>}
          {selected.imageBase64 && <img src={selected.imageBase64} alt="Generada" className="w-full rounded-md border border-gray-700" />}
        </div>
      )}
    </div>
  );
};

export default AdminCustomRequestsPage;
