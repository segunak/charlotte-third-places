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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useIsMobile } from "@/hooks/use-mobile"
import { Icons } from "@/components/Icons"
import { cn } from "@/lib/utils"

interface PromptCategory {
    name: string
    icon: React.ReactNode
    prompts: string[]
}

const promptCategories: PromptCategory[] = [
    {
        name: "Cozy Vibes",
        icon: <Icons.armchair className="h-4 w-4" />,
        prompts: [
            "Where can I find a spot with comfy couches to sink into?",
            "Are there any places in Charlotte with a fireplace?",
            "Show me cozy, warm spots perfect for a rainy day.",
            "What places feel spacious and spread out, not cramped?",
            "Where can I go for an afternoon with tea and soft lighting?",
        ],
    },
    {
        name: "Solo Activities",
        icon: <Icons.openBook className="h-4 w-4" />,
        prompts: [
            "Where's a good spot to read a book alone on a Saturday morning?",
            "Show me quiet spots in Charlotte where I can journal or write.",
            "Where should I go if I just want to sit and people-watch?",
            "What places are good for introverts who want to be alone in public?",
            "Where can I go to sketch or draw without feeling self-conscious?",
        ],
    },
    {
        name: "Work & Study",
        icon: <Icons.laptop className="h-4 w-4" />,
        prompts: [
            "Find me a spot with strong Wi-Fi and lots of outlets.",
            "Where can I work remotely for a full day without feeling rushed?",
            "What are laptop-friendly places that aren't too crowded on weekends?",
            "Recommend spots with outdoor seating and power outlets.",
            "Where can I take Zoom calls without disturbing others?",
        ],
    },
    {
        name: "Late Night",
        icon: <Icons.moon className="h-4 w-4" />,
        prompts: [
            "What spots stay open late in Charlotte?",
            "Where can I study or work after 8 PM?",
            "Find me late-night spots that aren't bars.",
            "Where can I grab a late-night coffee and unwind?",
            "What places are open past 10 PM for night owls?",
        ],
    },
    {
        name: "Morning & Weekend",
        icon: <Icons.sun className="h-4 w-4" />,
        prompts: [
            "Where's a great spot for early morning coffee before 7 AM?",
            "What places are best for a lazy Sunday morning?",
            "Show me brunch spots where I can also get work done.",
            "Where can I enjoy a peaceful sunrise with my coffee?",
            "What spots open early on weekends for early risers?",
        ],
    },
    {
        name: "Groups & Social",
        icon: <Icons.users className="h-4 w-4" />,
        prompts: [
            "Where can a group of 6-8 people meet with a big table?",
            "What's a good spot for board games or hanging out for hours?",
            "What's a relaxed first-date spot that's not too loud?",
            "Where can I meet up with friends who have a dog?",
            "What places are good for hosting a casual birthday hangout?",
        ],
    },
    {
        name: "Making Friends",
        icon: <Icons.handHeart className="h-4 w-4" />,
        prompts: [
            "Where can I go to meet new people and make friends in Charlotte?",
            "What spots have a community vibe where regulars chat with each other?",
            "I'm new to Charlotte, where do people actually socialize and connect?",
            "What places host events where I could meet like-minded people?",
            "Where do locals hang out if they want to strike up conversations?",
            "I have social anxiety, what spots have really friendly staff who make you feel welcome?",
            "What spots feel warm and inviting for someone who's nervous about going out alone?",
            "Where can I go to just be around people without pressure to talk?",
        ],
    },
    {
        name: "Hobbies & Interests",
        icon: <Icons.gamepad2 className="h-4 w-4" />,
        prompts: [
            "Where do board game, Dungeons & Dragons, Magic the Gathering, and tabletop RPG fans hang out in Charlotte?",
            "Are there any places where book lovers gather or have book clubs?",
            "Where can I find other anime or manga fans in Charlotte?",
            "What spots attract artists, writers, or creative types?",
            "Where do craft enthusiasts like knitters or crocheters meet up?",
            "Are there places where vinyl collectors or music nerds hang out?",
            "Where would I find fellow plant parents or gardening enthusiasts?",
            "What spots are good for meeting other tech or coding hobbyists?",
            "Where do photographers or film buffs tend to gather?",
        ],
    },
    {
        name: "Date Ideas",
        icon: <Icons.heart className="h-4 w-4" />,
        prompts: [
            "Where should I take someone who loves nature on a date?",
            "My date loves flowers, what's a romantic spot with gardens nearby?",
            "Where's the best matcha in Charlotte for a date?",
            "What's a cozy, intimate spot perfect for a first date?",
            "Where can I take someone who loves books on a date?",
            "What's a unique date spot that isn't just dinner and drinks?",
            "Where should I go for a casual daytime date?",
            "What spots have a romantic outdoor patio for a date night?",
            "Where's good for a creative date like painting or pottery nearby?",
            "My date loves desserts, where has the best pastries or sweets?",
            "What's a dog-friendly date spot for two dog owners?",
        ],
    },
    {
        name: "Hidden Gems",
        icon: <Icons.sparkles className="h-4 w-4" />,
        prompts: [
            "What are some underrated hidden-gem spots around Charlotte?",
            "Recommend Black-owned spots to check out.",
            "Suggest libraries or bookstores that feel like true third places.",
            "What lesser-known spots do locals love?",
            "Where are the secret spots tourists don't know about?",
        ],
    },
    {
        name: "Food & Drinks",
        icon: <Icons.coffee className="h-4 w-4" />,
        prompts: [
            "Where can I get great hot chocolate in Charlotte?",
            "What places have the best pastries to go with my coffee?",
            "Show me bubble tea spots where I can hang out.",
            "Are there any spots that serve food beyond just coffee and pastries?",
            "Where can I find the best espresso in Charlotte?",
        ],
    },
    {
        name: "By Neighborhood",
        icon: <Icons.mapPin className="h-4 w-4" />,
        prompts: [
            "What are the best third places in South End?",
            "Find me spots to work from in the Ballantyne area.",
            "Show me spots near Uptown Charlotte.",
            "What's good in NoDa for remote work?",
            "Find chill places with free parking on the east side.",
        ],
    },
]

