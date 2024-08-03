# References

This document is a bed of random code snippets, configurations, and the like for reference purposes.

## Expo Stuff

* Starting things, from the `expo/charlotte-third-places` directory run `npx expo start`.

## App Design

From left to right, these are the tabs for the app.

1. `index.tsx`: All the places with filters that let you get into more granular sets of places. I want to also provide grouped views of the data by default, namely neighborhood and size. Then users can get into more filters themselves. They should be able to choose their desired filters. I am thinking of using Airtable embeds here, and creating different views in Airtable for the groupings. However, if there's a well-known React Native library or tool that creates tables with filters and groups and works well for mobile then I'd like to use that. I don't mind having custom code to handle the web differently than mobile, but one solution for all is preferred.
2. `map.tsx`: A view of all the places plotted on a map. Use Google Maps for this.
3. `favorites.tsx`: A list of places that the user has favorited. I don't want to ask users to create an account, this list will need to be something I store as cookies on the web and somehow else on mobile. I want to keep track of their favorites without asking for a full user account.
4. `feedback.tsx`: This screen should initially show two buttons. One button for submitting a new place for potential addition to the data. Another button for providing feedback about an existing place (adding a note, pointing out something is wrong). Each button should take them to a form for the appropriate feedback type, all on the same tab.

There will be another screen, `about` information. I think having this persistent as a tab at the bottom would encourage people to click on it more, but I also think it's such a "if you care here's more details" sort of thing, dedicating a whole tab to it isn't needed. I am thinking of having it be a modal in the top right, an icon you can click anytime, but that isn't always in the tab navigation, as there's no interaction youd have there. Places, map, and feedback tabs all require user interaction, about does not, so don't have it in the tab bar. 

`about.tsx`: Information about the app. The author, why it was created, how places were chosen, where the data comes from (Google Maps), external links to more information.

## Screen Details

Here are more details about the design of each of the screens (tabs) of the app.

### Places

This is the default route, so its file name is `index.tsx`. The first thing you see when you open the app is all the places in list format. There should be a filter button in the upper right-hand corner that allows you to filter by the following columns.

* Size
* Ambience
* Neighborhood
* Purchase Required
* Parking
* Has Fireplace
* Has Cinnamon Rolls

The tab will also provide the ability to group the data, perhaps as a sub-menu of filtering. The following groups should be available.

* By Neighborhood
* By Size
* By Purchase Required

There should also be a search box at the top allowing users to search for places. I'm thinking on mobile, instead of trying to display a table with all the columns, display a card with the cover photo, the name of the place, the neighborhood, and the size. Then to get more details, the user clicks the card and see's everything. All filtering, searching, and sorting options should also be available on mobile. Check out these examples.

* https://tamagui.dev/bento/elements/tables
* https://callstack.github.io/react-native-paper/docs/components/DataTable/

### Map

The map tab should have a Google Maps map of the Charlotte area, wide enough by default to include the address of every place on the list. Every place from the list should be a pin on the map. When you click on a pin, it should open the profile of that place, as in every column of data that it has shown vertically.

### Feedback

The first thing this view should feature is buttons. Each takes the either to a screen or to a form. They are as follows.

* "About this App"
* "Suggest a Place"
* "Provide Feedback About the App"
* "Provide Feedback About a Place"

#### About This App

This page should be a series of paragraphs with section headings, and should end with a link the the author's personal website and LinkedIn. The entire page should be written in the voice of the author, so the author directly speaking to users. Here are the sections.

