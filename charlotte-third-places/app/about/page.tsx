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
                About Charlotte Third Places
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
            {/* Site Creator*/}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center mb-4 border-b pb-3">
                        Site Creator
                    </CardTitle>
                    <div className="flex justify-center">
                        <Image
                            src="/images/obiwan.gif"
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

            {/* Frequently Asked Questions */}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center border-b pb-3">
                        Frequently Asked Questions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="space-y-4">
                        <AccordionItem value="question-1">
                            <AccordionTrigger>
                                What is a Third Place?
                            </AccordionTrigger>
                            <AccordionContent>
                                Third places are community spaces like cafes, parks, or libraries where people can gather outside of home and work. It's a subjective definition, and for this site, I've focused on places that invite longer stays and are conducive to remote work or socializing.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="question-2">
                            <AccordionTrigger>
                                Why aren't all breweries or restaurants listed?
                            </AccordionTrigger>
                            <AccordionContent>
                                I've curated this list to include only places that fit a certain profile of a third place—welcoming, relaxed, and conducive to remote work or gathering during the day.
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

            {/* Tech Stack */}
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl text-center border-b pb-3">
                        Tech Stack
                    </CardTitle>
                </CardHeader>
                <CardContent className="leading-relaxed space-y-4">
                    <p>
                        This site was built with the following technologies:
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
                        The data on this site comes from a variety of sources, including Google Maps, community feedback, and my own experiences visiting each place. While some fields like the name and address come directly from Google Maps, others—like whether a place has cinnamon rolls—are 100% curated by me.
                    </p>
                    <ul className="list-disc list-inside pl-4 space-y-4">
                        <li>
                            <strong>Name:</strong> This mostly comes from Google Maps, though I've occasionally edited names to make them clearer. Sometimes the names are a bit too formal or long, so I try to tweak them while keeping the original intent intact.
                        </li>
                        <li>
                            <strong>Type:</strong> This also comes from Google Maps, but it requires some curation on my part. Google might label a place as a coffee shop, but if it also functions as a bar or a café, I try to include all relevant types to really capture the essence of the space. My goal is to show off everything a place offers, not just its primary label.
                        </li>
                        <li>
                            <strong>Size:</strong> This one is all me! I base it on my personal visits to these places. If I haven't been there yet, I try to gauge the size from online photos or map views. If you ever see a size that feels off—or if you see “unsure” listed—reach out via the Contribute page and help me make it accurate.
                        </li>
                        <li>
                            <strong>Ambience:</strong> Future feature alert! This is a field I plan to add using AI to analyze Google Maps reviews. Rather than rely on my personal taste, I want the overall vibe of a place to be shaped by the experiences of those who frequent it.
                        </li>
                        <li>
                            <strong>Neighborhood:</strong> This comes from Google Maps, but I do a little extra curation. If the place is outside of Charlotte proper (think Matthews or Concord), I just use the city name as the neighborhood. If Google Maps gives me a hyper-specific neighborhood name that no one in Charlotte uses (like some tiny area of South End), I simplify it to something more recognizable. You can compare the neighborhood I listed with Google Maps via the "View Google Maps Profile" link in the modal for each place.
                        </li>
                        <li>
                            <strong>Address:</strong> 100% pulled from Google Maps. Pretty straightforward.
                        </li>
                        <li>
                            <strong>Purchase Required:</strong> Google Maps offers data for this, but it's often a guess. So, I've curated this based on my experience at the places I've visited or by inferring from the nature of the business. For example, most coffee shops expect you to buy something if you're staying a while, but spots like Optimist Hall let you hang without a purchase. If you see anything wrong here, feel free to submit feedback—I want this data to be as accurate as possible.
                        </li>
                        <li>
                            <strong>Parking Situation:</strong> Again, this comes from Google Maps, but it's a bit hit-or-miss. Some places are listed as having free parking when they don't, and vice versa. I've reviewed and curated the parking situation for every place listed. This is one field where I'd love community support if you see anything wrong.
                        </li>
                        <li>
                            <strong>Free WiFi:</strong> This one's all me. Google Maps doesn't cover this, so it's either based on my visits or inferred from reviews. I've made some assumptions here—like if a place requires a purchase to get the WiFi password, I still count it as free WiFi, since the expectation is you're going to buy something anyway.
                        </li>
                        <li>
                            <strong>Has Cinnamon Rolls:</strong> 100% personal! I'm a huge fan of cinnamon rolls, and this field exists mostly for me (though I hope others enjoy it too). If you ever spot a place that serves cinnamon rolls but isn't marked as such, let me know—I'm on a mission to find them all!
                        </li>
                        <li>
                            <strong>Description:</strong> Pulled straight from Google Maps. If a place doesn't have a description there, the default value on this site is, "A third place the Charlotte, North Carolina area."
                        </li>
                        <li>
                            <strong>Website:</strong> Also straight from Google Maps—whatever the business lists as their website.
                        </li>
                        <li>
                            <strong>Google Maps Profile:</strong> This is the direct link to the place's Google Maps profile, pulled from their listing.
                        </li>
                        <li>
                            <strong>Comments:</strong> This is all me. These are my personal tips, tricks, and thoughts about a place. If I've noticed anything cool or quirky, this is where I share it. It's my little space to add value beyond what's just on the map.
                        </li>
                    </ul>
                </CardContent>
            </Card>




        </section>
    );
}
