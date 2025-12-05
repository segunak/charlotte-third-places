import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import type { Metadata } from 'next'
import { Icons } from "@/components/Icons";
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
                    Third places are spots outside of your home (your "first place") and your work/school (your "second place") where you can hang out, build community, read, study, chill, feel welcomed, etc. They typically have little to no barrier to entry, so think a library, café, or coffee shop with reasonable pricing.
                </p>
                <p>
                    Now, the term <em>third place</em> is at best loosely defined. I suggest you read this <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">Wikipedia page</ResponsiveLink> to learn more about the history of the term. After doing so, check out this <ResponsiveLink href="https://www.reddit.com/r/Charlotte/comments/1cid1i5/what_are_your_favorite_third_places_in_charlotte/">Reddit thread</ResponsiveLink> which features people in Charlotte discussing the concept (and arguing about it if you scroll far enough, as is typical of Reddit).
                </p>
                <p>
                    To put it simply, defining a third place is subjective, and since this is a personal project, the places listed here are ones I view as third places. Of course, I'm open to different perspectives and value any feedback or thoughts you might have. I made the site, but I want it to be valuable to the Charlotte community. If you'd like to share your thoughts, please visit the <Link className="custom-link" href="/contribute">Contribute</Link> page to get in touch!
                </p>
            </div>
        )
    },
    {
        title: "Who built and maintains Charlotte Third Places?",
        content: (
            <div className="space-y-3">
                <p>
                    Me, <ResponsiveLink href="https://segunakinyemi.com/">Segun Akinyemi</ResponsiveLink>. I moved to Charlotte during the pandemic, and third places became my way of exploring the city and meeting people while working remotely. They played a huge role in making Charlotte feel like home. This site started as a simple list on my phone of my favorite spots. Before long, the list grew so much that even my messages app suggested splitting it into chunks before sending. Creating a spreadsheet would've been the easiest solution to this challenge, and I did exactly that, except after doing so, I started getting ideas of <ResponsiveLink href="https://www.youtube.com/watch?v=yPZLIf9MqUU">something greater</ResponsiveLink>.
                </p>
                <p>
                    I'm a software engineer, and I enjoy building stuff with tech, so I purposefully over-engineered this project as an excuse to learn new things. I continue to tinker with the site, making improvements here and there, refactoring stuff to see if I can get it faster, more efficient, more user friendly, etc. If you're into tech, check out <ResponsiveLink href="https://segunakinyemi.com/blog/charlotte-third-places-tech-stack">this article</ResponsiveLink> for a breakdown of how the project was built.
                </p>
            </div>
        )
    },
    {
        title: "Is Charlotte Third Places on social media?",
        content: (
            <div className="space-y-3">
                <p>
                    Yes, Charlotte Third Places is on <ResponsiveLink href="https://www.tiktok.com/@charlottethirdplaces">TikTok</ResponsiveLink>, <ResponsiveLink href="https://www.youtube.com/@charlottethirdplaces">YouTube</ResponsiveLink>, and <ResponsiveLink href="https://www.instagram.com/charlottethirdplaces">Instagram</ResponsiveLink>. You can visit all links using this <ResponsiveLink href="https://linktr.ee/charlottethirdplaces">Linktree</ResponsiveLink>.
                </p>
            </div>
        )
    },
    {
        title: "Do places have to pay to be listed on the site?",
        content: (
            <div className="space-y-3">
                <p>
                    Nope, this is an open source community directory, no charge for listings. That said, I may collaborate with places to promote their spots or update their profile info, but that would be a separate agreement, completely unrelated to getting listed. There's no charge to be included.
                </p>
                <p>
                    There's also some curation, where I choose not to list places that request to be added but don't meet the criteria of a third place (which, admittedly, is somewhat arbitrary). The main rule is: if a spot requires a reservation or membership before you can use it, it's disqualified. If you can't just walk in, make a simple purchase, and hang out, then it's not a third place in my opinion. If you disagree, I'm open to hearing your thoughts, use the <Link className="custom-link" href="contribute">Contribute</Link> page to reach out.
                </p>
                <p>
                    Overall, my goal is to keep this site as open and community-driven as possible. The code for this site is <ResponsiveLink href="https://github.com/segunak/charlotte-third-places">open source</ResponsiveLink>, and I've documented how it was built <ResponsiveLink href="https://segunakinyemi.com/blog/charlotte-third-places-tech-stack/">on my website</ResponsiveLink>. No secrets here—just a personal project from a Charlotte resident who loves exploring the city.
                </p>
            </div>
        )
    },
    {
        title: "Where does the data for places come from?",
        content: (
            <div className="space-y-3">
                <p>
                    It depends on the field we're talking about. Some fields—like <em>description</em> and <em>address</em>—come directly from Google Maps via their <ResponsiveLink href="https://developers.google.com/maps/documentation/places/web-service/overview">Places API</ResponsiveLink>, while others are curated from my experiences and community feedback. Click on a field name below to learn more abouut how it's sourced.
                </p>
                <Accordion type="single" collapsible className="space-y-4 pl-4">
                    <AccordionItem value="name">
                        <AccordionTrigger>Name</AccordionTrigger>
                        <AccordionContent>
                            This mostly comes from Google Maps, though I've occasionally edited names to make them clearer. Sometimes the names on Google Maps are too formal, long, or ambiguous, so I tweak them to ensure clarity while preserving the original intent.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="type">
                        <AccordionTrigger>Type</AccordionTrigger>
                        <AccordionContent>
                            The initial type information comes from Google Maps, but I further curate it to ensure accuracy. For instance, Google might label a place as a coffee shop, but if it also functions as a bar or café, I include all relevant types. If you notice any place that seems incorrectly typed, please let me know via the <Link className="custom-link" href="contribute">Contribute</Link> page.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="website">
                        <AccordionTrigger>Website</AccordionTrigger>
                        <AccordionContent>
                            Represented by the <Icons.globe className="w-5 h-5 inline" /> icon. Pulled directly from Google Maps, if the business lists one.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="address">
                        <AccordionTrigger>Address</AccordionTrigger>
                        <AccordionContent>
                            Pulled directly from Google Maps.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="neighborhood">
                        <AccordionTrigger>Neighborhood</AccordionTrigger>
                        <AccordionContent>
                            This comes from Google Maps, but I do some curation. For places outside Charlotte proper like Matthews or Concord—which in the spirit of <ResponsiveLink href="https://www.ajc.com/life/radiotvtalk-blog/atlanta-rapper-omeretta-stirs-social-media-pot-over-song-that-narrowly-defines-atlanta/6LBPXWJPUVDHLBVFUZV5IRMDI4/">Omeretta</ResponsiveLink>, are "not Charlotte"—I list the city name as the neighborhood. Also, if Google suggests an obscure neighborhood that nobody recognizes, I simplify it to something more familiar. Because of the curation being done, this is a field where I do <em>really</em> appreciate feedback. If you see a place where the neighborhood makes no sense, let me know via the <Link className="custom-link" href="contribute">Contribute</Link> page.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="size">
                        <AccordionTrigger>Size</AccordionTrigger>
                        <AccordionContent>
                            This is based on both my experiences and community feedback. Defining place sizes can be tricky since everyone has their own ideas of what 'small,' 'medium,' or 'large' means. In general, I classify small places as seating 10 or fewer people, medium as holding 10-20, and large as accommodating 20 or more. It's an imperfect and subjective system. You may also see 'Unsure' in this field for places I haven't visited yet or when the size isn't easy to determine. If you think a size is off, please feel free to reach out via the <Link className="custom-link" href="contribute">Contribute</Link> page. Any help is greatly appreciated!
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="purchase">
                        <AccordionTrigger>Purchase Required</AccordionTrigger>
                        <AccordionContent>
                            Google Maps offers data here, but it's not always accurate. I use Google Maps data by default, but I've also curated values based on my experiences and community feedback. For example, most coffee shops expect you to make a purchase if you're staying for a while, so they're assumed to be "Yes" on "Purchase Required". As someone that has had periods of life where a $5 coffee was not doable, helping people find free third places is important to me. The library was always mine during those tough times, but there are some other options around the city. If you see a wrong value in this field, please let me know via the <Link className="custom-link" href="contribute">Contribute</Link> page. The accuracy of this field matters deeply to me.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="parking">
                        <AccordionTrigger>Parking</AccordionTrigger>
                        <AccordionContent>
                            Comes from Google Maps who have mostly accurate data on this field. That being said, I've found mistakes before, so I review all values based on personal experiences and community feedback.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="Wi-Fi">
                        <AccordionTrigger>Wi-Fi</AccordionTrigger>
                        <AccordionContent>
                            This information is based entirely on my experiences and community feedback, as Google Maps does not provide this data. The concept of "free Wi-Fi" can be tricky. If a place offers Wi-Fi but expects you to make a purchase to stay, is it truly free? Even if you buy the cheapest item, you still had to pay to access the Wi-Fi indirectly. After much deliberation, I've decided to list a place as having free Wi-Fi if you don't need to pay specifically to access it once connected. Whether there's a password or not, as long as you can use the Wi-Fi without additional charges, it's considered free. Am I right about that? I don't know. If you're worried about this though, you know what solves the problem? Going to the library. Bring a snack from home, fill up your water bottle, and hangout at the library. Charlotte has great libraries, I encourage you to use them! Maybe even keep the laptop closed and read a book while you're there. If you're into science-fiction/fantasy check out the <ResponsiveLink href="https://www.google.com/search?q=red+rising+series">Red Rising</ResponsiveLink> series. Or the Bible. Whatever you may believe, it's an interesting read.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="cinnamon-rolls">
                        <AccordionTrigger>Cinnamon Rolls</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3">
                                <p>
                                    This is all me. I'm a fan of cinnamon rolls. In fact, to say that I'm a fan is an understatement. I'm an advocate, a connoisseur, the pastry equivalent of a cinephile, but only for cinnamon rolls specifically. This field exists to satiate my personal enthusiasm for what I consider to be the chief of all pastries. There is no greater <em>carnal</em> act of munificence than to gift someone a tray of well made cinnamon rolls, for every reason, or for no reason at all. Any spot with cinnamon rolls immediately climbs to the top of my list of favorite places around the city (shout out Sunflour Bakery 🔥). When I consider going somewhere, the question "do they have cinnamon rolls" is consistently a part of my evaluation. Not always so that I can indulge, but sometimes to practice self-discipline, acknowledging, "Yes, they have cinnamon rolls, but no, I can't partake today—I've committed to eating healthier, and today isn't a cheat day".
                                </p>
                                <p>
                                    You see, <ResponsiveLink href="https://knowyourmeme.com/memes/one-does-not-simply-walk-into-mordor">one cannot live</ResponsiveLink> in a constant state of indulgence. To do so would be surrender to gluttony, to wallow in hedonism, to revel in unchecked extravagance. Familiarity breeds contempt, excess breeds waste, and overindulgence breeds boredom. Far be it from me to eat cinnamon rolls so often that they lose their significance in my heart and mind. That they become—God forbid—<em>commonplace</em>. I will not allow it. If you're wondering, "does this guy have some sort of deeply personal story behind his love of cinnamon rolls?", the answer is no. I just like them. We all have our passions. That being said, if you know of a place with cinnamon rolls that's marked incorrectly on this website, I need you to tell me <strong>with all manner of immediate speed</strong> so I can get it fixed. Please use the <Link className="custom-link" href="contribute">Contribute</Link> page. Thank you.
                                </p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="description">
                        <AccordionTrigger>Description</AccordionTrigger>
                        <AccordionContent>
                            This information is sourced directly from Google Maps, based on the business's profile. If the business hasn't listed a description, a default message is used: "A third place in the Charlotte, North Carolina area."
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="comments">
                        <AccordionTrigger>Comments</AccordionTrigger>
                        <AccordionContent>
                            These are from me, my personal thoughts regarding a place. It's my attempt at adding detail you wouldn't get from Google Maps. I welcome community feedback here. If you notice something cool about a place and want to share that knowledge with others, let me know via the <Link className="custom-link" href="contribute">Contribute</Link> page and I'll work on getting it added.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="metadata">
                        <AccordionTrigger>Metadata</AccordionTrigger>
                        <AccordionContent>
                            This section provides site-specific details about a place. "Date Added" shows when the place was first included in the site's database, though it may not reflect its public visibility, as the site launched in September 2024. "Last Updated" indicates the most recent update to the place's details.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        )
    },
    {
        title: "Where do the photos for each place come from?",
        content: (
            <div className="space-y-3">
                <p>
                    All photos come directly from the Google Maps page of the place. If you see a weird or unflattering image, that's on Google, not me!
                </p>
                <p>
                    If you want a photo removed, contact me via the <Link className="custom-link" href="/contribute">Contribute</Link> page and I'll take care of it.
                </p>
            </div>
        )
    },
    {
        title: "How often is the data updated?",
        content: (
            <div className="space-y-3">
                As needed, typically when new places are added or existing information changes. Thanks to <ResponsiveLink href="https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration">Incremental Static Regeneration</ResponsiveLink> from <ResponsiveLink href="https://nextjs.org/">Next.js</ResponsiveLink>, updates are handled efficiently. Since we're dealing with physical locations, the associated data doesn't change frequently. During updates, the system also checks if a place is still operational and removes any that have permanently closed.
            </div>
        )
    },
    {
        title: "Can I submit places for addition to the site?",
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
                First off, thanks for submitting! I'd say bear with me, I'll get to it, eventually. I'm the sole maintainer of the site, and like most, can get busy with life, stuff, and <ResponsiveLink href="https://www.urbandictionary.com/define.php?term=stuff%20and%20thangs">thangs</ResponsiveLink>. Also, there's no guarantee that every submitted place will make it onto the site. I put effort into curating the list to highlight spots that stand out as third places. I'm trying to avoid having too many places listed, such that this site starts feeling like "Google Maps Lite" rather than something truly unique.
            </div>
        )
    },
    {
        title: "I see some information about a place that's wrong. How can I get it updated?",
        content: (
            <div className="space-y-3">
                Mistakes happen! If you spot any incorrect details, head over to the <Link className="custom-link" href="/contribute">Contribute</Link> page to submit your corrections. I'll do my best to process corrections in a timely manner.
            </div>
        )
    },
    {
        title: "Aren't parks considered third places? Why not list all parks in Charlotte?",
        content: (
            <div className="space-y-3">
                Good point, parks certainly are third places. They're not listed on this website because there's already a great directory of those provided by the Mecklenburg County Parks and Rec department. Check out their park locator tool <ResponsiveLink href="https://parkandrec.mecknc.gov/Places-to-Visit/Parks">here</ResponsiveLink>.
            </div>
        )
    },
    {
        title: "Aren't malls considered third places? Why not list all malls in Charlotte?",
        content: (
            <div className="space-y-3">
                To start, I don't like malls. Just a personal thing. If you ever meet me, feel free to ask why. Also they're kind of <ResponsiveLink href="https://www.google.com/search?q=why+are+american+malls+dying">dying</ResponsiveLink> as an institution, with the <ResponsiveLink href="https://www.simon.com/mall/southpark">SouthPark mall</ResponsiveLink> being a notable exception. Furthermore, I don't think people need a custom website to find malls in Charlotte. If you're looking for a mall in the area, Google is a better resource than this website could ever be.
            </div>
        )
    },
    {
        title: "Aren't breweries considered third places? Why not list all breweries in Charlotte?",
        content: (
            <div className="space-y-3">
                While Charlotte is known for its brewery scene, and they are arguably third places, I didn't want to include every single one. At that point, Google Maps itself becomes a better tool. My goal is to highlight places where you can hang out during the day (not just afternoon/evening), maybe grab a coffee or work on your laptop, read, chill, and not feel any pressure to order a beer. There are breweries that meet this vibe (like Suffolk Punch), and they're listed on the site. Others that don't are not. Now, the definition of a third place is subjective, so you're welcome to disagree with me. I'm open to hearing all arguments and reasoning with anyone willing to engage in civil conversation. You can contact me via the <Link className="custom-link" href="contribute">Contribute</Link> page.
            </div>
        )
    },
    {
        title: "Aren't Starbucks considered third places? Why not list all Starbucks in Charlotte?",
        content: (
            <div className="space-y-3">
                Well, it turns out that not every Starbucks qualifies as a third place. Some of them are inside Harris Teeter's and malls and other businesses and don't have their own seating areas. They're quick stops, not places to hangout for a while. Others have seating space but it's small, or the vibes of the place just kind of suck, so they're not worth listing. Basically, I've taken to only listing "good" Starbucks, where "good" is in relation to how well its setup for staying a while. I'm more than willing to add a Starbucks to the site that someone validates is a proper third place. You can submit new ones via the <Link className="custom-link" href="contribute">Contribute</Link> page.
            </div>
        )
    },
    {
        title: "What about co-working spaces? Aren't those considered third places? Why aren't they listed on the site?",
        content: (
            <div className="space-y-3">
                <p>
                    I'll start by saying that the definition of a third place is inherently subjective. Each person must decide for themselves which spaces make them feel at home, welcome, relaxed, and part of a community outside of where they live, work, or go to school. That said, to me, co-working spaces don't qualify as third places because they're essentially "second places"—a dedicated space that people associate with work. The whole concept of a third place is that it's not home or work/school.
                </p>
                <p>
                    Co-working spaces also don't meet the "little to no financial barrier to entry" standard often associated with third places. Most require a membership to enter. You can't just drop in to meet friends or get some work done without registering and paying a fee, which creates a significant barrier to entry. For these reasons, I don't consider co-working spaces as third places and don't list them on this site.
                </p>
                <p>
                    Of course, you're welcome to disagree with me, and I'm always open to hearing opposing viewpoints. You can reach out to share your thoughts via the <Link className="custom-link" href="contribute">Contribute</Link> page.
                </p>
            </div>
        )
    }
];

