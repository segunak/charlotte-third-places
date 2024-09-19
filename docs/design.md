# Design Document: Charlotte Third Places

## Overview

Charlotte Third Places is a curated platform designed to help users explore various community spaces in Charlotte, North Carolina, commonly referred to as "third places." These are locations that are neither home nor work but are important for community life, such as cafes, parks, libraries, and more. The platform is built using Next.js with Shadcn/UI for styling and deployed to Vercel.

## Home

The homepage features a comprehensive table listing all the places in the database. Users can:

- **Sort**: Organize the list based on various criteria such as name, type, or neighborhood.
- **Filter**: Narrow down the list based on specific attributes, like places with free Wi-Fi or free parking.
- **Group**: Organize the data into logical groups, for example by neighborhood or type of place.
- **Tabs for Pre-Built Filters**: The table will include tabs for quick access to pre-built filters, such as "All Places," "Free Wi-Fi," "Coffee Shops," etc.
- **Place Details**: Clicking on a place’s name will bring up a card with detailed information about that place. Users can close the card to return to the full table view.

## Map

The map feature will display all places plotted on Google Maps. Users can interact with the map in the following ways:

- **View All Places**: All listed places will be shown as markers on the map.
- **Place Details on Click**: Clicking on a marker will bring up a card with the place's details, similar to how Google Maps displays information. This card will overlay on the map without losing the overall view.
- **Interactive Navigation**: The map should be wide enough by default to include the addresses of every place on the list. The map remains visible at all times, providing an intuitive way to explore third places spatially.

## Contribute

Here's what should be on the contribute page. Each section below is a button that goes to either the same form with branching, or 3 different forms.

### Suggest a New Place

If chosen, it should take the user to a form with the following inputs:

1. **Your Name**
2. **Your Email**
3. **Place Name:**
4. **Place Neighborhood:** What part of the city is it in? A place can be in Charlotte or any of the surrounding areas.
5. **Comments**: Users are asked to defend why they think this place is a "Third Place," sharing what they like about it, any fun facts, pros/cons, etc. This input box is essential for understanding the place’s value to the community. There should be a subheading/label that explains this, tell us why you think this is a third place, tell us what you love about. Are there any quirks/details to the place you'd like others to know? Explain also that the defintion of a third place is subjective, and this website has a single maintainer, so there's no guarntee it'll be added to the site, but it'll at least be reviewed. Bright user frendly language.

### Suggest Enhancements to a Place

If chosen, it should take the user to a form with the following inputs in order:

1. **Your Name**
2. **Your Email**
3. **Place:**: A dropdown menu with all the places in the app, where the user must select the place they’re providing feedback about. The subheading should say something to this effect. Select the place you want to provide feedback/enhancements about.
4. **Enhancements**: This input box encourages users to share specific feedback/enhancements about the selected place. It should remind them that the data for the app comes from multiple sources, mostly Google Maps, and that some fields like `Has Cinnamon Rolls` are based on personal observations or anecdotal data.

### Contact the Site Creator

A simple form for any open message users want to send to the site creator.

1. **Your Name**
2. **Your Email**
3. **Message**: This input box should include a caption with friendly language, emphasizing that the app is a passion project. It should also include a hyperlink to the `/about` page for more information about the app and its creator. Encourage them to be kind.

## About

This page features a series of paragraphs with section headings, ending with links to the creator's personal website and LinkedIn. The entire page is written in the creator's voice, directly addressing users. Sections include:

