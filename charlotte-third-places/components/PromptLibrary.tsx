"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"
import { Lightbulb, BookOpen, Laptop, Users, Coffee, MapPin, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromptCategory {
    name: string
    icon: React.ReactNode
    prompts: string[]
}

const promptCategories: PromptCategory[] = [
    {
        name: "Solo Activities",
        icon: <BookOpen className="h-4 w-4" />,
        prompts: [
            "Show me quiet spots in Charlotte where I can read a book alone.",
            "Where should I go in Charlotte if I just want to sit and people-watch?",
            "Show me places where I can work for a few hours without buying a full meal.",
        ],
    },
    {
        name: "Work & Study",
        icon: <Laptop className="h-4 w-4" />,
        prompts: [
            "Find me a cozy coffee shop with strong Wi-Fi and lots of outlets.",
            "Find late-evening spots that are good for studying or laptop work.",
            "What are some laptop-friendly places that don't feel crowded on weekends?",
            "Recommend spots with outdoor seating and access to power outlets.",
        ],
    },
    {
        name: "Groups & Social",
        icon: <Users className="h-4 w-4" />,
        prompts: [
            "Where can a group of 6–8 people meet with a big table and Wi-Fi?",
            "Where can I meet friends to play board games or hang out for a few hours?",
            "What's a good first-date spot that's relaxed and not too loud?",
        ],
    },
    {
        name: "Hidden Gems",
        icon: <Sparkles className="h-4 w-4" />,
        prompts: [
            "What are some underrated hidden-gem cafés around Charlotte?",
            "Recommend Black-owned coffee shops and cafés I should check out.",
            "Suggest libraries or bookstores that feel like true third places.",
        ],
    },
    {
        name: "Location & Amenities",
        icon: <MapPin className="h-4 w-4" />,
        prompts: [
            "Find chill places with free parking on the east side of Charlotte.",
        ],
    },
]

interface PromptLibraryProps {
    onSelectPrompt: (prompt: string) => void
}

export function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
    const [open, setOpen] = useState(false)
    const isMobile = useIsMobile()

    const handleSelectPrompt = (prompt: string) => {
        onSelectPrompt(prompt)
        setOpen(false)
    }

    const TriggerButton = (
        <Button
            variant="ghost"
            size="sm"
            className="gap-2"
        >
            <Lightbulb className="h-4 w-4" />
            <span className="text-sm">Prompt Ideas</span>
        </Button>
    )

    const LibraryContent = (
        <ScrollArea className="h-[60vh] sm:h-[5 00px]">
            <div className="space-y-6 pb-4 pl-1 pr-6">
                {promptCategories.map((category) => (
                    <div key={category.name}>
                        <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                            {category.icon}
                            <span>{category.name}</span>
                        </div>
                        <div className="space-y-2">
                            {category.prompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSelectPrompt(prompt)}
                                    className={cn(
                                        "w-full text-left px-4 py-3 rounded-lg text-sm",
                                        "bg-muted/50 hover:bg-muted transition-colors",
                                        "border border-transparent hover:border-border",
                                        "focus:outline-none"
                                    )}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    {TriggerButton}
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="flex items-center justify-center gap-2">
                            <Lightbulb className="h-5 w-5 text-primary" />
                            Prompt Ideas
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-6">
                        {LibraryContent}
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Prompt Ideas
                    </DialogTitle>
                </DialogHeader>
                {LibraryContent}
            </DialogContent>
        </Dialog>
    )
}
