import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchAccessibleCompanies } from'../../features/company/api/companyApi';
import { PageLoading } from '../ui';

export function CompanyContextGuard({ children }: { children: React.ReactNode }) {
    const { token, user, activeCompanyId, setActiveCompany } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch accessible companies
    const { data: companiesRes, isLoading, isError } = useQuery({
        queryKey: ['accessible-companies'],
        queryFn: fetchAccessibleCompanies,
        enabled: !!token,
        retry: 1,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (isLoading || !companiesRes || isError) return;

        const companies = companiesRes.data || [];
        
        // If user has NO accessible companies, force them to Setup Wizard
        // (unless they are already on the setup wizard)
        if (companies.length === 0) {
            if (location.pathname !== '/setup-wizard') {
                navigate('/setup-wizard', { replace: true });
            }
            return;
        }

        // If they have companies but no active company selected, auto-select the first one
        if (companies.length > 0 && !activeCompanyId) {
            // Default to ERPQu / Headquarter if it exists, else the first one
            const defaultCompany = companies.find((c: any) => c.name === 'ERP-QU' || c.code === 'ERP-QU' || c.is_group) || companies[0];
            setActiveCompany(defaultCompany.id, defaultCompany.name);
        }

        // If they are on setup-wizard but already have a company, redirect to launchpad
        if (companies.length > 0 && location.pathname === '/setup-wizard') {
            navigate('/launchpad', { replace: true });
        }

    }, [companiesRes, isLoading, isError, activeCompanyId, location.pathname, navigate, setActiveCompany]);

    if (isLoading) {
        return <PageLoading />;
    }

    return <>{children}</>;
}
