import { useEffect, useState } from "react";

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        // Check on initial load
        checkIsMobile();

        // Add event listener to handle screen resize
        window.addEventListener("resize", checkIsMobile);

        // Clean up event listener on component unmount
        return () => {
            window.removeEventListener("resize", checkIsMobile);
        };
    }, []);

    return isMobile;
};