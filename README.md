# Visualizing Ludwig's 31-Day Subathon

## MIT 6.859 Spring 2021

#### Team Members
Sabina Chen

#### Project Description
On March 14, 2021, Twitch streamer, [Ludwig Ahgren](https://www.twitch.tv/ludwig), started a subathon for which every new subscriber would add 10 seconds to the length of his stream. Due to overwhelming support from the Twitch community, the stream ended up lasting 31 days. During this time, Ludwig gained over 970k new followers and 250k new subscribers, enabling him to ultimately surpass [Ninja's record](https://twitchtracker.com/subscribers/all-time) for "Most Concurrent Twitch Subscribers" by hitting 280k+ subscribers at peak. 

During the stream, users on Reddit/Twitch tracked the subathon in a public spreadsheet, which produced some preliminary static graphs. My goal was to take this dataset, and turn it into a more interactive and exploratory visualization. The intended audience for this visualization is for Ludwig fans and for general viewers interested in learning more about Ludwig’s subathon. I created an interactive visualization for users interested in learning more about activity statistics and stream highlights during this record-breaking event. 

#### Deploy URL
https://6859-sp21.github.io/a4-ludwig-subathon/

-----------------------------

## Dev Notes [For Sabina's Reference Only]

#### Overview

THE SUBATHON HAS OFFICIALLY ENDED. CONGRATS LUDWIG!!!!!! 
- It's been a wild ride! To fellow Ludwig fans out there, I hope you find this visualization interesting. I had a blast making it :) 

Subathon Dates:
- START: March 14, 2021 @ 2:00pm PST (5:00pm EST)
- END: April 13, 2021 @ 8:59pm PST (11:59pm EST)

Current Data Extracted from baddog86's spreadsheet (manually updated):
- START: 0 hr
- END: 694.5 hr (missing 681-693.5 hr due to deleted VOD)

Current Data Extracted from SullyGnome (manually updated):
- viewers: 2021-03-11 16:00 EST ... 2021-04-14 00:00 EST
- followers: 2021-03-09 19:00 EST ... 2021-04-14 18:00 EST

Dataset Credits To:
- [baddog86, smartax1111, itzdanbarz, and ogsheeper](https://docs.google.com/spreadsheets/d/e/2PACX-1vThvKnVHDeF0iGgL7Bkx6wz_SE2hh2RvxzqEHyqtZvR3H0DXuOwwh5MdwnbzMYvluul97ld364VANqm/pubhtml#)
	* timeLeft.json (scraped from spreadsheet)
	* ludwigModcast.json (hardcoded based on spreadsheet)
- [SullyGnome](https://sullygnome.com/channel/ludwig)
	* viewers.json (directly download)
	* followers.json (directly downloaded)
	* gameImages.json (manually checked loaded image urls)
- Random Twitch/YouTube Clips
	* [highlights.json](https://docs.google.com/spreadsheets/d/e/2PACX-1vQLW71Ytd45ilfzRnforyZJthghXUickXMZdhY_phG8rAEO7eYqOCTj2u5DlxN0x5s1xP-ondSwf3RD/pubhtml#) (manually collected the video urls)

#### To Preprocess Data:
```
cd utils/
node scrapeSubathonSheet.js
node scrapeHighlightsSheet.js
```
#### To Run Locally:

- Use Brackets IDE for test server 
- Open ```index.html``` via 'Live Preview'

#### To Deploy:

- ```index.html``` should be in the root folder.
- ```parentDomain``` in ```scripts/index.js``` MUST match the domain above (ie. ```6859-sp21.github.io``` on deploy, or ```127.0.0.1``` when testing via Brackets)
- Since the website is hosted on Github Pages, just push to the github repo to deploy updates. 

#### To Pull Upstream Fork:
```
git remote add upstream https://github.com/6859-sp21/a4-ludwig-subathon.git
git fetch upstream
git rebase upstream/main
git push --force
```

#### Tools Used:
- [JSON Formatter](https://jsonformatter.curiousconcept.com/)

#### Notes to Self:
- all dates are converted to EST
- name equivalents due to hacky legacy code: highlights = events; ludwigModcast = sleepAwake
- before scraping, make sure BOTH spreadsheets' COLUMN DIVS are still correct bc it's HARDCODED in the script, and constantly changing in real-time since the subathon is ongoing
	* for baddog's spreadsheet, specifically use the "Hours Streamed" and "Subathon Timer" column from the "Calculations" tab
- for baddog's spreadsheet:
	* to calculate datetime, add # hr of time streamed to 5pm EST start
	* hours were manually inserted (via code) from hour 719-727 (1-9pm PST inclusive) with subathon timer linearly decreasing in time from 8-0 hours (inclusive) because at that point the subathon timer was just a countdown since all subs went directly to charity, instead of adding to the timer.
- for sullygnome
	* make sure to convert to EST on the bottom left dropdown of the website before downloading .json

-----------------------------

## Writeup

#### Motivation
I was inspired to make this visualization from  [u/baddog86’s “lud subathon” spreadsheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vThvKnVHDeF0iGgL7Bkx6wz_SE2hh2RvxzqEHyqtZvR3H0DXuOwwh5MdwnbzMYvluul97ld364VANqm/pubhtml#), which was posted on Reddit near the beginning of Ludwig’s Subathon. When initially brainstorming ideas, what peaked my curiosity the most was the seemingly random subscription spikes scattered throughout the subathon. As a casual viewer, I am not watching Ludwig’s subathon 24/7, and although I might catch the reasons for some of the sub spikes live, it would be great if there was a consolidated place to view this information without scouring the web or watching hours of past videos. 

Since the subathon timer corresponds directly with the number of new subscribers to the channel (1 new subscriber = +10 seconds to the subathon timer), I was really curious to understand the reasons behind the sub spikes. Were the sub spikes really because the viewers all just simultaneously decided to start donating at the same time? Was it because Ludwig said something to convince viewers to start subscribing? Was it due to another content creator’s influence? Did viewers just feel more generous during specific times of the day? Maybe this publicity stunt lead to more exposure, thereby increasing viewership, which in turn convinced more viewers to subscribe? ...Or could there something greater going on influencing the trends? My primary motivation in building this visualization was to create a medium for both me and other interested viewers to explore these questions. 

#### Dataset
I used a mixture of available and hand-aggregated datasets. I used u/baddog86’s “lud subathon” spreadsheet to track the subathon timer and overall stream time. To track viewership and follower counts, I used data from [SullyGnome](https://sullygnome.com/channel/ludwig/30). For event highlights, I manually selected interesting clips that I felt would help explain some of the sub spikes. 

One difficulty in aggregating the necessary datasets was that the Twitch API only allows users to retrieve real-time data (it does not allow users to retrieve past data). Therefore, since I only realized I wanted to do this project 12-days into the subathon, I had to rely on other websites to get past datasets for me. However, most websites only saved or displayed data at daily, weekly, or monthly time intervals. Because I wanted to visualize the data at 30-minute increments, since the subathon was only 1-month long, I was limited by the amount of data I had available. Ultimately I was able to retrieve viewership and follower data (from SullyGnome), but was unable to find subscriber data for the time intervals I needed. 

#### Visualization Features and Design Decisions

The website includes 3 line graphs (subathon timer, viewers, followers) stacked on the left column of the page. Because the x-axis (hours streamed) was all the same, I chose to stack them vertically and include a vertical line on hover that would overlay a tooltip with the respective y-axis values of each graph, so that users are able to more easily compare values at specific moments in time across each of the different dataset. I also included the x-axis datetime, day, and stream time value at the top, that scrolls with the cursor on hover.

Users can zoom into the line graphs via brushing. By zooming into any one line graph, the other two line graphs will automatically update to reflect the new timeframe. When the x-axis is zoomed/remapped, the y-axis range is also remapped so that the new y-axis range is maxed at  the new y-axis max of that range. This was done so that users can more easily compare values in ranges where the y-axis values were smaller when they zoom in. A “Reset Zoom” button was included to allow users to undo their zoom, and to reset the graphs. This action can also be done by double-clicking on the line graphs, but I added the “Reset Zoom” button to be more explicit since my user tests showed that users were confused on how to undo a zoom.

Users also have the ability to choose between different display overlays on the line graphs. The different options include “By Activity”, “By Ludwig/Modcast”, “By Time”, “By Events”, and “None”. These options can be toggled via radio buttons on the top of the page. 

- “By Activity” shows the type of activity or game that the streamer was participating in during the length of the stream. Stream activity is overlaid as an area chart on the graphs line graphs, with different colors corresponding to a different type of activity. The corresponding activity name is shown in a legend to the right of the line graphs. The ratio of time spent on each activity is also shown in a treemap on the bottom right of the page. I decided to represent this as a treemap (as opposed to a pie chart), because it is easier for people to compare rectangle area ratios vs. angles on an area chart. Because colors and activity type do not immediately intuitively connect, I also made it so that the respective area chart and legend item is highlighted whenever the user hovers over a specific rectangle on the treemap (ie. hovering over the “League of Legends” section of the treemap will highlight only the sections of the area graphs that involve League of Legends). The same effect can be applied when the user hovers over a legend item. The treemap ratios will update depending on the range of values selected in the line graphs/area charts. The title and percentage will be hidden for the treemap sections that are too small. Users can hover over these smaller rectangles and look at the legend title highlighted to figure out the name of the activity. This was done to prevent the texts from obstructing the treemaps. Additionally, colors were chosen to be as different as possible to prevent activity confusion. 

- “By Ludwig/Modcast” shows when the stream was actively being led by Ludwig, the moderators, or by someone else. “Modcast” generally occurs when Ludwig is asleep and is led by his channel’s moderators. “Away” occurs when Ludwig is away (ie. on business/travel), during which time Slime (his roommate) usually takes over the stream. “Ludwig” occurs when Ludwig is present and actively in control/leading the stream. I was curious to see if viewership, follower, and subscriber counts vary depending on whether Ludwig was awake or asleep. This question is answered/explored in the “Interesting Takeaways” section below. The ratio of Ludwig/Modcast time is also shown as a treemap in the bottom right corner, and has the same type of interaction features specified in the “By Activity” section above. The color of "Ludwig" is light blue (representing day/awake), "Modcast" is dark blue (representing night/sleep), and "Away" is dark peach to set it apart from the blues, since Away occurs less frequently, and to differentiate it from the normal sleep/awake cycle.  

- “By Time” colors the line graphs depending on the hour (in EST). The color overlay of the area chart is different for each hour in time. The reason I chose to visualize this was because I had a hunch that viewership numbers varied depending on time of day. Looking at the general viewership trends, we can see that the graph oscillates at regular intervals similar to a cosine graph. I was curious to see if this was due to viewers just being more active during specific times of the day. The novelty of this visualization is the ability to hover over the different times and see where the length of the associated bar charts aligned with the line graphs. This was initially done by hovering over just the legend. But after some user testing, I noticed that this functionality wasn’t intuitive for users to find. I decided to help users find the hover functionality by including a pie chart divided into 24 equal sections. Hovering over the respective times in the pie chart will highlight the respective area sections and legend name. When zoomed in, only the time ranges applicable will be hoverable by the user. Colors were chosen to correspond with the respect time ranges. Times in the evening/night are darker bluer tones, while times at dawn/morning/afternoon are lighter yellow/red tones. 

- “By Events” shows the original line graphs with event nodes overlaid. By hovering over the event nodes, a tooltip with the respective event video embed will appear on the right column. The “By Events” tab was the idea that started it all / my original inspiration for this visualization project, because the goal was to help casual viewers figure out what were the causes of certain subathon spikes. For example, we can see that the subathon timer spiking from 69 hours to 72 hours on March 19th was due to Dream donating 1k gifted subs after losing a chess match to Ludwig. I also added a form for users to contribute more event highlights video links to the visualization, to hopefully get a more completed dataset. The video was embedded directly into the webpage so that users don’t have to navigate to external links to view the event. The respective video title is shown in the graph and the dot is darkened to correspond with the video shown in the embed. 

- “By None” shows the raw data without any specific color or event overlays. Users can use this section to just explore the raw subathon timer, viewership, and follower count data directly without any extra (and potentially distracting) features.

Another consideration when designing the website was whether the visualization makes sense to people not familiar with Twitch or Ludwig’s subathon. After some user tests, I also noticed that some jargon that was familiar to me (ie. “followers”, “subs”, “subathon”, “streamer”, etc), might not be common knowledge to people not familiar with the Twitch or live streaming community. Therefore, to help provide some context to the visualization, I added a [?]  tooltip that can explain new vocabulary, which pops up on hover, as well as an overall info section on the top right corner of the page that provides the context of the subathon as a whole to new users.  

#### Development Process 

On the data collection side, what made this project so interesting was that the event that I was developing the visualization for was happening in real-time. I was originally considering another project idea for A4, but spontaneously decided to pivot into this project when the subathon was already on its 12th day. This meant that the data I was using was changing by the day, so I had to constantly update or find new data collection methods to get the most up-to-date data. Data collecting, cleaning, and reformatting actually took up a large bulk of time. 

One challenge was that Twitch streamer statistics is already commonly visualized, so one mental block I had at the beginning was trying to figure out how exactly to make my visualization “unique”. Visualization websites such as [Twitch Tracker](https://twitchtracker.com/) or [SullyGnome](https://sullygnome.com/) do a lot of the data collection themselves, and have already developed pretty intensive interactive visualization graphs. So it actually took me days of brainstorming, data exploration, visualization exploration, and mock-ups to figure out how exactly I wanted to make my visualization stand out. 

I felt that line graphs would be “too boring”, and I was focused on trying to figure out what interaction techniques would be most “cool”. Ultimately the advice that helped me the most was to “visualize something that is interesting to YOU”, as opposed to trying to force fit the data into a specific graph type just to make it “unique”. This was why the final visualization encompassed so many different visualization options; it was created as a medium to explore the many questions I had regarding the subathon. Ultimately, the final visualization was designed so that viewers can explore and interact with the data, and then hopefully come to their own conclusions.

I worked on this project individually over the span of two weeks. This was roughly 100 people hours, which includes both brainstorming, data collection, and coding time. The first week was spent learning D3.js, web scraping, brainstorming visualization techniques, and contacting users for permission to use certain datasets. The second week was spent fixing bugs, conducting user tests, and adding more interactive features. The part that took the most amount of time was initially learning how to use D3, web scrape, and format the data in a way that could be accepted by the D3 library. 

#### Future Work

There are still some bugs I would look to fix. In particular the area charts currently obscure the tooltip hover, making it difficult to read the y-axis values when there is an area overlay over the line graphs. I spent a lot of time trying to debug this issue, but due to the complex interactions between the many features at once (ie. brush, zoom, line graph, area chart, etc), I couldn’t figure out how to fix this in time for the final submission. If I were to improve on this project, this would be the first bug I fix.

Given more time, I’d also want to add another line graph for subscriber count. And then also create a toggle between followers/subscribers GAINED vs followers/subscribers TOTAL. Initially I decided not to visualize subscriber count because (1) I couldn’t find the data I needed, (2) because I felt that it was just a direct correlation with the subathon timer (aka 1 sub = +10 sec to timer), and (3) I couldn’t think of a way to position the extra graphs cleanly in the webpage without being too overwhelming to the user. However, near the end this did not turn out to be the case due to various events that occurred during the stream. So it would be cool to see how the subscriber/subathon timer differs. Also given that the entire goal of the subathon was to try to beat Ninja’s record of 270k subs, it would only make sense to show a graph that displays the total subscriber trend upwards until Ludwig beats the record on the last day. For future work, I’d brainstorm this possibility a bit more to see if there was a way to get the data I need, and how to visualize these graphs effectively. 

#### [For Fun] Some Interesting Observations by Sabina

Viewers are most active around 5-6pm EST, and least active around 6am EST. I thought the viewership count would vary depending on when Ludwig was awake/asleep, but it actually correlates more strongly with time of day. 

When the subathon timer hit its peak at 72 hours on the timer on Day 6, I thought that it was due to a general increase in new viewership. Looking at the graphs, we can see that while the viewership DOES peak a bit from 50k max to 70k at the time of the subathon spike (aka when it peaked from 27 hours to 60 hours), the viewership count doesn’t actually spike as much as I predicted. This makes me believe that the increase in subs was due to gifted subs from original viewers, as opposed to new viewers individually subscribing themselves. 

Average viewership increased the most when the subathon timer was at less than 1 hour (between Day 17 and Day 23), most likely because viewers were interested in seeing the subathon end. This is interesting because I would assume that more viewership = more subscriptions, however this was not shown to be this case during these days. In fact, viewership counts was at its highest when the subathon timer was at its lowest. 

The number of new followers increases and peaks on Day 7. This is interesting because this corresponds to a day AFTER the subathon timer hits its peak at 72 hours in. Meaning that news about the subathon most likely started getting popularized during this time since the subathon timer hitting 72 hours was such a surprising event. The new publicity encouraged more people to become interested in the event and begin following Ludwig’s channel. (This was exactly what happened to me actually; I only started following the subathon around Day 7 after learning about the 72 hour peak as well). 






