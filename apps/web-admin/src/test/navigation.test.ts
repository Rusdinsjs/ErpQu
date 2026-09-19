import { describe, it, expect } from 'vitest';
import { findAllParentGroupIds } from '../features/admin/pages/AdminDashboard';
import type { NavEntry } from '../types/navigation';
import { Building2, Landmark, Boxes } from 'lucide-react';

describe('Navigation Group Ancestor Resolution', () => {
    const mockNavEntries: NavEntry[] = [
        {
            id: 'organization_group',
            label: 'Organization',
            icon: Building2,
            children: [
                { id: 'company', label: 'Company Management', icon: Building2 },
                { id: 'branch', label: 'Branch', icon: Building2 }
            ]
        },
        {
            id: 'asset_management_group',
            label: 'Asset Management',
            icon: Landmark,
            children: [
                {
                    id: 'asset_operations',
                    label: 'Operasional Aset',
                    icon: Boxes,
                    children: [
                        { id: 'assets', label: 'Assets', icon: Boxes },
                        { id: 'locations', label: 'Locations', icon: Boxes }
                    ]
                }
            ]
        }
    ];

    it('should find direct parent group ID for company tab', () => {
        const result = findAllParentGroupIds(mockNavEntries, 'company' as any);
        expect(result).toEqual(['organization_group']);
    });

    it('should find nested ancestor group IDs for deep children (e.g. assets)', () => {
        const result = findAllParentGroupIds(mockNavEntries, 'assets' as any);
        expect(result).toEqual(['asset_management_group', 'asset_operations']);
    });

    it('should return maintenance_group for work-orders', () => {
        const result = findAllParentGroupIds(mockNavEntries, 'work-orders' as any);
        expect(result).toEqual(['maintenance_group']);
    });

    it('should return empty array for non-existent or root tab', () => {
        const result = findAllParentGroupIds(mockNavEntries, 'non-existent' as any);
        expect(result).toEqual([]);
    });
});
