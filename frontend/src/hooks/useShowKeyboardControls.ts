'use client';

import { useEffect, useState } from 'react';

function hasTouchInput() {
    if (typeof window === 'undefined') return false;

    return window.matchMedia('(pointer: coarse)').matches;
}

export function useShowKeyboardControls(): boolean {
    const [showKeyboardControls, setShowKeyboardControls] = useState(true);

    useEffect(() => {
        function checkInputMethod() {
            setShowKeyboardControls(!hasTouchInput());
        }

        checkInputMethod();

        const mediaQuery = window.matchMedia('(pointer: coarse)');
        mediaQuery.addEventListener('change', checkInputMethod);

        return () => {
            mediaQuery.removeEventListener('change', checkInputMethod);
        };
    }, []);

    return showKeyboardControls;
}