* About the Author
* How Charlotte Third Places Came To Be
* Frequently Asked Questions
  * What is a Third Place?
  * Charlotte is known for having a lot of breweries, and they could be said to qualify as a third place. Why isn't literally every brewery in Charlotte listed in the app?
    * The author elected to only add breweries that you could also hang out at during the day, grab a coffee in the morning, work/study on your laptop, etc., before the drinking starts. Yes, technically speaking you could consider every brewery a third place, but the goal with this app is to filter to those that really lean into that identity. Simply put, places that cater to more than just the beer crowd.
  * What about restaurants? Aren't restaurants third places? Why isn't literally every single restaurant in Charlotte listed in the app?
    * I don't know that restaurants qualify as Third Places. Part of the definition of such is "little to no financial barrier to entry", which disqualifies most restaurants. This is a nuanced topic where no side is right. The app author has simply decided to exclude restaurants, except for those styling themselves as hybrid cafe types, like Amelie's.
  * Where does the data for the app come from?
  * Why is there a `Has Cinnamon Rolls` column?
  * Starbucks locations are quintessential examples of a third place. Why not list every single one in the greater Charlotte area?
    * This is a valid point. To counter, some Starbucks, like those inside of grocery stores and malls, aren't exactly set up as third places. They're quick stops on your way to doing something else, you're not expected to stay awhile. Other Starbucks are just small, and have removed quite a bit of the interiro seating, ostensibly to discourage hanging about. And so, this project makes the choice to include a Starbucks only when it qualifies as a proper third place, in that there's sufficinet interor seating. There's likely many such Starbucks in the greater Charlotte area that have been left of the list. Feel free to use the Feedback tab to submit new ones, this is a community driven list!
  * I see some information about a place that's wrong. How can I get it updated?
    * Link them to the `feedback` tab.
  * I submitted a place and haven't seen it added to the app yet. What should I do?
    * The user should do nothing. There's only 1 person maintaining the app, that person is busy. Also, there's a certain amount of filtering going on to only add places that truly qualify as a third place.