- **About the Site**: A very basic overview of what the site is. Charlotte Third Places is a collection of third places in Charlotte, North Carolian (say this better, add professional tone). It was created by Segun Akinyemi (link to personal website), a software engiener and denizen of Charlotte who works remotely and enjoys rotating spots throughoitu the city and sharing his list of spots with friends. Everything on this about page should be first person, I am now writing as me rather than as some other person.
- **Contact**: Information on how to get in touch with the creator, basically telling them to use the "Contribute". Then list to your LinkedIn and personal website are as alternative contact methods.
- **Data Sources**: Details on where the data comes from and how it is maintained. The answer to this is Google Maps is where most of the data comes from. Specifically, here's where each field is from.
  - Name - Google Maps with a little bit of custom formatting to make some names clearer, bot mostly just the name from Google Maps.
  - Type - Also from Google Maps, but with some curation to try and best encapsulate all of what a place offers. For example, some places are a coffee shop, cafe, and bar. Google usually will just list one of those, I've tried to captuer all the types of a places in this field the best I can.
  - Size - Not from Google maps, totally based on my personal experience visting places, and for places I haven't been to, trying to gauge their size from the online photos and map view. If you see a size you disagree with, or one that's listed as unsure, use the contribute page (link to it) to contact me and help get it corrected.
  - Ambience - TBD. This is future state, a field that mentiosn the overall "vibe" and ambienec of a place. The plan is to let AI analyze user reviews from Google Maps to come up with this data rather than make it subjective to my opinion as the site creator.
  - Neighborhood - From Google Maps with some curation. For places outside of the city of Charlotte proper, I've listed the neighborhood as simply the name of the city (Matthews, Concord, Fort Mill, etc.). Then there's some places where the neighborhood from Google Maps is some name nobody who lives in Charlotte actually uses or recognizes, so I've changed the neighborhood to be something more representing of that general area. For example, there are specific Google Maps neighborhoods for small areas of South End that people in Charlotte would just call "South End". Rather than using the weird Google Maps name I just changed it to "South End". THere are a handful of places where I did that. You can find them out by clicking "View Google Maps Profile" on any place's pop up modal and comparing what I listed to what's on Google Maps.
  - Address - From Google Maps 100%.
  - Purchase Required - Google Maps provides this data but it's not entirely accurate. They're guessing. So as someone livign in Charlotte, I've curated this field to best encapsulate my epxrieince either visiting or place, or inferring whether they'd expect a purchase based on the nature of a place. For example, most coffee shops, cafe's, and restaruatns want you to buy something if you're going to hang out within it, but market halls like Optmist Hall are general spaces where people can go hangout without buying something. So this is a field that's heavily curated, and I'd appreciate you reachign out if you see a place with a value you know is wrong in this field. The goal is for this data to be as accurate as possible!
  - Parking Sitaution - From Google Maps with some curation. There are places Google Maps says have free parking that don't really, and places they say have free parking that don't really, so I personally reviewed the value of all places regarding this field. This is also one field where I'm looking for community support if you see a value that's wrong.
  - Free WiFi - 100% from me. This data isn't available on Google Maps. It's a safe bet that almost all coffee shops have WiFi, and places like Panera Bread, but eveyrwhere else, it's been me visiting personally and confirming or me inferring from reading Google Maps and Yelp Reviews. This is another field where community input is greatly appreicated, let me know if you see a wrong value! And as a note, I consider Free WiFi to include password protected WiFi. So in a way, if you go into a place, don't make a purchase, then ask for the WiFi password, they'll probbaly be like "lol why don't you buy something first then we'll tell you". In that case, is it really "Free WiFi"? I mean, probbaly not, but I'm making the base assumption that those visting a place where purchase is required will make a purchase and therby be given access to the WiFi if it's passwrod protected, thus making it free to use, with stipulations. Idk man, I tried not to overthink this field. 
  - Has Cinnamon Rolls - 100000% from me. I love cinnamon rolls. If you ever run into me, I'd be more than willing to speak in depth on why I believe them to be an exalted form of pastry. I like places that have cinnamon rolls. I added this field for myself. I want a quick way to filter to places that have cinnamon rolls whenever I want to go out and work remotely or hangout somewhere. I hope others get value from it as well. I ABOSUELTLY want community help making sure every single place that actually has cinnamon rolls is marked as "Yes" here.
  - Description - From Google Maps. This is the description the busienss wrote for themselves on Google Maps. For places with no Gooogle Maps description, the default value is "A third place in or around Charlotte, North Carolina".
  - Website - From Google Maps. The website the business put on their profile there if they have one.
  - Google Maps Profile - From Google Maps. A link to the places Google Maps profile.
  - Comments - Totally from me as the site creator. This is what I think of a place, my tips and tricks, anyhting I've noticed I think others might benefit from having. All me baby.
