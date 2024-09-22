import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function AboutPage() {
    return (
        <section className="px-4 sm:px-6 py-8 space-y-6 mx-auto max-w-full sm:max-w-4xl border border-gray-300 rounded-lg shadow-lg bg-background">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-center border-b pb-3">
                About
            </h1>
            <div className="flex justify-center">
                <div className="relative w-[18rem] h-[18rem] sm:w-[21rem] sm:h-[21rem] rounded-full overflow-hidden shadow-lg">
                    <Image
                        src="/logos/skyline-with-text-badge.png"
                        alt="Charlotte Skyline"
                        fill={true}
                        style={{ objectFit: "contain" }}
                        className="rounded-lg p-5"
                    />
                </div>
            </div>
            <p>
                Welcome to Charlotte Third Places, a curated collection of <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink> in and around Charlotte, North Carolina. Browse the list of spots <Link href="/" className="custom-link">here</Link>, explore them on a map <Link href="/map" className="custom-link">here</Link>, contribute to the community <Link href="/contribute" className="custom-link">here</Link>, or continue reading to discover more about the site.
            </p>
            {/* Frequently Asked Questions */}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center border-b pb-3">
                        Frequently Asked Questions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="space-y-4">

                        {/* Who built and maintains the site */}
                        <AccordionItem value="question-1">
                            <AccordionTrigger>
                                Who built and maintains Charlotte Third Places?
                            </AccordionTrigger>
                            <AccordionContent>
                                It is I, Segun Akinyemi! I'm a software engineer working remotely, and if you're reading this, I'm the person responsible for curating this site. I moved to Charlotte in 2020 during the pandemic, and like many of you, I spent that year in isolation. Once things opened up, I wanted to explore the city and find spots to work remotely, hang out, or just not be cooped up at home. So, I kept a list of my favorite third places on my phone, and after getting enough requests from friends to share it, I realized: there’s gotta be a better way. Enter this website. It’s a project born out of my love for Charlotte and the countless coffee shops, cafes, and other third places I’ve come to appreciate. You can learn more about me on my <a href="your-website-link" className="text-blue-500">personal website</a>.
                            </AccordionContent>
                        </AccordionItem>

                        {/* What is a Third Place */}
                        <AccordionItem value="question-2">
                            <AccordionTrigger>
                                What is a Third Place?
                            </AccordionTrigger>
                            <AccordionContent>
                                Third places are those spots outside of your home (your "first place") and your workplace (your "second place") where community gathers and you feel a sense of belonging. These places can be coffee shops, parks, libraries, and more. It’s a pretty broad term, and everyone defines it differently. To read more about how people in Charlotte think about third places, check out this <a href="https://www.reddit.com/r/Charlotte/comments/1cid1i5/what_are_your_favorite_third_places_in_charlotte/" className="text-blue-500">Reddit thread</a>. Keep in mind, this website is curated, so not every public space qualifies. I try to stick with places that encourage people to stay a while, whether to work remotely or to socialize. And remember, I’m always open to feedback!
                            </AccordionContent>
                        </AccordionItem>

                        {/* Why aren’t all breweries or restaurants listed */}
                        <AccordionItem value="question-3">
                            <AccordionTrigger>
                                Why aren’t all breweries or restaurants listed?
                            </AccordionTrigger>
                            <AccordionContent>
                                While Charlotte is known for its brewery scene, I didn’t want to include every single one. My goal is to highlight places where you can hang out during the day, maybe grab a coffee or work on your laptop before the drinking crowd shows up. Sure, technically, breweries can be third places, but I’m focused on places that offer a more diverse environment. As for restaurants, they usually come with the expectation of buying a meal, which doesn’t fully align with the "little to no financial barrier to entry" concept of third places. Exceptions are those spots that have a hybrid cafe-like vibe, like Amelie’s.
                            </AccordionContent>
                        </AccordionItem>

                        {/* Where does the data come from */}
                        <AccordionItem value="question-4">
                            <AccordionTrigger>
                                Where does the data for the app come from?
                            </AccordionTrigger>
                            <AccordionContent>
                                The data comes from a mix of sources. Most of it is pulled from Google Maps—things like the name, address, and type of place. Other fields, like whether a place has cinnamon rolls (yes, really), are based on my personal experience or feedback from users like you. Check out the "Contribute" page if you want to help me improve or add data!
                            </AccordionContent>
                        </AccordionItem>

                        {/* Why is there a Has Cinnamon Rolls column */}
                        <AccordionItem value="question-5">
                            <AccordionTrigger>
                                Why is there a 'Has Cinnamon Rolls' column?
                            </AccordionTrigger>
                            <AccordionContent>
                                Simple: I love cinnamon rolls. They are the pinnacle of pastry excellence, and sometimes I just want to know where I can get one when I’m working remotely or hanging out. So, I added this field for myself, but if you also love cinnamon rolls, I’m sure you’ll appreciate it. Feel free to submit any suggestions to help make this list more accurate!
                            </AccordionContent>
                        </AccordionItem>

                        {/* Why aren’t all Starbucks locations listed */}
                        <AccordionItem value="question-6">
                            <AccordionTrigger>
                                Why aren’t all Starbucks locations listed?
                            </AccordionTrigger>
                            <AccordionContent>
                                Starbucks is often considered the quintessential third place, but not every location qualifies. Some are inside grocery stores or malls, where you’re not expected to stay and hang out. Others have removed seating, turning them into more of a grab-and-go spot. For this project, I’ve only included the Starbucks locations where you can settle in, work, or just chill for a bit. If you think I’ve missed one, use the Feedback tab to let me know!
                            </AccordionContent>
                        </AccordionItem>

                        {/* I see wrong information. How can I update it? */}
                        <AccordionItem value="question-7">
                            <AccordionTrigger>
                                I see some information about a place that's wrong. How can I get it updated?
                            </AccordionTrigger>
                            <AccordionContent>
                                Mistakes happen! If you spot any incorrect details, head over to the <Link href="/contribute">Contribute</Link> to and submit your corrections. Your input helps me keep things accurate, and I appreciate it!
                            </AccordionContent>
                        </AccordionItem>

                        {/* I submitted a place and haven’t seen it added yet. What should I do? */}
                        <AccordionItem value="question-8">
                            <AccordionTrigger>
                                I submitted a place and haven’t seen it added yet. What should I do?
                            </AccordionTrigger>
                            <AccordionContent>
                                First off, thanks for submitting! But please bear with me. I’m the only person maintaining the site, and between my day job and other commitments, it can take me a while to review and add new places. Also, I do filter submissions to ensure they fit the vibe of a true third place, so not every suggestion will make it. Rest assured, I appreciate your input.
                            </AccordionContent>
                        </AccordionItem>

                        {/* Additional Question: Can I contribute to the site? */}
                        <AccordionItem value="question-9">
                            <AccordionTrigger>
                                Can I contribute to the site?
                            </AccordionTrigger>
                            <AccordionContent>
                                Absolutely! This project thrives on community input. Whether it’s suggesting a new place, providing updates to existing ones, or just offering ideas for improvement, I’d love to hear from you. Visit the "Contribute" page to get started.
                            </AccordionContent>
                        </AccordionItem>

                        {/* Additional Question: How often is the data updated? */}
                        <AccordionItem value="question-10">
                            <AccordionTrigger>
                                How often is the data updated?
                            </AccordionTrigger>
                            <AccordionContent>
                                The data is updated every 12 hours, thanks to Next.js’ incremental static regeneration. This means any changes to the listings, new places added, or corrections made will be reflected regularly. Of course, I rely on the community and my own exploration to keep things fresh, so feel free to pitch in!
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            {/* Site Creator*/}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center mb-4 border-b pb-3">
                        Site Creator
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
                        Hello! I'm Segun Akinyemi—Christian, Software Engineer, Writer, and Tech Enthusiast. I built and maintain this site with the goal of connecting people with places in Charlotte where they can study, read, write, chill, watch anime, work remotely, hang out with friends, or enjoy some time alone in a relaxing environment. Whether you're looking for a coffee shop, café, quiet library, or something else, this site aims to help you find the perfect spot. To learn more about me, check out my{" "} <ResponsiveLink href="https://segunakinyemi.com/about">personal website</ResponsiveLink>.
                    </p>
                </CardContent>
            </Card>

            {/* Data Sources */}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center border-b pb-3">
                        Data Sources
                    </CardTitle>
                </CardHeader>
                <CardContent className="leading-relaxed space-y-4">
                    <p>
                        The data on this site comes from a variety of sources, including Google
                        Maps, community feedback, and my own experiences visiting each place.
                        While some fields—like the name and address—come directly from Google
                        Maps, others (like whether a place has cinnamon rolls) are curated by
                        me. Let's dive deeper into each field below:
                    </p>
                    <Accordion type="single" collapsible>
                        <AccordionItem value="name">
                            <AccordionTrigger>
                                Name
                            </AccordionTrigger>
                            <AccordionContent>
                                This mostly comes from Google Maps, though I've occasionally edited names
                                to make them clearer. Sometimes the names are too formal or long, so I tweak
                                them to ensure clarity while preserving the original intent.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="type">
                            <AccordionTrigger>
                                Type
                            </AccordionTrigger>
                            <AccordionContent>
                                This comes from Google Maps but requires some curation. Google might label
                                a place as a coffee shop, but if it's also a bar or café, I include all
                                relevant types to capture the full essence of the space.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="size">
                            <AccordionTrigger>
                                Size
                            </AccordionTrigger>
                            <AccordionContent>
                                This one is all me! Based on personal visits, I gauge the size of each
                                place. If I haven't been to a location, I infer the size from online
                                photos or map views. If you think a size is off, feel free to reach
                                out via the Contribute page.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="ambience">
                            <AccordionTrigger>
                                Ambience
                            </AccordionTrigger>
                            <AccordionContent>
                                Future feature alert! I'm planning to add ambience data using AI to
                                analyze reviews on Google Maps. Instead of relying solely on my taste,
                                I want the vibe of each place to reflect the experiences of others.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="neighborhood">
                            <AccordionTrigger>
                                Neighborhood
                            </AccordionTrigger>
                            <AccordionContent>
                                This also comes from Google Maps, but I do some extra curation.
                                For places outside Charlotte proper (like Matthews or Concord),
                                I list the city name. If Google suggests an obscure neighborhood
                                that locals don't recognize, I simplify it to something more familiar.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="address">
                            <AccordionTrigger>
                                Address
                            </AccordionTrigger>
                            <AccordionContent>
                                100% pulled from Google Maps. Pretty straightforward.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="purchase">
                            <AccordionTrigger>
                                Purchase Required
                            </AccordionTrigger>
                            <AccordionContent>
                                Google Maps offers data here, but it's not always accurate. I've
                                curated this based on my experiences. For example, most coffee shops
                                expect you to make a purchase if you're staying for a while, while
                                other places like Optimist Hall don't.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="parking">
                            <AccordionTrigger>
                                Parking Situation
                            </AccordionTrigger>
                            <AccordionContent>
                                While Google Maps provides parking data, it's hit-or-miss. I've
                                personally reviewed and curated this field, but if you notice any
                                mistakes, please help out!
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="wifi">
                            <AccordionTrigger>
                                Free WiFi
                            </AccordionTrigger>
                            <AccordionContent>
                                This one's all on me. I visit places and confirm if they have free
                                WiFi, or I infer it from reviews. Even if a place requires a purchase
                                to get the WiFi password, I still count it as free WiFi.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="cinnamon">
                            <AccordionTrigger>
                                Has Cinnamon Rolls
                            </AccordionTrigger>
                            <AccordionContent>
                                100% personal! I'm a huge fan of cinnamon rolls, and this field exists
                                mostly for me (though I hope others enjoy it too). If you know of a
                                place that serves them but isn't listed here, let me know!
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="description">
                            <AccordionTrigger>
                                Description
                            </AccordionTrigger>
                            <AccordionContent>
                                Pulled directly from Google Maps. If a place doesn't have a
                                description, I use a default: "A third place in the Charlotte,
                                North Carolina area."
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="website">
                            <AccordionTrigger>
                                Website
                            </AccordionTrigger>
                            <AccordionContent>
                                Also pulled straight from Google Maps—whatever the business lists
                                as their website.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="maps-profile">
                            <AccordionTrigger>
                                Google Maps Profile
                            </AccordionTrigger>
                            <AccordionContent>
                                This is the direct link to the place's Google Maps profile, pulled
                                from their listing.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="comments">
                            <AccordionTrigger>
                                Comments
                            </AccordionTrigger>
                            <AccordionContent>
                                These are my personal tips, tricks, and thoughts about a place. I
                                add value beyond what's just on the map by sharing any cool or quirky
                                details I've noticed.
                            </AccordionContent>
                        </AccordionItem>
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
                    <p>This site was built using a wide range of technologies to create a seamless, dynamic, and efficient experience. Below is an overview of the tools and frameworks used, grouped for clarity.</p>

                    <Accordion type="single" collapsible className="space-y-4">
                        {/* Frontend & Styling */}
                        <AccordionItem value="frontend">
                            <AccordionTrigger>Frontend & Styling</AccordionTrigger>
                            <AccordionContent>
                                <ul className="list-disc list-inside pl-4 space-y-3">
                                    <li>
                                        <strong>Next.js:</strong> The powerful React framework that handles the server-side rendering and static generation, giving this site speed and reliability. It's a great fit for building modern, SEO-friendly web applications.
                                    </li>
                                    <li>
                                        <strong>React:</strong> At the heart of the UI, React's component-based architecture allows for a highly interactive and dynamic experience, making every page of this site feel fluid and responsive.
                                    </li>
                                    <li>
                                        <strong>Tailwind CSS:</strong> The utility-first CSS framework that lets me build fast and keep my designs consistent. With Tailwind, responsiveness and custom styling come effortlessly.
                                    </li>
                                    <li>
                                        <strong>Shadcn/UI (Radix UI):</strong> Built on Radix UI, Shadcn provides accessible, reusable components for a smooth user interface. These components make the design of the site cohesive and user-friendly.
                                    </li>
                                    <li>
                                        <strong>React Icons:</strong> This project uses React Icons, which allows me to pull in icons from multiple libraries without cluttering my dependencies. It's one of those "small joys" that makes building UI fun.
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
                                        <strong>Python (Azure Functions):</strong> All backend interactions, especially with the Google Maps API and Outscraper, are handled through Python scripts running on Azure Functions. This serverless architecture keeps the backend lightweight and scalable.
                                    </li>
                                    <li>
                                        <strong>Azure Functions:</strong> Azure Functions serve as the engine of the backend, handling tasks like interacting with APIs in a scalable, efficient, and serverless way.
                                    </li>
                                    <li>
                                        <strong>Google Maps Places API:</strong> This API powers the site's data, providing details like names, addresses, and types of third places in Charlotte. Google Maps ensures the most accurate information possible.
                                    </li>
                                    <li>
                                        <strong>Outscraper:</strong> Outscraper is responsible for gathering reviews for the "ambience" data field. It's part of a future feature where I plan to analyze reviews to offer insights into the vibe of each location.
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
                                        <strong>Airtable:</strong> All the third place data is stored in Airtable, providing an easy-to-manage and scalable solution. The Airtable JS API is used to pull this data into the site effortlessly.
                                    </li>
                                    <li>
                                        <strong>Google Maps Places API:</strong> This is used to pull crucial information about each place—like its name, address, and category. It’s what allows this site to function as a third-place directory.
                                    </li>
                                    <li>
                                        <strong>AG Grid:</strong> AG Grid is used for displaying the list of third places. It’s flexible, customizable, and provides all the functionality you could ever want in a data grid.
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

            {/* Project Background */}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center border-b pb-3">
                        Project Background
                    </CardTitle>
                </CardHeader>
                <CardContent className="leading-relaxed space-y-4">
                    <p>
                        The inspiration for this project came from my experiences moving to Charlotte in 2020 during the COVID-19 pandemic. I spent my first year in the city in relative isolation, working remotely from my cramped Uptown apartment, going to the gym that was just downstairs in the building, and rarely venturing further than the Harris Teeter down the street. When things started slowly opening back up around the city, although I was (and am still) working remotely, I was in rather dire need of places to hangout where I could at least see other people, with the hope of eventually talking to some of them. It's tough moving to a new city where you know literally no one, and while I'm not a complete introvert, I'm relatively one (shout to my <ResponsiveLink href="https://www.16personalities.com/intj-personality">INTJ's</ResponsiveLink>), so I was in real danger of staying in my "shell of comfort" and not connecting with anyone in this new city I had been so excited to move to. To combat this, I set out to work from somehwere other than my apartemnt every day of the week.
                    </p>
                    <p>
                        At first, it wasn't about meeting people, it was just about seieng people (COVID was rough y'all). Eventually, it became easy to amek friends, as you become a regular somehwere, get to know the staff, the oother regular,s and make connections. As I kept doing this, I found myself scouring Google Maps, Yelp, <ResponsiveLink href="https://workfrom.co/charlotte">WorkForm</ResponsiveLink> and threads on the Charlotte <ResponsiveLink href="https://www.reddit.com/r/Charlotte/">subreddit</ResponsiveLink> looking for new spots to hangout, work, read, and just chill. As I did this, I kept a list, and it kept growing, and growing, aFnd growing, to the point where it was no longer viable to keep just in my notes app. I'd meet people around the city who also worked remotely (I have no data to back this up but Charlotte seems to have a good crowd of remote workers) and wanted to learn more about some of my favorite spots. Eventaully, sharing a long list with random comments that only made sense to me became untenable, and I wanted to make something more oranized nad formal to share with others. IT was out of that desire that this project was born. As a software enineer, I knew I had the skills to build a website/app that'd do it, I just had to find the time. Well, I finally did (over the course of many evenings and weekends, got to keep my day job) and I'm so happy you're here, reading this right now, and hopefully benefiting from this site.
                    </p>
                    <p>
                        In addition to allowing me to organize my list better, building this site was a learning/tinkering exercise for me. I love making things with software, so much so that I do it professionally, but it can be hard finding time to make things that you want to make, rather than what your coproate employer wants you to. Making this project allowed me to use all sorts of frameworks and libaries and language that I'm unlikely to use in my curretnt job role, allowing me to grow my skills, explore new areas of tech, and just straight up have fun. It was fun. I had fun building this site. I have fun maintaing it. I hope you have fun browsing it! Keep scrolling to read more about the tech that was used to make the site, where the data comes from, and how you can get in contact with me.
                    </p>
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