export default function AboutPage() {
    return (
        <section className="site-padding-x py-8 mx-auto space-y-6 sm:border-l sm:border-r rounded-xl max-w-full sm:max-w-5xl">
            <h1 className="text-3xl font-bold leading-tight text-center border-b pb-3">
                About
            </h1>
            <p className="text-pretty text-center max-w-2xl mx-auto">
                Welcome! This site helps people in and around Charlotte, North Carolina, discover <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink>. Keep reading to learn more.
            </p>
            {/* Creator*/}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle>
                        
                    </CardTitle>
                    <div className="flex justify-center">
                        <Image
                            src="/gifs/obiwan.gif"
                            alt="Hello There"
                            width={500}
                            height={500}
                            priority={true}
                            unoptimized={true}
                            className="rounded-xl"
                        />
                    </div>
                </CardHeader>
                <CardContent className="leading-relaxed text-pretty space-y-4">
                    <p>
                        What's up, I'm <ResponsiveLink href="https://segunakinyemi.com/">Segun Akinyemi</ResponsiveLink>, the creator and maintainer of this site. My goal is to connect people in Charlotte with places where they can:
                    </p>
                    <ul className="list-disc list-inside pl-4 space-y-2">
                        <li>Work remotely.</li>
                        <li>Read, write, study, relax, unwind, hang out, decompress, etc.</li>
                        <li>Meet friends, make new friends, or quietly enjoy the warmth of a shared space.</li>
                        <li>Enjoy cinnamon rolls while doing any of the above.</li>
                    </ul>
                    <p>
                        This site exists as a community resource for discovering Charlotte's many third places. Keep scrolling to get answers to frequently asked questions and learn more about the project.
                    </p>
                </CardContent>
            </Card>

            {/* Frequently Asked Questions */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center border-b pb-3">
                        Frequently Asked Questions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="space-y-4">
                        {frequentlyAskedQuestions.map((item, index) => (
                            <AccordionItem key={index} value={`question-${index + 1}`}>
                                <AccordionTrigger>{item.title}</AccordionTrigger>
                                <AccordionContent className="text-pretty">{item.content}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* Tech Stack */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center border-b pb-3">
                        Tech Stack
                    </CardTitle>
                </CardHeader>
                <CardContent className="leading-relaxed text-pretty space-y-4 ">
                    <p>
                        Check out my article <ResponsiveLink href="https://segunakinyemi.com/blog/charlotte-third-places-tech-stack">Exploring the Tech Stack Behind Charlotte Third Places</ResponsiveLink> for details about how this project was built.
                    </p>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center border-b pb-3">
                        Contact Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="leading-relaxed text-pretty">
                    <p>
                        The best way to get in touch is through the <Link href="/contribute" className="custom-link">Contribute</Link> page. Also, check out my <ResponsiveLink href="https://segunakinyemi.com">personal website</ResponsiveLink> or connect on <ResponsiveLink href="https://linkedin.com/in/segunakinyemi">LinkedIn</ResponsiveLink>.
                    </p>
                </CardContent>
            </Card>
        </section>
    );
}
