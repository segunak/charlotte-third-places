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
import { Lightbulb, BookOpen, Laptop, Users, Coffee, MapPin, Sparkles, Clock, Armchair, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromptCategory {
    name: string
    icon: React.ReactNode
    prompts: string[]
}

const promptCategories: PromptCategory[] = [
    {
        name: "Cozy Vibes",
        icon: <Armchair className="h-4 w-4" />,
        prompts: [
            "Where can I find a coffee shop with comfy couches to sink into?",
            "Are there any cafés in Charlotte with a fireplace?",
            "Show me cozy, warm spots perfect for a rainy day.",
            "What places feel spacious and spread out, not cramped?",
        ],
    },
    {
        name: "Solo Activities",
        icon: <BookOpen className="h-4 w-4" />,
        prompts: [
            "Where's a good spot to read a book alone on a Saturday morning?",
            "Show me quiet spots in Charlotte where I can journal or write.",
            "Where should I go if I just want to sit and people-watch?",
            "What cafés are good for introverts who want to be alone in public?",
        ],
    },
    {
        name: "Work & Study",
        icon: <Laptop className="h-4 w-4" />,
        prompts: [
            "Find me a coffee shop with strong Wi-Fi and lots of outlets.",
            "Where can I work remotely for a full day without feeling rushed?",
            "What are laptop-friendly places that aren't too crowded on weekends?",
            "Recommend spots with outdoor seating and power outlets.",
        ],
    },
    {
        name: "Late Night",
        icon: <Moon className="h-4 w-4" />,
        prompts: [
            "What coffee shops or cafés stay open late in Charlotte?",
            "Where can I study or work after 8 PM?",
            "Find me late-night spots that aren't bars.",
        ],
    },
    {
        name: "Morning & Weekend",
        icon: <Sun className="h-4 w-4" />,
        prompts: [
            "Where's a great spot for early morning coffee before 7 AM?",
            "What places are best for a lazy Sunday morning?",
            "Show me brunch spots where I can also get work done.",
        ],
    },
    {
        name: "Groups & Social",
        icon: <Users className="h-4 w-4" />,
        prompts: [
            "Where can a group of 6–8 people meet with a big table?",
            "What's a good spot for board games or hanging out for hours?",
            "What's a relaxed first-date spot that's not too loud?",
            "Where can I meet up with friends who have a dog?",
        ],
    },
    {
        name: "Hidden Gems",
        icon: <Sparkles className="h-4 w-4" />,
        prompts: [
            "What are some underrated hidden-gem cafés around Charlotte?",
            "Recommend Black-owned coffee shops and cafés to check out.",
            "Suggest libraries or bookstores that feel like true third places.",
            "What lesser-known spots do locals love?",
        ],
    },
    {
        name: "Food & Drinks",
        icon: <Coffee className="h-4 w-4" />,
        prompts: [
            "Where can I get great hot chocolate in Charlotte?",
            "What places have the best pastries to go with my coffee?",
            "Show me bubble tea shops where I can hang out.",
            "Are there any cafés that serve food beyond just coffee and pastries?",
        ],
    },
    {
        name: "By Neighborhood",
        icon: <MapPin className="h-4 w-4" />,
        prompts: [
            "What are the best third places in South End?",
            "Find me spots to work from in the Ballantyne area.",
            "Show me cafés near Uptown Charlotte.",
            "What's good in NoDa for remote work?",
            "Find chill places with free parking on the east side.",
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
            variant="default"
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
