import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Card } from'../../../components/ui';
import { toast } from 'sonner';
import { resetDatabase } from'../api/settings';
import { useAuthStore } from'../../../store/useAuthStore';

export default function SystemReset() {
    const [confirmText, setConfirmText] = useState('');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const isConfirmed = confirmText === 'RESET DATABASE';

    const mutation = useMutation({
        mutationFn: resetDatabase,
        onSuccess: () => {
            toast.success('Database has been completely reset.');
            // Clear all query caches
            queryClient.clear();
            // We force a page reload and navigate to setup wizard.
            // Setup Wizard logic in CompanyContextGuard will catch if there are 0 companies
            window.location.href = '/setup-wizard';
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to reset database');
        },
    });

    if (user?.role !== 'super_admin') {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
                    <p className="text-gray-500 mt-2">Only Super Administrators can access this area.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <Card className="border-red-500 shadow-xl border-t-4">
                <div className="p-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-red-100 p-3 rounded-full">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Danger Zone</h1>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ShieldAlert className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Factory Reset Warning
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>
                                        This action is <strong>IRREVERSIBLE</strong>. It will permanently delete ALL operational data including Companies, Assets, Invoices, Contracts, and Inventory.
                                    </p>
                                    <p className="mt-2">
                                        User accounts and system roles will be preserved. You will be redirected to the Setup Wizard to reinitialize the system.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            To confirm, please type <span className="font-bold text-red-600">RESET DATABASE</span> below:
                        </label>
                        <Input
                            type="text"
                            placeholder="Type RESET DATABASE here"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full"
                        />

                        <div className="pt-4 flex justify-end">
                            <Button
                                variant="danger"
                                size="lg"
                                disabled={!isConfirmed || mutation.isPending}
                                onClick={() => mutation.mutate()}
                                className="w-full sm:w-auto flex items-center justify-center space-x-2"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>{mutation.isPending ? 'Wiping Data...' : 'Wipe All Operational Data'}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
