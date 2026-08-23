'use client';

import useSWR from 'swr';

import { getHealth, healthUrl } from '@/services/backend/health';

const HomePage = () => {
    const { data, error, isLoading } = useSWR(healthUrl, () => getHealth());

    let status = 'checking…';
    let statusClass = 'bg-gray-400';
    if (error) {
        status = 'backend unreachable';
        statusClass = 'bg-red-500';
    } else if (data?.status === 'ok') {
        status = `connected to GraphDB (repository: ${data.repository})`;
        statusClass = 'bg-green-500';
    } else if (!isLoading && data) {
        status = 'backend up, GraphDB unavailable';
        statusClass = 'bg-yellow-500';
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-8">
            <h1 className="text-3xl font-bold">Coupled Modelling Explorer</h1>
            <p className="text-center opacity-70">
                Knowledge base explorer for coupled multiphysics simulations (Kratos CoSimulation → OWL/GraphDB).
            </p>
            <div className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusClass}`} />
                {status}
            </div>
        </main>
    );
};

export default HomePage;
