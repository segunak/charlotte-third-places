import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import type { Metadata } from 'next'
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export const metadata: Metadata = {
    title: 'About',
}

const frequentlyAskedQuestions = [
    {
        title: "What is a Third Place?",
        content: (
            <div className="space-y-3">
                <p>
                    Third places are spots outside of your home (your "first place") and your workplace/school (your "second place") where you can hang out, build community, read, study, chill, feel welcomed, etc. They typically have little to no barrier to entry, so think a library, community center, or coffee shop with reasonable pricing (something $5 or less you can buy to justify hanging around). In truth, the term <em>third place</em> is at best loosely defined. I suggest you read this <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">Wikipedia page</ResponsiveLink> to learn more about where the term came from and its history. After doing so, check out this <ResponsiveLink href="https://www.reddit.com/r/Charlotte/comments/1cid1i5/what_are_your_favorite_third_places_in_charlotte/">Reddit thread</ResponsiveLink> which features people in Charlotte discussing the concept (and arguing about it if you scroll far enough, as is typical of Reddit).
                </p>
                <p>
                    To put it simply, defining a third place is subjective, and since this is a personal project, the places listed here are ones I view as third places. Of course, I'm open to different perspectives and value any feedback or thoughts you have. This is my list, but I'm always up for learning something new. If you'd like to share your thoughts, please visit the <Link className="custom-link" href="/contribute">contribute page</Link> to get in touch!
                </p>
            </div>
        )
    },
    {
        title: "Who built and maintains Charlotte Third Places?",
        content: (
            <div className="space-y-3">
                That would be me, <ResponsiveLink href="https://segunakinyemi.com/">Segun Akinyemi</ResponsiveLink>. I moved to Charlotte in 2020 during the pandemic, and third places became my way of exploring the city and meeting people while working remotely. I have them to thank for making Charlotte feel like home. This site started as a simple list on my phone of my favorite spots. It didn't take long before the list got so long that my messages app suggested splitting it into chunks before sending it. To solve that problem, I could've spent a few minutes throwing the data into an Excel spreadsheet, but where's the fun in that? As a software engineer, I enjoy coding and building stuff with tech, so I over-engineered the heck out of this project. It was and continues to be a great excuse to play around with languages and frameworks I don't get to use much in my day job (where it's mostly backend engineering in Python, Scala, and SQL). If you're into tech, keep scrolling to learn more about what tools I used. In short, the frontend side of engineering is as fascinating as it is complex, but that's just software these days. Whether frontend or backend, human ambition knows no bounds, and the complexity of the software we build to fuel those ambitions evolves with it.
            </div>
        )
    },
    {
        title: "Can I contribute to the site?",
        content: (
            <div className="space-y-3">
                Absolutely! This site thrives on community input. Whether it's suggesting a new place, providing updates to existing ones, or just offering ideas for improvement, I'd love to hear from you. Use the <Link className="custom-link" href="/contribute">Contribute</Link> page to reach out.
            </div>
        )
    },
    {
        title: "I submitted a place and haven't seen it added yet. What should I do?",
        content: (
            <div className="space-y-3">
                First off, thanks for submitting! I'd say bear with me, I'll get to it, eventually. I'm the sole maintainer of the site, and between my day job and personal life, things can get busy. Also, there's no guarantee that every submitted place will make it onto the site. I put effort into curating the list to highlight spots that stand out as third places. If we venture into the "list literally every single spot" world this site becomes Google Maps Lite rather than something of particular value. Maybe one day I'll work out a community voting mechanism, although that might be more effort than its worth.
            </div>
        )
    },
    {
        title: "I see some information about a place that's wrong. How can I get it updated?",
        content: (
            <div className="space-y-3">
                Mistakes happen! If you spot any incorrect details, head over to the <Link className="custom-link" href="/contribute">Contribute</Link> page to submit your corrections.
            </div>
        )
    },
    {
        title: "Where does the data come from?",
        content: (
            <div className="space-y-3">
                <p>
                    It depends on the field we're talking about. Some fields—like <em>description</em> and <em>address</em>—come directly from Google Maps via their <ResponsiveLink href="https://developers.google.com/maps/documentation/places/web-service/overview">Places API</ResponsiveLink>, while others (like <em>has cinnamon rolls</em>) are curated from my experiences and community feedback. Review the list below to learn more about each field.
                </p>
                <ul className="list-disc list-inside pl-4 space-y-2">
                    <li>
                        <strong>Name:</strong> This mostly comes from Google Maps, though I've occasionally edited names to make them clearer. Sometimes the names on Google Maps are too formal, long, or ambiguous, so I tweak them to ensure clarity while preserving the original intent. Take Not Just Coffee as an example. They have multiple locations in Charlotte, and on Google Maps, they're all simply named 'Not Just Coffee.' While that's understandable, it can be hard to tell which location is being referred to at a glance. To make things clearer on this site, I've renamed them to 'Not Just Coffee | [Neighborhood Name]' so it's easier to differentiate. I've made similar small tweaks to other place names where needed.
                    </li>
                    <li>
                        <strong>Type:</strong> Comes from Google Maps as a starting place for further curation. Google might label a place as a coffee shop, but if it's also a bar or café. I try to include all relevant types to capture the full essence of the space. If you see a place that's 'mistyped' in any way let me know via the <Link className="custom-link" href="contribute">Contribute</Link> page.
                    </li>
                    <li>
                        <strong>Size:</strong> This one is all me! Based on personal visits, I gauge the size of each place. If I haven't been to a location, I infer the size from online photos or map views, or leave it as "Unsure". If you think a size is off, or want to help me switch a place from "Unsure" to a real size, please feel free to reach out via the <Link className="custom-link" href="contribute">Contribute</Link> page. Like, really. I need help lol.
                    </li>
                    <li>
                        <strong>Neighborhood:</strong> This comes from Google Maps, but I do some curation. For places outside Charlotte proper (like Matthews or Concord, which in the spirit of <ResponsiveLink href="https://www.ajc.com/life/radiotvtalk-blog/atlanta-rapper-omeretta-stirs-social-media-pot-over-song-that-narrowly-defines-atlanta/6LBPXWJPUVDHLBVFUZV5IRMDI4/">Omeretta</ResponsiveLink>, are "not Charlotte"), I list the city name as the neighborhood. If Google suggests an obscure neighborhood that nobody recognizes, I simplify it to something more familiar. Because of the curation being done, this is a field where I do <em>really</em> appreciate feedback. If you see a place where the neighborhood tag makes no sense, let me know via the <Link className="custom-link" href="contribute">Contribute</Link> page so I can work on getting it updated.
                    </li>
                    <li>
                        <strong>Address:</strong> 100% pulled from Google Maps.
                    </li>
                    <li>
                        <strong>Purchase Required:</strong> Google Maps offers data here, but it's not always accurate. I use Google Maps data by default, but I've also curated values based on my experiences and community feedback. For example, most coffee shops expect you to make a purchase if you're staying for a while, so they're assumed to be "Yes" on "Purchase Required". As someone that's had periods of life where a $5 coffee was not doable, helping people find truly free third places is important to me. The library was always mine during those tough times, but there are some other options around the city. If you see a wrong value in this field, please let me know via the <Link className="custom-link" href="contribute">Contribute</Link> page. The accuracy of this field matters deeply to me.
                    </li>
                    <li>
                        <strong>Parking Situation:</strong> From Google Maps who have mostly accurate data on this field. That being said, I've found mistakes before, so I review all values based on personal experiences and community feedback. I didn't own a car until moving to Charlotte, and if I had one complaint about this city, it'd be how challenging it is to live here and have any sort of social life without one. I miss the days where parking was never an issue for me because I came on my own two feet (or wheels, shout out bikers) via reliable public transportation. Charlotte's <ResponsiveLink href="https://www.google.com/search?q=Charlotte+Gateway+Station&rlz=1C1ONGR_enUS937US937&oq=Charlotte+Gateway+Station">working on</ResponsiveLink> the bad public transportation thing though. Always nice to see progress.
                    </li>
                    <li>
                        <strong>Free WiFi:</strong> This one fully relies on my experiences and community feedback. Google Maps doesn't have this data. Now here's where things can get sticky. If you visit a place and they have free WiFi, but they expect you to make a purchase to hangout in their space, is it really free WiFi? Even if you get the cheapest thing on the menu, you still had to pay to access the WiFi in a roundabout sort of way. I've spent far too many hours debating internally on the answer to that question. I've settled on listing a place as having free WiFi if you don't have to pay to access the WiFi itself after connecting. Once you're in (password or not) you're in, no "give us your credit card" to browse. Am I right about that? I don't know. If you're worried about this though, you know what solves the problem? Going to the library. Bring a snack from home, fill up your water bottle, and hangout at the library. Charlotte has great libraries. I encourage you to use them. Maybe even keep the laptop closed and read a book while you're there. If you're into science-fiction/fantasy check out the <ResponsiveLink href="https://www.google.com/search?q=red+rising+series">Red Rising</ResponsiveLink> series. Or the Bible. Whatever you may believe, it's an interesting read.
                    </li>
                    <li>
                        <strong>Description:</strong> Comes directly from Google Maps. This is how a place describes itself. The value here comes from what the business put on their own Google Maps profile. If a place doesn't have a description, I use a default: "A third place in the Charlotte, North Carolina area."
                    </li>
                    <li>
                        <strong>Website:</strong> Pulled straight from Google Maps—whatever the business lists as their website, if they list one.
                    </li>
                    <li>
                        <strong>Google Maps Profile:</strong> From Google Maps. This is a direct link to the place's profile, pulled from their listing.
                    </li>
                    <li>
                        <strong>Comments:</strong> These are from me, my personal thoughts or advice regarding a place. It's my attempt at adding detail you wouldn't get from Google Maps. I welcome community feedback here. If you notice something cool about a place and want to share that knowledge with others, let me know via the <Link className="custom-link" href="contribute">Contribute</Link> page and I'll work on getting it added to the comments field.
                    </li>
                    <li>
                        <strong>Has Cinnamon Rolls:</strong> This one is all me. I'm a fan of cinnamon rolls. In fact, to say that I'm a fan is an understatement. I'm an advocate, a connoisseur, the pastry equivalent of a cinephile, but not for all pastries—only for cinnamon rolls specifically. This field exists to satiate my personal enthusiasm for what I consider to be an exalted form of pastry, a divine delight. There is no greater <em>carnal</em> act of munificence than to gift someone a tray of well made cinnamon rolls, for every reason (perhaps a birthday, anniversary), or for no reason at all. Any spot with cinnamon rolls immediately climbs to the top of my mental list of favorite places around the city (shout out Sunflour Bakery 🔥). As I consider going somewhere, the question "do they have cinnamon rolls" is consistently a part of my evaluation. Not always so that I can indulge, but sometimes to practice self-discipline, acknowledging, "Yes, they have cinnamon rolls, but no, I can't partake today—I've committed to eating healthier, and today isn't a cheat day". You see, <ResponsiveLink href="https://knowyourmeme.com/memes/one-does-not-simply-walk-into-mordor">one cannot live</ResponsiveLink> in a constant state of indulgence. To do so would be surrender to gluttony, to wallow in hedonism, to revel in unchecked extravagance. Familiarity breeds contempt, excess breeds waste, and overindulgence breeds boredom. Far be it from me to eat cinnamon rolls so often that they lose their significance in my heart and mind. That they become—God forbid—<em>commonplace</em>. I will not allow it. If you're wondering, "does this guy have some sort of deeply personal story behind his love of cinnamon rolls?" the answer is no. I just like them. It is actually that simple. We all have our passions. That being said, if you know of a place with cinnamon rolls that's marked incorrectly on this website, I need you to tell me <em>with all manner of immediate speed</em> so I can get it fixed. Please use the <Link className="custom-link" href="contribute">Contribute</Link> page. Thank you.
                    </li>
                </ul>
            </div>
        )
    },
    {
        title: "How often is the data updated?",
        content: (
            <div className="space-y-3">
                A couple times a day, thanks to <ResponsiveLink href="https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration">incremental static regeneration</ResponsiveLink> from <ResponsiveLink href="https://nextjs.org/">Next.js</ResponsiveLink>.
            </div>
        )
    },
    {
        title: "There are a lot of breweries in Charlotte, aren't they considered third places? Why not list literally every single brewery in Charlotte?",
        content: (
            <div className="space-y-3">
                While Charlotte is known for its brewery scene, and they are arguably third places, I didn't want to include every single one. At that point, Google Maps itself becomes a better tool. My goal is to highlight places where you can hang out during the day (not just afternoon/evening), maybe grab a coffee or work on your laptop, read, chill, and not feel any pressure to order a beer. There are breweries that meet this vibe (like Suffolk Punch), and they're listed on the site. Others that don't are not. Now, the definition of a third place is subjective, so you're welcome to disagree with me. I am willing to hear all arguments and reason with anyone willing to engage in civil conversation. You can contact me via the <Link className="custom-link" href="contribute">Contribute</Link> page.
            </div>
        )
    },
    {
        title: "Starbucks locations are quintessential examples of third places. Why not list literally every single Starbucks in Charlotte?",
        content: (
            <div className="space-y-3">
                First off, calm down. Not every Starbucks qualifies as a third place. Some of them are inside Harris Teeter's and mall's and other businesses, and as such, don't have their own seating areas. They're quick stops, not places to hangout for a while. Others have seating space but it's small, or the vibes of the place just kind of suck, so they're not worth listing. Basically, I've taken to only listing "good" Starbucks, where "good" is entirely subjective. As such, I'm more than willing to add a Starbucks to the site that someone validates is cool to hangout at. You can submit new ones via the <Link className="custom-link" href="contribute">Contribute</Link> page.
            </div>
        )
    }
];

export default function AboutPage() {
    return (
        <section className="px-4 sm:px-6 py-8 space-y-6 mx-auto max-w-full sm:max-w-4xl border border-gray-300 shadow-lg bg-background">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-center border-b pb-3">
                About
            </h1>
            <p className="text-wrap">
                Welcome! This site is a personal project built to help others find cool spots in and around Charlotte, North Carolina. Read on to learn more about its creator, how it was built, where the data comes from, and other details.
            </p>

            {/* Creator*/}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center mb-4 border-b pb-3">
                        Creator
                    </CardTitle>
                    <div className="flex justify-center">
                        <Image
                            src="/gifs/obiwan.gif"
                            alt="Hello There"
                            width={500}
                            height={500}
                            unoptimized={true}
                            className="rounded-xl"
                        />
                    </div>
                </CardHeader>
                <CardContent className="leading-relaxed space-y-4">
                    <p>
                        Hello! I'm <ResponsiveLink href="https://segunakinyemi.com/">Segun Akinyemi</ResponsiveLink>, a Christian, Software Engineer, Writer, and Tech Enthusiast. I built and maintain this site with the goal of connecting people with places in Charlotte where they can...
                    </p>
                    <ul className="list-disc list-inside pl-4 space-y-2">
                        <li>work remotely</li>
                        <li>study</li>
                        <li>read</li>
                        <li>write</li>
                        <li>chill</li>
                        <li>watch anime</li>
                        <li>make friends</li>
                        <li>hang out with friends</li>
                        <li>hang out alone surrounded by people with friends (me during COVID as a Charlotte newbie)</li>
                        <li>people watch (not my thing but do you)</li>
                        <li>daydream (with cool ambience)</li>
                        <li>eat cinnamon rolls while doing any of the above</li>
                    </ul>
                    <p>
                        Keep scrolling to get answers to frequently asked questions and learn more about the project.
                    </p>
                </CardContent>
            </Card>

            {/* Frequently Asked Questions */}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center border-b pb-3">
                        Frequently Asked Questions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="space-y-4">
                        {frequentlyAskedQuestions.map((item, index) => (
                            <AccordionItem key={index} value={`question-${index + 1}`}>
                                <AccordionTrigger>{item.title}</AccordionTrigger>
                                <AccordionContent>{item.content}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* Tech Stack */}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center border-b pb-3">
                        Tech Stack
                    </CardTitle>
                </CardHeader>
                <CardContent className="leading-relaxed space-y-4">
                    <p>
                        I'll start by saying, this project is over-engineered, and that's by design. In addition to sharing my list of places, I wanted to learn new things, and that I did. Some might say the entire point of a side project as a developer is to over-engineer things in service of learning. Here's a classic <ResponsiveLink href="https://news.ycombinator.com/item?id=15147660">Hacker News thread</ResponsiveLink> on the topic. I'm not saying I fully agree with that sentiment, but I am saying I took my time building this site because I wanted to explore. Like sure, you can stick to the linear path in an open-world RPG, but you miss out on so much cool stuff that way. Game developers literally spend hours creating things that are only discoverable if you meander. If that reference is hitting home for you, 🙌🏾💯. If not, that's okay, but what follows only gets more nerdy and techy. Here's what I used to build this site and the processes behind it.
                    </p>
                    <Accordion type="single" collapsible className="space-y-4">
                        {/* Frontend & Styling */}
                        <AccordionItem value="frontend">
                            <AccordionTrigger>Frontend & Styling</AccordionTrigger>
                            <AccordionContent>
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="https://nextjs.org/">Next.js:</ResponsiveLink>
                                        </strong> {" "}
                                        Is what this site is built with. There was once a time where people wrote vanilla HTML, CSS, and JavaScript to build websites. Those days are long gone. This <ResponsiveLink href="https://www.pzuraq.com/blog/four-eras-of-javascript-frameworks">article</ResponsiveLink> has a pretty good accounting of how we got to our present frameworks on top of libraries on top of other libraries on top of frameworks era. React has emerged as the winner of the JavaScript library race, and Next.js as the framework on top of it (although <ResponsiveLink href="https://www.reddit.com/r/nextjs/comments/1f92jdv/chatgptcom_switched_from_nextjs_to_remix/">Remix</ResponsiveLink> is rising). These days, there's so much overlap between the React and Next.js (developed by <ResponsiveLink href="https://vercel.com/about">Vercel</ResponsiveLink>) development teams that some are <ResponsiveLink href="https://www.epicweb.dev/why-i-wont-use-nextjs">concerned</ResponsiveLink> they're one in the same. Seeing as this is a hobby project, I'm not with the drama when it comes to the trend chasing nature of frontend development. Everyone and their mama is using Next.js, including many <ResponsiveLink href="https://nextjs.org/showcase">popular websites</ResponsiveLink> you've likely used. That's enough justification for me to use it. My experience has been mostly good, although the app router seems <ResponsiveLink href="https://github.com/vercel/next.js/discussions/54075">overly complex</ResponsiveLink>. Next.js is a React-based framework.
                                    </li>
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">React:</ResponsiveLink>
                                        </strong> {" "}
                                        At the heart of the UI, React's component-based architecture allows for a highly interactive and dynamic experience, making every page of this site feel fluid and responsive.
                                    </li>
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">Tailwind CSS:</ResponsiveLink>
                                        </strong> {" "}
                                        The utility-first CSS framework that lets me build fast and keep my designs consistent. With Tailwind, responsiveness and custom styling come effortlessly.
                                    </li>
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">shadcn/ui:</ResponsiveLink>
                                        </strong> {" "}
                                        Built on Radix UI, Shadcn provides accessible, reusable components for a smooth user interface. These components make the design of the site cohesive and user-friendly.
                                    </li>
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">React Icons:</ResponsiveLink>
                                        </strong> {" "}
                                        This project uses React Icons, which allows me to pull in icons from multiple libraries without cluttering my dependencies. It's one of those "small joys" that makes building UI fun.
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Backend & APIs */}
                        <AccordionItem value="backend">
                            <AccordionTrigger>Backend & APIs</AccordionTrigger>
                            <AccordionContent>
                                <ul className="list-disc list-inside pl-4 space-y-3">
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">Python:</ResponsiveLink>
                                        </strong> {" "}
                                        All backend interactions, especially with the Google Maps API and Outscraper, are handled through Python scripts running on Azure Functions. This serverless architecture keeps the backend lightweight and scalable.
                                    </li>
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">Azure Functions:</ResponsiveLink>
                                        </strong> {" "}
                                        Azure Functions serve as the engine of the backend, handling tasks like interacting with APIs in a scalable, efficient, and serverless way.
                                    </li>
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">Google Maps Places API:</ResponsiveLink>
                                        </strong> {" "}
                                        This API powers the site's data, providing details like names, addresses, and types of third places in Charlotte. Google Maps ensures the most accurate information possible.
                                    </li>
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">Outscraper:</ResponsiveLink>
                                        </strong> {" "}
                                        Outscraper is responsible for gathering reviews for the "ambience" data field. It's part of a future feature where I plan to analyze reviews to offer insights into the vibe of each location.
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Data & Storage */}
                        <AccordionItem value="data">
                            <AccordionTrigger>Data & Storage</AccordionTrigger>
                            <AccordionContent>
                                <ul className="list-disc list-inside pl-4 space-y-3">
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">Airtable:</ResponsiveLink>
                                        </strong> {" "}
                                        If you were expecting PostgreSQL or DuckDB or a data lake with delta parquet tables or some other fancy solution, I'm sorry to disappoint. This whole project could be just this Airtable embedded into the website, which is what <ResponsiveLink href="https://layoffs.fyi/">Layoffs.fyi</ResponsiveLink> does for a simple scalable solution. I considered doing that. Then I was like, doing something more complicated (and challenging) is more fun, so I did that instead.

                                        All the third place data is stored in Airtable, providing an easy-to-manage and scalable solution. The Airtable JS API is used to pull this data into the site effortlessly.
                                    </li>
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">Google Maps Places API:</ResponsiveLink>
                                        </strong> {" "}
                                        This is used to pull crucial information about each place—like its name, address, and category. It’s what allows this site to function as a third-place directory.
                                    </li>
                                    <li>
                                        <strong>
                                            <ResponsiveLink href="REPLACEME">AG Grid:</ResponsiveLink>
                                        </strong> {" "}
                                        AG Grid is used for displaying the list of third places. It’s flexible, customizable, and provides all the functionality you could ever want in a data grid.
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        {/* AI & Tools */}
                        <AccordionItem value="ai-tools">
                            <AccordionTrigger>AI & Tools</AccordionTrigger>
                            <AccordionContent>
                                <ul className="list-disc list-inside pl-4 space-y-3">
                                    <li>
                                        <strong>Microsoft Designer:</strong> This was my go-to tool for AI-generated images, logos, and other creative assets used across the site. It made things visually appealing while saving me a ton of time.
                                    </li>
                                    <li>
                                        <strong>OpenAI's ChatGPT:</strong> I can’t deny how helpful OpenAI’s ChatGPT has been in refining ideas, generating content, and speeding up development. This README itself has been assisted by ChatGPT!
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Tools Explored */}
                        <AccordionItem value="explored-tools">
                            <AccordionTrigger>Tools Explored</AccordionTrigger>
                            <AccordionContent>
                                <p>I explored several tools and frameworks before settling on the current stack. Here's a quick breakdown of what I tried but ultimately didn’t use:</p>
                                <ul className="list-disc list-inside pl-4 space-y-3">
                                    <li><strong>Firebase:</strong> While I initially thought Firebase might be a good fit, it turned out to be overkill for the simplicity of this project.</li>
                                    <li><strong>Flutter:</strong> I liked the idea of building with Flutter, but I was turned off by Dart, not because it's bad, but because it didn’t align with the in-demand skills I wanted to focus on.</li>
                                    <li><strong>React Native:</strong> While React Native is powerful, the headaches of dealing with different platforms (iOS vs. Android vs. Web) led me to decide a website would suffice.</li>
                                    <li><strong>Mapbox:</strong> Mapbox was considered as an alternative to Google Maps, but its complexity was unnecessary for this project.</li>
                                    <li><strong>Google Cloud Functions:</strong> They worked well but were swapped out for Azure Functions to align better with my existing Azure workflow.</li>
                                    <li><strong>Supabase:</strong> Supabase is fantastic, but given the simplicity of this project’s data, it was overkill. However, I’m eager to find a project where I can give Supabase a real shot.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center border-b pb-3">
                        Contact Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="leading-relaxed">
                    <p>
                        The best way to get in touch with me regarding the site is by using the <Link href="/contribute" className="custom-link">Contribute</Link> page. Also feel free to visit my <ResponsiveLink href="https://segunakinyemi.com">personal website</ResponsiveLink> or connect with me on <ResponsiveLink href="https://linkedin.com/in/segunakinyemi">LinkedIn</ResponsiveLink>.
                    </p>
                </CardContent>
            </Card>
        </section>
    );
}
