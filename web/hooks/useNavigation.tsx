'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const useNavigation = () => {
    const pathname = usePathname();
    const [isHomeActive, setIsHomeActive] = useState(false);
    const [isMapActive, setIsMapActive] = useState(false);
    const [isContributeActive, setIsContributeActive] = useState(false);
    const [isAboutActive, setIsAboutActive] = useState(false);

    useEffect(() => {
        setIsHomeActive(false);
        setIsMapActive(false);
        setIsContributeActive(false);
        setIsAboutActive(false);

        switch (pathname) {
            case '/':
                setIsHomeActive(true);
                break;
            case '/map':
                setIsMapActive(true);
                break;
            case '/contribute':
                setIsContributeActive(true);
                break;
            case '/about':
                setIsAboutActive(true);
                break;
            default:
                // Handle any other cases here
                break;
        }
    }, [pathname]);

    return {
        isHomeActive,
        isMapActive,
        isContributeActive,
        isAboutActive,
    };
};

export default useNavigation;