* Contact
  * Information about how to get in contact with the author. A link to the feedback tab is best (don't list your email.). Here you can list your website and LinkedIn though, approved channels for contacting the author.

#### Suggest a Place

If "Suggest a Place" is chosen, it should take the user to a form with the following fields.

1. Your Name
2. Your Email
3. Place Name
4. Place Neighborhood
5. Comments

The "Comments" input box should have a caption asking the user to defend why they think this place is a "Third Place". They should share what they like about it, any fun facts they'd like others to know about the place, the pros/cons of the place, stuff like that. In general, they should talk about why they consider this a place worth adding to the registry.

#### Provide Feedback About the App

If "Provide Feedback About the App" is chosen, it should take the user to a form with the following inputs in order.

1. Name
2. Email
3. Message

The "Message" input field should have a caption with very friendly language asking the user to leave their comments, highlighting that this app is the passion project of a Software Engineer. It should include a hyperlink to the `/about` page if they'd like to learn more about the app and its author.

#### Provide Feedback About a Place

If "Provide Feedback About a Place" is chosen, it should take the user to a form with the following inputs in order.

1. Name
2. Email
3. A dropdown menu with all the places in the app. The user must select the place they're providing feedback about.
4. Message

Message should be an input box that tells them to talk about what they'd like to share about the specific place. It should remind them that the data for the app comes from Google Maps mostly and that some fields like `Has Cinnamon Rolls` are based on the observations of the developer in visiting those places, or on anecdotal data gathered through conversation and social media (Reddit primarily.)

## Components

Should go in the `/components` folder and be referenced on various tabs. Think of these as reusable standards for certain screens.

## Example Outscraper Reviews Response

```json
{
    "id": "2024011814483312b6",
    "status": "Success",
    "data": [
        {
            "query": "ChIJJ1k-2i6gVogRYNxihxv5ONI",
            "name": "Am\u00e9lie\u2019s French Bakery & Caf\u00e9 | Carmel Commons",
            "google_id": "0x8856a02eda3e5927:0xd238f91b8762dc60",
            "place_id": "ChIJJ1k-2i6gVogRYNxihxv5ONI",
            "location_link": "https://www.google.com/maps/place/Am%C3%A9lie%E2%80%99s+French+Bakery+%26+Caf%C3%A9+%7C+Carmel+Commons/@35.0861975,-80.85066499999999,14z/data=!4m8!1m2!2m1!1sAm%C3%A9lie%E2%80%99s+French+Bakery+%26+Caf%C3%A9+%7C+Carmel+Commons!3m4!1s0x8856a02eda3e5927:0xd238f91b8762dc60!8m2!3d35.0861975!4d-80.85066499999999",
            "reviews_link": "https://search.google.com/local/reviews?placeid=ChIJJ1k-2i6gVogRYNxihxv5ONI&authuser=0&hl=en&gl=US",
            "reviews": 1700,
            "rating": 4.5,
            "review_id": "ChdDSUhNMG9nS0VJQ0FnSUQxNWV2ZnNRRRAB",
            "review_pagination_id": "CAESBkVnSUlBUQ==",
            "author_link": "https://www.google.com/maps/contrib/111850575676831470260?hl=en-US",
            "author_title": "Rajendra Thapa",
            "author_id": "111850575676831470260",
            "author_image": "https://lh3.googleusercontent.com/a-/ALV-UjVvnr7r2g5WL5FhdmUqSOTfFTUw62zIiG5OTev0-OX-YQ=s120-c-rp-mo-ba4-br100",
            "review_text": "What a great place to stop by for a quick coffee and French bakery. The bakery is always fresh out-of-the-oven. The seating and the ambience is perfect whether it is for somebody doing stuff on their laptops or people chatting. The foods I would say are reasonably priced and offer a great selection. Highly recommended.",
            "review_img_url": "https://lh5.googleusercontent.com/p/AF1QipPqnA7guUD1BHlblnoJ81Mglf6LPZgcElEhFX--",
            "review_img_urls": "https://lh5.googleusercontent.com/p/AF1QipPqnA7guUD1BHlblnoJ81Mglf6LPZgcElEhFX--, https://lh5.googleusercontent.com/p/AF1QipP_5xV3KkQ6fJfbySJgsgAqrl_KCVhEULPdeYPE",
            "review_photo_ids": "AF1QipPqnA7guUD1BHlblnoJ81Mglf6LPZgcElEhFX--, AF1QipP_5xV3KkQ6fJfbySJgsgAqrl_KCVhEULPdeYPE",
            "owner_answer": null,
            "owner_answer_timestamp": null,
            "owner_answer_timestamp_datetime_utc": null,
            "review_link": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnSUQxNWV2ZnNRRRAB!2m1!1s0x0:0xd238f91b8762dc60!3m1!1s2@1:CIHM0ogKEICAgID15evfsQE%7CCgwIstHxrAYQsJ_UtwM%7C?hl=en-US",
            "review_rating": 5,
            "review_timestamp": 1704749234,
            "review_datetime_utc": "01/08/2024 21:27:14",
            "review_likes": 0,
            "reviews_id": -3298612830418052000,
            "reviews_per_score_1": 63,
            "reviews_per_score_2": 44,
            "reviews_per_score_3": 85,
            "reviews_per_score_4": 284,
            "reviews_per_score_5": 1224,
            "review_questions_Service": "5",
            "review_questions_Meal type": "Other",
            "review_questions_Price per person": "$1\u201310",
            "review_questions_Food": 5.0,
            "review_questions_Atmosphere": 5.0,
            "review_questions_Parking space": "Plenty of parking",
            "review_questions_Parking options": null,
            "review_questions_None": null,
            "review_questions_Recommended dishes": null,
            "review_questions": null,
            "review_questions_Recommendation for vegetarians": null,
            "review_questions_Vegetarian offerings": null,
            "review_questions_Dietary restrictions": null,
            "review_questions_Wheelchair accessibility": null,
            "review_questions_Parking": null,
            "review_questions_Kid-friendliness": null
        },
        {
            "query": "ChIJJ1k-2i6gVogRYNxihxv5ONI",
            "name": "Am\u00e9lie\u2019s French Bakery & Caf\u00e9 | Carmel Commons",
            "google_id": "0x8856a02eda3e5927:0xd238f91b8762dc60",
            "place_id": "ChIJJ1k-2i6gVogRYNxihxv5ONI",
            "location_link": "https://www.google.com/maps/place/Am%C3%A9lie%E2%80%99s+French+Bakery+%26+Caf%C3%A9+%7C+Carmel+Commons/@35.0861975,-80.85066499999999,14z/data=!4m8!1m2!2m1!1sAm%C3%A9lie%E2%80%99s+French+Bakery+%26+Caf%C3%A9+%7C+Carmel+Commons!3m4!1s0x8856a02eda3e5927:0xd238f91b8762dc60!8m2!3d35.0861975!4d-80.85066499999999",
            "reviews_link": "https://search.google.com/local/reviews?placeid=ChIJJ1k-2i6gVogRYNxihxv5ONI&authuser=0&hl=en&gl=US",
            "reviews": 1700,
            "rating": 4.5,
            "review_id": "ChdDSUhNMG9nS0VJQ0FnSURWMjdEa3BBRRAB",
            "review_pagination_id": "CAESBkVnSUlBZw==",
            "author_link": "https://www.google.com/maps/contrib/108761969727643338196?hl=en-US",
            "author_title": "Josh",
            "author_id": "108761969727643338196",
            "author_image": "https://lh3.googleusercontent.com/a-/ALV-UjW2_02BW4HJJLXKQJbI-W2q8lCdDMCT0DPSrrox1U4XCV4H=s120-c-rp-mo-ba6-br100",
            "review_text": "Great selection of sweets and pastries, I do think it\u2019s a bit pricey, bacon egg and cheese on a croissant for $13 it\u2019s totally NY prices. Overall good experience, the atmosphere it\u2019s more elderly and family oriented. The decor is unique and very intentional.",
            "review_img_url": "https://lh5.googleusercontent.com/p/AF1QipMy10x1aFXQjc3dMP-juMY9BqmHEQPfgP1RFq6X",
            "review_img_urls": "https://lh5.googleusercontent.com/p/AF1QipMy10x1aFXQjc3dMP-juMY9BqmHEQPfgP1RFq6X, https://lh5.googleusercontent.com/p/AF1QipM-xDKWwIekjCMh6K3jo_3zABLZAzwZX-FHn6_P, https://lh5.googleusercontent.com/p/AF1QipOPhLMjRaFFYyRVZPfyR8F761iQzAw5Ob4wMy_m, https://lh5.googleusercontent.com/p/AF1QipMMGmBUP_X_WoB29j3konnHsLFw7xQrGbtXl2Jd, https://lh5.googleusercontent.com/p/AF1QipMRPosUsPpMs5TL9cffajPn6V-iBJq0tFrBH2hE, https://lh5.googleusercontent.com/p/AF1QipMfbBLq1hDbwGodUVciilogpAJJux0UkngAospl, https://lh5.googleusercontent.com/p/AF1QipObYC6ojfDXZZT5M7mxO9lvB_Bn413wVdQD89V2",
            "review_photo_ids": "AF1QipMy10x1aFXQjc3dMP-juMY9BqmHEQPfgP1RFq6X, AF1QipM-xDKWwIekjCMh6K3jo_3zABLZAzwZX-FHn6_P, AF1QipOPhLMjRaFFYyRVZPfyR8F761iQzAw5Ob4wMy_m, AF1QipMMGmBUP_X_WoB29j3konnHsLFw7xQrGbtXl2Jd, AF1QipMRPosUsPpMs5TL9cffajPn6V-iBJq0tFrBH2hE, AF1QipMfbBLq1hDbwGodUVciilogpAJJux0UkngAospl, AF1QipObYC6ojfDXZZT5M7mxO9lvB_Bn413wVdQD89V2",
            "owner_answer": null,
            "owner_answer_timestamp": null,
            "owner_answer_timestamp_datetime_utc": null,
            "review_link": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnSURWMjdEa3BBRRAB!2m1!1s0x0:0xd238f91b8762dc60!3m1!1s2@1:CIHM0ogKEICAgIDV27DkpAE%7CCgwIs6n3qwYQgN2YuwI%7C?hl=en-US",
            "review_rating": 3,
            "review_timestamp": 1702745267,
            "review_datetime_utc": "12/16/2023 16:47:47",
            "review_likes": 0,
            "reviews_id": -3298612830418052000,
            "reviews_per_score_1": 63,
            "reviews_per_score_2": 44,
            "reviews_per_score_3": 85,
            "reviews_per_score_4": 284,
            "reviews_per_score_5": 1224,
            "review_questions_Service": "3",
            "review_questions_Meal type": "Brunch",
            "review_questions_Price per person": "$20\u201330",
            "review_questions_Food": 3.0,
            "review_questions_Atmosphere": 3.0,
            "review_questions_Parking space": null,
            "review_questions_Parking options": null,
            "review_questions_None": null,
            "review_questions_Recommended dishes": null,
            "review_questions": null,
            "review_questions_Recommendation for vegetarians": null,
            "review_questions_Vegetarian offerings": null,
            "review_questions_Dietary restrictions": null,
            "review_questions_Wheelchair accessibility": null,
            "review_questions_Parking": null,
            "review_questions_Kid-friendliness": null
        }
    ]
}
```