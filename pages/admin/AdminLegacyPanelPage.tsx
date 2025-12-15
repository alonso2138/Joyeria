import React from 'react';

/**
 * Renderiza el HTML/CSS/JS del panel legacy dentro de un iframe para aislar estilos/scripts.
 * Copia tu trío de archivos en `public/admin-standalone/index.html` (+ sus assets relativos).
 */
const AdminLegacyPanelPage: React.FC = () => {
    return (
        <div className="h-[calc(100vh-4rem)] -mt-4">
            <iframe
                title="Panel legacy"
                src="/admin-standalone/index.html"
                className="w-full h-full border border-gray-800 rounded-md bg-black"
            />
        </div>
    );
};

export default AdminLegacyPanelPage;