interface PromptLibraryProps {
    onSelectPrompt: (prompt: string) => void
    /** Variant for styling - 'default' shows primary button, 'toolbar' shows ghost button matching input tools */
    variant?: "default" | "toolbar"
}

export function PromptLibrary({ onSelectPrompt, variant = "default" }: PromptLibraryProps) {
    const [open, setOpen] = useState(false)
    const isMobile = useIsMobile()

    const handleSelectPrompt = (prompt: string) => {
        onSelectPrompt(prompt)
        setOpen(false)
    }

const TriggerButton = variant === "toolbar" ? (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-primary h-8 px-2 text-xs inline-flex items-center"
        >
            <Icons.lightbulbOutline className="size-3.5 mr-1 shrink-0" />
            <span className="leading-none">Prompt Ideas</span>
        </Button>
    ) : (
        <Button
            variant="default"
            size="sm"
            className="gap-2"
        >
            <Icons.lightbulb className="h-4 w-4" />
            <span className="text-sm font-semibold">Prompt Ideas</span>
        </Button>
    )

    const LibraryContent = (
        <ScrollArea className="h-[78dvh] sm:h-[500px]">
            <div className="pb-4 pl-1 pr-6">
                <Accordion type="single" collapsible className="w-full">
                    {promptCategories.map((category) => (
                        <AccordionItem key={category.name} value={category.name}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    {category.icon}
                                    <span>{category.name}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
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
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
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
                            <Icons.lightbulb className="h-5 w-5 text-yellow-500" />
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
                        <Icons.lightbulb className="h-5 w-5 text-yellow-500" />
                        Prompt Ideas
                    </DialogTitle>
                </DialogHeader>
                {LibraryContent}
            </DialogContent>
        </Dialog>
    )
}
