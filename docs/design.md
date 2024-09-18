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

- **About the creator**: Background on the creator, providing personal context.
- **How Charlotte Third Places Came To Be**: The origin story of the platform. Link to article on personal website.
- **Tech Stack**: An overview of the technology used to build the site, including the use of Next.js, Shadcn/UI, and Airtable.
- **Data Sources**: Details on where the data comes from and how it is maintained.
- **Frequently Asked Questions (FAQs)**: Common inquiries about third places, the criteria for listing, data sources, and other relevant topics.
  - *Example Questions*:
    - What is a Third Place?
    - Why aren’t all breweries or restaurants included?
    - What criteria are used for inclusion in the app?
    - Why does the app track quirky details like whether a place has cinnamon rolls?
  - Users are directed to the "Contribute" section for submitting corrections or additional suggestions.
- **Contact**: Information on how to get in touch with the creator, with a strong preference for using the "Contribute" section rather than direct email. The author’s LinkedIn and personal website are listed as alternative contact methods.

Here's the same information in a more draft format.

This page should be a series of paragraphs with section headings, and should end with a link the the author's personal website and LinkedIn. The entire page should be written in the voice of the author, so the author directly speaking to users. Here are the sections.

- About the Author
- How Charlotte Third Places Came To Be
- Frequently Asked Questions
  - What is a Third Place?
  - Charlotte is known for having a lot of breweries, and they could be said to qualify as a third place. Why isn't literally every brewery in Charlotte listed in the app?
    - The author elected to only add breweries that you could also hang out at during the day, grab a coffee in the morning, work/study on your laptop, etc., before the drinking starts. Yes, technically speaking you could consider every brewery a third place, but the goal with this app is to filter to those that really lean into that identity. Simply put, places that cater to more than just the beer crowd.
  - What about restaurants? Aren't restaurants third places? Why isn't literally every single restaurant in Charlotte listed in the app?
    - I don't know that restaurants qualify as Third Places. Part of the definition of such is "little to no financial barrier to entry", which disqualifies most restaurants. This is a nuanced topic where no side is right. The app author has simply decided to exclude restaurants, except for those styling themselves as hybrid cafe types, like Amelie's.
  - Where does the data for the app come from?
  - Why is there a `Has Cinnamon Rolls` column?
  - Starbucks locations are quintessential examples of a third place. Why not list every single one in the greater Charlotte area?
    - This is a valid point. To counter, some Starbucks, like those inside of grocery stores and malls, aren't exactly set up as third places. They're quick stops on your way to doing something else, you're not expected to stay awhile. Other Starbucks are just small, and have removed quite a bit of the interiro seating, ostensibly to discourage hanging about. And so, this project makes the choice to include a Starbucks only when it qualifies as a proper third place, in that there's sufficinet interor seating. There's likely many such Starbucks in the greater Charlotte area that have been left of the list. Feel free to use the Feedback tab to submit new ones, this is a community driven list!
  - I see some information about a place that's wrong. How can I get it updated?
    - Link them to the `feedback` tab.
  - I submitted a place and haven't seen it added to the app yet. What should I do?
    - The user should do nothing. There's only 1 person maintaining the app, that person is busy. Also, there's a certain amount of filtering going on to only add places that truly qualify as a third place.
- Contact
  - Information about how to get in contact with the author. A link to the feedback tab is best (don't list your email.). Here you can list your website and LinkedIn though, approved channels for contacting the author.

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
