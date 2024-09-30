'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ButtonProps } from "@/components/ui/button"

interface GoBackButtonProps extends ButtonProps {
    size?: 'default' | 'sm' | 'lg'
}

export function GoBackButton({ className, size = 'default', ...props }: GoBackButtonProps) {
    const router = useRouter()

    const handleGoBack = () => {
        router.back()
    }

    return (
        <Button
            onClick={handleGoBack}
            size={size}
            className={cn(className)}
            {...props}
        >
            Go Back
        </Button>
    )
}