- **Frequently Asked Questions**
  - Who built and maintains Charlotte Third Places?
    - It is I Segun Akinyemi, you can learn more about me here (link to website.). In short, I'm a software engineer that works remotely and loves doing so from spots around the city. I moved to Charlottte in 2020 during the pandemic and rotated around cofee shops and cafes and variosu other third places as a way to feel human again, connected, and make friends. I kept a list on my phone of my favorte places, and would get asked to share it by people I'd meet. Eventually the list was so long it wasn't effiicent copy/pasting, and out of that the idea to make this website to share it was born.
  - What is a Third Place?
    - Use the standard professional defintion. Mention that determining what qualfiies as a third place is subjective. Link them to this Reddit thread to read people in Charltote debating about it. Mention that as this is my website, I make the calls, but i'm open to community feedback. I'm trying to avoid listing every single park and every single resturatn and every single community center. Once you do that the site just becomes "lol just use Google Maps" rather than something that's curated and special. <https://www.reddit.com/r/Charlotte/comments/1cid1i5/what_are_your_favorite_third_places_in_charlotte/>
  - Charlotte is known for having a lot of breweries, and they could be said to qualify as a third place. Why isn't literally every brewery in Charlotte listed in the app?
    - The author elected to only add breweries that you could also hang out at during the day, grab a coffee in the morning, work/study on your laptop, etc., before the drinking starts. Yes, technically speaking you could consider every brewery a third place, but the goal with this app is to filter to those that really lean into that identity. Simply put, places that cater to more than just the beer crowd.
  - What about restaurants? Aren't restaurants third places? Why isn't literally every single restaurant in Charlotte listed in the app?
    - I don't know that restaurants qualify as Third Places. Part of the definition of such is "little to no financial barrier to entry", which disqualifies most restaurants. This is a nuanced topic where no side is right. The app author has simply decided to exclude restaurants, except for those styling themselves as hybrid cafe types, like Amelie's.
  - Where does the data for the app come from?
    - Google maps
  - Why is there a `Has Cinnamon Rolls` column?
    - I love cinnmaon rolls and wanted to have a list of where I can get them easily.
  - Starbucks locations are quintessential examples of a third place. Why not list every single one in the greater Charlotte area?
    - This is a valid point. To counter, some Starbucks, like those inside of grocery stores and malls, aren't exactly set up as third places. They're quick stops on your way to doing something else, you're not expected to stay awhile. Other Starbucks are just small, and have removed quite a bit of the interiro seating, ostensibly to discourage hanging about. And so, this project makes the choice to include a Starbucks only when it qualifies as a proper third place, in that there's sufficinet interor seating. There's likely many such Starbucks in the greater Charlotte area that have been left of the list. Feel free to use the Feedback tab to submit new ones, this is a community driven list!
  - I see some information about a place that's wrong. How can I get it updated?
    - Link them to the contribute page to provide feedback.
  - I submitted a place and haven't seen it added to the app yet. What should I do?
    - The user should do nothing. There's only 1 person maintaining the app, that person is busy. Also, there's a certain amount of filtering going on to only add places that truly qualify as a third place. Be nice about it.
- **Tech Stack**: An overview of the technology used to build the site. this is all the stuff I used.
  - NextJS
  - TypeScript
  - Python for interactions with the Google Maps and Outscraper API's in Azure Functions.
  - React
  - AG Grid (amazing, just so amazing)
  - shadcn/ui which is built on Radix UI
  - Tailwind CSS
  - Microsoft Designer (AI generated images, logos, etc.)
  - OpenAI's ChatGPT
  - Google Maps Places API
  - The officially supported by Google <https://visgl.github.io/react-google-maps/>. There's so many other confusin-ptions out there.
  - Airtable to store the places data and the Airtabel JS API for easy integration into the site.
  - Azure Functions to interact with the Google Maps API.
  - Outscraper (getting reviews for amibeince analysis)

## Technical Details

Here's how the site works.

### Frontend

The frontend of Charlotte Third Places is built using **Next.js**, a powerful React framework that enables both server-side rendering (SSR) and static site generation (SSG). This allows the application to deliver fast, SEO-friendly pages while minimizing the load on the backend. The site uses **Shadcn/UI** for its component-based styling, ensuring a consistent and modern user interface that adapts smoothly across devices.

### Backend

The backend for Charlotte Third Places leverages **Airtable** as the primary data store. Data about the third places is initially sourced from the **Google Maps Places API**. This data is enriched and processed through a serverless architecture using **Azure Functions**. A specific function is triggered via a **GitHub Action**, which updates the Airtable database with the latest information. This setup ensures that the site remains up-to-date with minimal manual intervention.

### Data Enrichment and Analysis

To enhance the quality and richness of the data, the application integrates with several APIs:

- **Outscraper**: Reviews data is gathered from Outscraper for each place. This data is then analyzed to perform ambience analysis. Using AI, the reviews are processed to generate two adjectives that best describe the ambience of each place.
- **OpenAI API**: If a place lacks a description on Google Maps, the reviews collected by Outscraper are used by the OpenAI API to generate a meaningful description for the place.

### Caching and Performance Optimization

The site uses **Static Site Generation (SSG)** with Next.js to pre-render pages during the build process, which significantly enhances performance and scalability. To ensure the data remains fresh without exceeding Airtable's API limits, the site employs a 12-hour caching strategy. This means that any updates from the Airtable database are fetched at most twice a day, reducing the frequency of API calls while still ensuring that users have access to up-to-date information.

### Deployment

The application is deployed on **Vercel**, taking advantage of their generous hobby tier, which provides free hosting for small projects with capabilities such as edge caching and serverless functions. Vercel's global infrastructure ensures that the site is fast and accessible to users worldwide.

### Summary

The combination of Next.js for the frontend, serverless Azure Functions for backend processing, and the strategic use of APIs for data enrichment makes Charlotte Third Places a robust and scalable application. By leveraging modern tools and services, the site delivers a seamless experiencef to users while efficiently managing resources and API limits.
