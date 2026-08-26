import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight, Loader2, Sparkles, Building, Briefcase } from 'lucide-react';
import { setupWizardCreateCompany } from'../features/company/api/companyApi';
import { useAuthStore } from '../store/useAuthStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function SetupWizard() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        legal_name: '',
        industry: '',
        country: 'Indonesia',
        base_currency: 'IDR'
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Auto-fill code if name is entered and code is empty
        if (field === 'name' && !formData.code) {
            const autoCode = value
                .toUpperCase()
                .replace(/[^A-Z0-9\s]/g, '')
                .split(' ')
                .map(word => word[0])
                .join('')
                .substring(0, 4);
            setFormData(prev => ({ ...prev, code: autoCode }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (step === 1) {
            if (!formData.name) {
                setError('Nama Perusahaan wajib diisi');
                return;
            }
            setStep(2);
            return;
        }

        if (step === 2) {
            if (!formData.code) {
                setError('Kode Perusahaan wajib diisi');
                return;
            }
            setError('');
            setLoading(true);

            try {
                const res = await setupWizardCreateCompany(formData);
                if (res.success) {
                    await refreshUser(); // Refresh claims to reflect new membership
                    navigate('/launchpad', { replace: true });
                }
            } catch (err: any) {
                const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal membuat perusahaan. Silakan coba lagi.';
                setError(msg);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] pointer-events-none" />
            <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            
            <div className="w-full max-w-xl relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 mb-4 shadow-xl">
                        <Sparkles size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Selamat Datang, {user?.name?.split(' ')[0]}!
                    </h1>
                    <p className="text-muted-foreground">
                        Mari siapkan ruang kerja (Workspace) pertama Anda.
                    </p>
                </div>

                <div className="bg-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/5">
                    {/* Progress Bar */}
                    <div className="flex h-1 bg-muted">
                        <div className="w-1/2 bg-blue-500 transition-all duration-500" />
                        <div className={`w-1/2 transition-all duration-500 ${step === 2 ? 'bg-blue-500' : 'bg-transparent'}`} />
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-semibold text-foreground">Profil Perusahaan</h2>
                                        <p className="text-sm text-muted-foreground">Informasi dasar tentang organisasi Anda.</p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <Input
                                            label="Nama Perusahaan"
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="PT Sukses Selalu"
                                            icon={<Building2 size={16} />}
                                            autoFocus
                                            required
                                        />
                                        <Input
                                            label="Nama Legal (Opsional)"
                                            value={formData.legal_name}
                                            onChange={(e) => handleChange('legal_name', e.target.value)}
                                            placeholder="Nama lengkap sesuai akta"
                                        />
                                        <Input
                                            label="Industri (Opsional)"
                                            value={formData.industry}
                                            onChange={(e) => handleChange('industry', e.target.value)}
                                            placeholder="Manufaktur, Jasa, Retail..."
                                            icon={<Briefcase size={16} />}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-semibold text-foreground">Detail Sistem</h2>
                                        <p className="text-sm text-muted-foreground">Konfigurasi dasar untuk sistem ERP.</p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <Input
                                            label="Kode Perusahaan / Singkatan"
                                            value={formData.code}
                                            onChange={(e) => handleChange('code', e.target.value)}
                                            placeholder="SKS"
                                            icon={<Building size={16} />}
                                            required
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Negara"
                                                value={formData.country}
                                                onChange={(e) => handleChange('country', e.target.value)}
                                                readOnly
                                            />
                                            <Input
                                                label="Mata Uang Dasar"
                                                value={formData.base_currency}
                                                onChange={(e) => handleChange('base_currency', e.target.value)}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-between border-t border-border/50">
                                {step === 2 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                    >
                                        Kembali
                                    </Button>
                                ) : (
                                    <div />
                                )}
                                
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    loading={loading}
                                    rightIcon={step === 1 ? <ArrowRight size={16} /> : <Plus size={16} />}
                                >
                                    {step === 1 ? 'Selanjutnya' : 'Selesaikan Setup'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <p className="text-center text-sm text-muted-foreground mt-8">
                    Anda dapat menambahkan perusahaan lain nanti melalui modul Organisasi.
                </p>
            </div>
        </div>
    );
}
