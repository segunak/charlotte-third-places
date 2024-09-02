# Design Document: Charlotte Third Places

## Overview

Charlotte Third Places is a curated platform designed to help users explore various community spaces in Charlotte, North Carolina, commonly referred to as "third places." These are locations that are neither home nor work but are important for community life, such as cafes, parks, libraries, and more. The platform is built using Next.js with Shadcn/UI for styling and deployed to Vercel.

## Features

### Home

The homepage features a comprehensive table listing all the places in the database. Users can:

- **Sort**: Organize the list based on various criteria such as name, type, or neighborhood.
- **Filter**: Narrow down the list based on specific attributes, like places with free Wi-Fi or free parking.
- **Group**: Organize the data into logical groups, for example by neighborhood or type of place.
- **Tabs for Pre-Built Filters**: The table will include tabs for quick access to pre-built filters, such as "All Places," "Free Wi-Fi," "Coffee Shops," etc.
- **Place Details**: Clicking on a place’s name will bring up a card with detailed information about that place. Users can close the card to return to the full table view.

### Map
The map feature will display all places plotted on Google Maps. Users can interact with the map in the following ways:

- **View All Places**: All listed places will be shown as markers on the map.
- **Place Details on Click**: Clicking on a marker will bring up a card with the place's details, similar to how Google Maps displays information. This card will overlay on the map without losing the overall view.
- **Interactive Navigation**: The map should be wide enough by default to include the addresses of every place on the list. The map remains visible at all times, providing an intuitive way to explore third places spatially.

### Contribute

The "Contribute" section allows users to participate in the growth and accuracy of the platform. It provides several key functions:

#### About This App

This page features a series of paragraphs with section headings, ending with links to the author's personal website and LinkedIn. The entire page is written in the author's voice, directly addressing users. Sections include:

- **About the Author**: Background on the author, providing personal context.
- **How Charlotte Third Places Came To Be**: The origin story of the platform.
- **Frequently Asked Questions (FAQs)**: Common inquiries about third places, the criteria for listing, data sources, and other relevant topics.
  - *Example Questions*:
    - What is a Third Place?
    - Why aren’t all breweries or restaurants included?
    - What criteria are used for inclusion in the app?
    - Why does the app track quirky details like whether a place has cinnamon rolls?
  - Users are directed to the "Contribute" section for submitting corrections or additional suggestions.
- **Contact**: Information on how to get in touch with the author, with a strong preference for using the "Contribute" section rather than direct email. The author’s LinkedIn and personal website are listed as alternative contact methods.

#### Suggest a Place

If "Suggest a Place" is chosen, it should take the user to a form with the following fields:

1. **Your Name**
2. **Your Email**
3. **Place Name**
4. **Place Neighborhood**
5. **Comments**: Users are asked to defend why they think this place is a "Third Place," sharing what they like about it, any fun facts, pros/cons, etc. This input box is essential for understanding the place’s value to the community.

#### Provide Feedback About the App

If "Provide Feedback About the App" is chosen, it should take the user to a form with the following inputs in order:

1. **Name**
2. **Email**
3. **Message**: This input box should include a caption with friendly language, emphasizing that the app is a passion project. It should also include a hyperlink to the `/about` page for more information about the app and its author.

#### Provide Feedback About a Place

If "Provide Feedback About a Place" is chosen, it should take the user to a form with the following inputs in order:

1. **Name**
2. **Email**
3. **Place Selection**: A dropdown menu with all the places in the app, where the user must select the place they’re providing feedback about.
4. **Message**: This input box encourages users to share specific feedback about the selected place. It should remind them that the data for the app comes from multiple sources, including Google Maps, and that some fields like `Has Cinnamon Rolls` are based on personal observations or anecdotal data.

### About

The "About" section provides:

- **Author's Background**: Information about the author, their motivations for creating the platform, and their personal story.
- **Tech Stack**: An overview of the technology used to build the site, including the use of Next.js, Shadcn/UI, and Airtable.
- **Data Sources**: Details on where the data comes from and how it is maintained.
- **Contact Information**: Information on how to get in touch with the author or contribute information about a place, linking to the "Contribute" section.

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
