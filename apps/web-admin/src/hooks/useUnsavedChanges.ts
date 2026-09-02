import { useEffect } from 'react';

export function useUnsavedChanges(isDirty: boolean, message = 'Anda memiliki perubahan data yang belum disimpan. Yakin ingin meninggalkan halaman ini?') {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (isDirty) {
                event.preventDefault();
                event.returnValue = message;
                return message;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty, message]);
}
