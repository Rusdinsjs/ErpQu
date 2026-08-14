import React, { lazy } from 'react';
import { Card } from '../../components/ui/Card';
import { Construction } from 'lucide-react';

interface HrGenericViewProps {
    title?: string;
    description?: string;
}

export default function HrGenericView({ title = "Module Under Development", description = "Modul ini sedang dalam tahap pengembangan." }: HrGenericViewProps) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-muted-foreground mt-1">{description}</p>
            </div>

            <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-700 bg-slate-800/20">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Construction size={32} />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Segera Hadir</h2>
                <p className="text-muted-foreground max-w-md">
                    Fitur ini belum dapat diakses karena masih dalam tahap pengembangan.
                </p>
            </Card>
        </div>
    );
}// HR Fase 4 - Payroll
// HR Fase 5 - Loans, Claims & KPI
// HR Fase 6 - Recruitment ATS, Training & Disciplinary Actions
const HrGenericView = lazy(() => import('../../pages/HR/HrGenericView'));

