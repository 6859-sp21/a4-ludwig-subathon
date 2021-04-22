// video embed settings
var parentDomain = "6859-sp21.github.io" // deploy (class): 6859-sp21.github.io
                                         // deploy (personal): sabinach.github.io
                                         // test: 127.0.0.1
console.log("parentDomain: ", parentDomain);

/* ---------------------- */

// starting mode
var currentMode = "byActivity"

// hover opacity (for area graphs)
const lowOpacity = 0.1
const highOpacity = 1

/* ---------------------- */
// helper utils (todo - currently not used)

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

const removeSpace = (str) => str.replace(/\s+/g, '')
const removePunc = (str) => str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
const cleanString = (str) => removePunc(removeSpace(str))


/* ---------------------- */

// set canvas dimensions
var svg_width = 850;
var svg_height = 750;

// set the dimensions and margins
var margin_timeLeft = { top: 60, right: 160, bottom: 450, left: 60 };
var height_timeLeft = svg_height - margin_timeLeft.top - margin_timeLeft.bottom;

var margin_viewers = { top: 320, right: 160, bottom: 275, left: 60 };
var height_viewers = svg_height - margin_viewers.top - margin_viewers.bottom;

var margin_subFollows = { top: 530, right: 160, bottom: 70, left: 60 };
var height_subFollows = svg_height - margin_subFollows.top - margin_subFollows.bottom;

var margin_text = 20; //global
var width = svg_width - margin_timeLeft.left - margin_timeLeft.right; // global
  
// append the svg object to the body of the page
var svg = d3.select("#line-viz")
  .append("svg")
  .attr("width", width + margin_timeLeft.left + margin_timeLeft.right)
  .attr("height", height_timeLeft + margin_timeLeft.top + margin_timeLeft.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin_timeLeft.left + "," + margin_timeLeft.top + ")");

/* ---------------------- */

// set the dimensions and margins of the graph
var margin_treemap = {top: 0, right: 0, bottom: 0, left: 10},
  width_treemap = 410 - margin_treemap.left - margin_treemap.right,
  height_treemap = 380 - margin_treemap.top - margin_treemap.bottom;

// append the svg_treemap object to the body of the page
var svg_treemap = d3.select("#treemap-viz")
  .append("svg")
    .attr("width", width_treemap + margin_treemap.left + margin_treemap.right)
    .attr("height", height_treemap + margin_treemap.top + margin_treemap.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin_treemap.left + "," + margin_treemap.top + ")");

/* ---------------------- */

// set the dimensions and margins of the graph
var margin_piechart = {top: 0, right: 0, bottom: 0, left: 10},
  width_piechart = 400 - margin_piechart.left - margin_piechart.right,
  height_piechart = 400 - margin_piechart.top - margin_piechart.bottom;

var radius_piechart = Math.min(width_piechart, height_piechart) / 2

// append the svg_treemap object to the body of the page
var svg_piechart = d3.select("#piechart-viz")
  .append("svg")
    .attr("width", width_piechart + margin_piechart.left + margin_piechart.right)
    .attr("height", height_piechart + margin_piechart.top + margin_piechart.bottom)
  .append("g")
    .attr("transform",
          "translate(" + width_piechart/2 + "," + height_piechart/2 + ")")

/* ---------------------- */
// utils

// string to d3 datetime conversion function
var parseDatetime = d3.timeParse("%Y-%m-%d %H:%M");

// The data recorded began at 2pm PST on March 14th, the time Ludwig intended to start the subathon.
var subathonStartDate = parseDatetime("2021-03-14 17:00"); // converted to EST (5pm EST start)
var subathonEndDate = parseDatetime("2021-04-14 00:00"); // converted to EST (12am EST end)

// calculate datetime from timeStreamed hours
var hoursToDatetime = hours => d3.timeMinute.offset(subathonStartDate, hours*60)

// calculate hours from subathon start 
var datetimeToHours = d3Datetime => d3.timeMinute.count(subathonStartDate, d3Datetime)/60

// convert hr:min:sec to hours
var parseTimeLeft = timeLeft => parseInt(timeLeft.split(":")[0]) + parseInt(timeLeft.split(":")[1])/60;

// convert d3 datetime to human-friendly version
var formatDatetime = d3.timeFormat("%B %d, %Y %H:%M %p")

var formatTime = d3.timeFormat("%B %d, %Y");

console.log("subathonStartDate: ", subathonStartDate) 
console.log("subathonEndDate: ", subathonEndDate) 

var bisectHour = d3.bisector(function(d) { return d.timeStreamed; }).left;


/* ------------------------------------------------------------------- */
/* ------------------------------------------------------------------- */


// create viz with imported data
function createViz(error, ...args) {
  
  // handle error
  if (error) throw error;

  // save json objects
  const timeLeftJson = args[0];
  const viewersJson = args[1];
  const followersJson = args[2];
  const highlightsJson = args[3];
  const gameImagesJson = args[4];
  const ludwigModcastJson = args[5];

  console.log("gameImagesJson: ", gameImagesJson)

  /* --------------------------------------------- */
  // TIME LEFT / SUBS GAINED

  // reformat xy data (timeLeftJson)
  const timeStreamed_hours = [...[...timeLeftJson.timeStreamed, ...timeLeftJson.timeStreamed_2].sort((a,b) => a-b), ...[ ...Array(17).keys() ].map( i => 719 + i*0.5)] // 719-727 manually added
  const timeLeft_hours = [...timeLeftJson.timeLeft.map(d => parseTimeLeft(d)), ...[ ...Array(17).keys() ].map( i => i*0.5).sort().reverse()] // 8-0 manually added
  const subathonTimer_manual = []

  console.log("timeStreamed_hours: ", timeStreamed_hours)
  console.log("timeLeft_hours: ", timeLeft_hours)
  console.log("subathonTimer_manual: ", subathonTimer_manual)

  // handle error: mismatch xy length
  if (timeStreamed_hours.length !== timeLeft_hours.length) throw error;

  const timeLeftJson_zip = timeStreamed_hours.map((timeStreamed, index) => {
    return {
      timeStreamed: timeStreamed, 
      timeLeft: timeLeft_hours[index],
      subsGained: timeLeftJson.subsGained[index],
      subathonTimer: index<=1411 ? timeLeftJson.timeLeft[index] : Math.floor(timeLeft_hours[index]) + (timeLeft_hours[index] % 1 != 0 ? ":30" : ":00" ) + ":00"
    }
  });

  console.log("timeLeftJson_zip: ", timeLeftJson_zip)

  /* --------------------------------------------- */
  // LUDWIG/MODCAST

  const ludwigModcastJson_zip = []
  var currentSleepAwake = ludwigModcastJson.sleepAwake[0]
  timeLeftJson_zip.forEach((d, i) => {
    // if index is found
    const foundIndex = ludwigModcastJson.timeStreamed.indexOf(d.timeStreamed);
    if(foundIndex>=0){
      currentSleepAwake = ludwigModcastJson.sleepAwake[foundIndex]
    }
    ludwigModcastJson_zip.push({
      timeStreamed:d.timeStreamed,
      datetime:hoursToDatetime(d.timeStreamed),
      sleepAwake:currentSleepAwake
    })
  })

  /*
  const ludwigModcastJson_zip = ludwigModcastJson.timeStreamed.map((timeStreamed, i) => {
    return {
      timeStreamed:timeStreamed,
      datetime:hoursToDatetime(timeStreamed),
      sleepAwake:ludwigModcastJson.sleepAwake[i]
    }
  });
  */

  console.log("ludwigModcastJson: ", ludwigModcastJson)
  console.log("ludwigModcastJson_zip: ", ludwigModcastJson_zip)


  /* --------------------------------------------- */
  // VIEWERS

  const datetime_viewers = viewersJson.data.labels;
  const gamePlayed_viewers = viewersJson.data.datasets;

  console.log("datetime_viewers: ", datetime_viewers)
  console.log("gamePlayed_viewers: ", gamePlayed_viewers)

  // handle error: mismatch xy length
  gamePlayed_viewers.forEach(gamePlayed => {
    if(datetime_viewers.length!==gamePlayed.data.length) throw error;
  })

  // here's an extremely inefficient for-loop... will optimize later (maybe)
  var viewers_zip = []
  datetime_viewers.forEach((datetime, i) => {
    const parsedDatetime = parseDatetime(datetime);
    if(parsedDatetime >= subathonStartDate && parsedDatetime <= subathonEndDate){
      viewers_zip.push({
        timeStreamed: datetimeToHours(parsedDatetime),
        datetime: parsedDatetime,
        game: null,
        numViewers: null
      })
      for (var j = 0; j < gamePlayed_viewers.length; j++) {
        if(gamePlayed_viewers[j].data[i]!==null){
          viewers_zip[viewers_zip.length-1].game = gamePlayed_viewers[j].label;
          viewers_zip[viewers_zip.length-1].numViewers = gamePlayed_viewers[j].data[i];
          break;
        }
      }
    }
  }) 

  const numViewers = viewers_zip.map(d => {return d.numViewers})
  console.log("numViewers: ", numViewers)

  console.log("viewers_zip: ", viewers_zip)

  /* --------------------------------------------- */
  // TREEMAP

  // Create game output json based on start/end dates
  function generateGamePlayedCount(viewers_zip_withinBounds){
    var gamePlayed_count = [
      {"game":"Origin","count": 0,"parent":""}
    ]

    // filter by date and sum the # of games occurred within count
    viewers_zip_withinBounds.forEach((viewers) => {
      var foundIndex = gamePlayed_count.findIndex(gamePlayed => gamePlayed.game === viewers.game);
      if (foundIndex>=0){
        gamePlayed_count[foundIndex].count += 1
      }else{
        gamePlayed_count.push({"game":viewers.game,"count":1,"parent":"Origin"});
      }
    })

    gamePlayed_count = gamePlayed_count.filter(d => d.game!==null)
    console.log("gamePlayed_count (before): ", gamePlayed_count)

    /*
    // make sure no elements is less than 1% of total
    const gamePlayed_count_filtered = gamePlayed_count
                                        .filter(d => (d.count/gamePlayed_count.reduce((accum,item) => accum + parseInt(item.count), 0)*100).toFixed(1) > 0.5 || d.game==="Origin")
                                        .filter(d => d.game!==null)

    const filteredGames = gamePlayed_count_filtered.map(filteredItem => filteredItem.game)
    const otherCount = gamePlayed_count
                        .filter(item => !filteredGames.includes(item.game) && item.game!==null)
                        .reduce((accum, item) => accum + parseInt(item.count), 0)
    gamePlayed_count_filtered.push({"game": "Other", "count": otherCount, "parent": "Origin"})

    console.log("gamePlayed_count_filtered (after): ", gamePlayed_count_filtered)

    return gamePlayed_count_filtered
    */
    return gamePlayed_count
  }

  // Create sleepawake output json based on start/end dates
  function generateSleepAwakeCount(ludwigModcastJson_zip_withinBounds, endHour){
    var sleepAwake_count = [
      {"sleepAwake":"Origin","count": 0,"parent":""}
    ]

    ludwigModcastJson_zip_withinBounds.forEach((d, i) => {
      const foundIndex = sleepAwake_count.findIndex(countObj => countObj.sleepAwake === d.sleepAwake)
      var addCount;
      if(i!==ludwigModcastJson_zip_withinBounds.length-1){
        addCount = ludwigModcastJson_zip_withinBounds[i+1].timeStreamed - d.timeStreamed
      }else{ //last item
        addCount = endHour - d.timeStreamed
      }
      if (foundIndex>=0){
        sleepAwake_count[foundIndex].count += addCount
      }else{
        sleepAwake_count.push({"sleepAwake":d.sleepAwake,"count":addCount,"parent":"Origin"});
      }
    })

    return sleepAwake_count
  }

  /** -------- **/
  // treemap hierarchy

  function redraw(start, end, type){
    /* ------ */
    // Activity

    // filter by date 
    var viewers_zip_withinBounds = viewers_zip.filter((viewers) => 
      (type==="datetime" && viewers.datetime >= start && viewers.datetime <= end) || 
        (type==="hour" && viewers.timeStreamed >= start && viewers.timeStreamed <= end))
    console.log("viewers_zip_withinBounds: ", viewers_zip_withinBounds)

    // account for when no data is available (get the closest one that happened earlier)
    if(viewers_zip_withinBounds.length===0){
      var startHour;
      if(type==="datetime"){
        startHour = datetimeToHours(start)
      }
      else if (type==="hour"){
        startHour = start
      }
      // no match found, insert the closest occurred value
      for (var i=0; i<viewers_zip.length; i++){
        if(viewers_zip[i].timeStreamed>startHour){
          if(i===0){
            viewers_zip_withinBounds = [viewers_zip[0]]
          }else{
            viewers_zip_withinBounds = [viewers_zip[i-1]]
          }
          break;
        }
        if(i===viewers_zip.length-1){
          viewers_zip_withinBounds = [viewers_zip[i]]
        }
      }
      console.log("viewers_zip_withinBounds (bisected): ",viewers_zip_withinBounds)
    }

    // get new gamePlayed count
    const gamePlayed_count = generateGamePlayedCount(viewers_zip_withinBounds)
    console.log("gamePlayed_count: ", gamePlayed_count)

    redrawTreemapActivity(gamePlayed_count)
    redrawLegendActivity(viewers_zip_withinBounds, gamePlayed_count)

    /* ------ */
    // SleepAwake

    // filter by date
    var ludwigModcastJson_zip_withinBounds = ludwigModcastJson_zip.filter((item) => 
      (type==="datetime" && item.datetime >= start && item.datetime <= end) || 
        (type==="hour" && item.timeStreamed >= start && item.timeStreamed <= end))
    console.log("ludwigModcastJson_zip_withinBounds (bisected): ",ludwigModcastJson_zip_withinBounds)

    // account for when no data is available (get the closest one that happened earlier)
    if(ludwigModcastJson_zip_withinBounds.length===0){
      var startHour;
      if(type==="datetime"){
        startHour = datetimeToHours(start)
      }
      else if (type==="hour"){
        startHour = start
      }
      // no match found, insert the closest occurred value
      for (var i=0; i<ludwigModcastJson_zip.length; i++){
        if(ludwigModcastJson_zip[i].timeStreamed>startHour){
          if(i===0){
            ludwigModcastJson_zip_withinBounds = [ludwigModcastJson_zip[0]]
          }else{
            ludwigModcastJson_zip_withinBounds = [ludwigModcastJson_zip[i-1]]
          }
          break;
        }
        if(i===ludwigModcastJson_zip.length-1){
          ludwigModcastJson_zip_withinBounds = [ludwigModcastJson_zip[i]]
        }
      }
      console.log("ludwigModcastJson_zip_withinBounds (bisected): ",ludwigModcastJson_zip_withinBounds)
    }

    // get new sleepAwake count
    const sleepAwake_count = generateSleepAwakeCount(ludwigModcastJson_zip_withinBounds, type==="hour" ? end : datetimeToHours(end))
    console.log("sleepAwake_count: ", sleepAwake_count)

    // redraw treemap here
    redrawTreemapSleepAwake(sleepAwake_count)
    redrawLegendSleepAwake(ludwigModcastJson_zip_withinBounds)

    /* ------ */
    // TimeHour

    redrawLegendTimeHour(viewers_zip_withinBounds)

  }

  // delete and redraw the treemap
  function redrawTreemapActivity(gamePlayed_count){

    // stratify the data: reformatting for d3.js
    var root = d3.stratify()
      .id(function(d) { return d.game; })   // Name of the entity (column name is name in csv)
      .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
      (gamePlayed_count);
    
    root
      .sum(function(d) { return +d.count })   // Compute the numeric value for each entity
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

    // Then d3.treemap computes the position of each element of the hierarchy
    d3.treemap()
      .size([width_treemap, height_treemap])
      .padding(0.1)
      (root)

    // clear previous treemap
    svg_treemap.selectAll(".rect-activity").remove();
    svg_treemap.selectAll(".title-activity").remove();
    svg_treemap.selectAll(".percent-activity").remove();

    // hide other treemaps
    svg_treemap.selectAll(".rect-sleepAwake").style("display", currentMode==="byLudwigModcast" ? null : "none");
    svg_treemap.selectAll(".title-sleepAwake").style("display", currentMode==="byLudwigModcast" ? null : "none");
    svg_treemap.selectAll(".percent-sleepAwake").style("display", currentMode==="byLudwigModcast" ? null : "none");

    /** -------- **/
    // leaves

    console.log("activity root.leaves(): ", root.leaves())

    /** -------- **/
    // rect

    // create rectangle object
    const rects = svg_treemap.selectAll(".rect-activity").data(root.leaves())

    //remove rectangle
    rects
      .exit().remove();

    // add rectangle
    rects.enter()
      .append("rect")
        .attr("class", d => "rect-activity" + (d.id ? " treemapRect-" + cleanString(d.id) : ""))
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .style("stroke", "black")
        .style("fill", d => d.id ? colorDict[cleanString(d.id)] : "#9cbdd9")
        .style("display", currentMode==="byActivity" ? null : "none")
        .on("mouseover", mouseover_treemap_allActivity)
        .on("mouseleave", mouseleave_allActivity)

    /** -------- **/
    // title

    // create title object
    const title = svg_treemap.selectAll(".title-activity").data(root.leaves())

    //remove title
    title
      .exit().remove()

    // add title
    title.enter().append("text")
      .attr("class", d => "title-activity" + (d.id ? " treemapTitle-" + cleanString(d.id) : ""))
      .attr("transform", d => `translate(${d.x0}, ${d.y0})`)
      .attr("dx", 5)  // +right
      .attr("dy", 13) // +lower
      .html(d => d.x1-d.x0<50 || d.y1-d.y0<50 ? null : `<tspan style='font-weight: 500'>${d.data.game}</tspan>`)
      .style("font-size", "8px")
      .style("fill", "black")
      .style("display", currentMode==="byActivity" ? null : "none")
      .on("mouseover", mouseover_treemap_allActivity)
      .on("mouseleave", mouseleave_allActivity)

    /** -------- **/
    // percent

    // create percent object
    const percent = svg_treemap.selectAll(".percent-activity").data(root.leaves())

    //remove percent
    percent
      .exit().remove()

    // add percent
    percent.enter().append("text")
      .attr("class", d => "percent-activity" + (d.id ? " treemapPercent-" + cleanString(d.id) : ""))
      .attr("transform", d => `translate(${d.x0}, ${d.y0})`)
      .attr("dx", 5)  // +right
      .attr("dy", 23) // +lower
      .html(d => d.x1-d.x0<50 || d.y1-d.y0<50 ? null : `<tspan style='font-weight: 500'>${(parseFloat(d.data.count)/gamePlayed_count.reduce((accum,item) => accum + parseFloat(item.count), 0)*100).toFixed(1) + "%"}</tspan>`)
      .style("font-size", "8px")
      .style("fill", "black")
      .style("display", currentMode==="byActivity" ? null : "none")
      .on("mouseover", mouseover_treemap_allActivity)
      .on("mouseleave", mouseleave_allActivity)

    /** -------- **/
    /*
    // and to add the text labels
    svg_treemap
      .selectAll("image")
      .data(root.leaves())
      .enter()
      .append("image")
        .attr("x", function(d){ return d.x0+5})   // +right
        .attr("y", function(d){ return d.y0+26})  // +lower
        .attr("width", d => 25)
        .attr("xlink:href", d => gameImagesJson[d.data.game]);
    */
  }

  // delete and redraw the treemap
  function redrawTreemapSleepAwake(sleepAwake_count){

    // stratify the data: reformatting for d3.js
    var root = d3.stratify()
      .id(function(d) { return d.sleepAwake; })   // Name of the entity (column name is name in csv)
      .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
      (sleepAwake_count);
    
    root
      .sum(function(d) { return +d.count })   // Compute the numeric value for each entity
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

    // Then d3.treemap computes the position of each element of the hierarchy
    d3.treemap()
      .size([width_treemap, height_treemap])
      .padding(0.1)
      (root)

    // clear previous treemap
    svg_treemap.selectAll(".rect-sleepAwake").remove();
    svg_treemap.selectAll(".title-sleepAwake").remove();
    svg_treemap.selectAll(".percent-sleepAwake").remove();

    // hide other treemaps
    svg_treemap.selectAll(".rect-activity").style("display", currentMode==="byActivity" ? null : "none")
    svg_treemap.selectAll(".title-activity").style("display", currentMode==="byActivity" ? null : "none")
    svg_treemap.selectAll(".percent-activity").style("display", currentMode==="byActivity" ? null : "none")

    /** -------- **/
    // leaves

    console.log("sleepAwake root.leaves(): ", root.leaves())

    /** -------- **/
    // rect

    // create rectangle object
    const rects = svg_treemap.selectAll(".rect-sleepAwake").data(root.leaves())

    //remove rectangle
    rects
      .exit().remove();

    // add rectangle
    rects.enter().append("rect")
      .attr("class", d => "rect-sleepAwake" + (d.id ? " treemapRect-" + d.id : ""))
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .style("stroke", "black")
      .style("fill", d => d.id ? colorSleepAwake[d.id] : "#9cbdd9")
      .style("display", currentMode==="byLudwigModcast" ? null : "none")
      .on("mouseover", mouseover_treemap_allSleepAwake)
      .on("mouseleave", mouseleave_allSleepAwake)

    /** -------- **/
    // title

    // create title object
    const title = svg_treemap.selectAll(".title-sleepAwake").data(root.leaves())

    //remove title
    title
      .exit().remove()

    // add title
    title.enter().append("text")
      .attr("class", d => "title-sleepAwake" + (d.id ? " treemapTitle-" + d.id : ""))
      .attr("transform", d => `translate(${d.x0}, ${d.y0})`)
      .attr("dx", 5)  // +right
      .attr("dy", 13) // +lower
      .html(d => d.x1-d.x0<50 || d.y1-d.y0<50 ? null : `<tspan style='font-weight: 500'>${sleepAwakeToLudwigModcast[d.data.sleepAwake]}</tspan>`)
      .style("font-size", "8px")
      .style("fill", d => d.data.sleepAwake==="sleep" ? "white" : "black")
      .style("display", currentMode==="byLudwigModcast" ? null : "none")
      .on("mouseover", mouseover_treemap_allSleepAwake)
      .on("mouseleave", mouseleave_allSleepAwake)

    /** -------- **/
    // percent

    // create percent object
    const percent = svg_treemap.selectAll(".percent-sleepAwake").data(root.leaves())

    //remove percent
    percent
      .exit().remove()

    // add percent
    percent.enter().append("text")
      .attr("class", d => "percent-sleepAwake" + (d.id ? " treemapPercent-" + cleanString(d.id) : ""))
      .attr("transform", d => `translate(${d.x0}, ${d.y0})`)
      .attr("dx", 5)  // +right
      .attr("dy", 23) // +lower
      .html(d => d.x1-d.x0<50 || d.y1-d.y0<50 ? null : `<tspan style='font-weight: 500'>${(parseFloat(d.data.count)/sleepAwake_count.reduce((accum,item) => accum + parseFloat(item.count), 0)*100).toFixed(1) + "%"}</tspan>`)
      .style("font-size", "8px")
      .style("fill", d => d.data.sleepAwake==="sleep" ? "white" : "black")
      .style("display", currentMode==="byLudwigModcast" ? null : "none")
      .on("mouseover", mouseover_treemap_allSleepAwake)
      .on("mouseleave", mouseleave_allSleepAwake)

    /** -------- **/
    /*
    // and to add the text labels
    svg_treemap
      .selectAll("image")
      .data(root.leaves())
      .enter()
      .append("image")
        .attr("x", function(d){ return d.x0+5})   // +right
        .attr("y", function(d){ return d.y0+26})  // +lower
        .attr("width", d => 25)
        .attr("xlink:href", d => gameImagesJson[d.data.game]);
    */
  }

  /* ------------------------------------- */
  // Activity Legend

  function redrawLegendActivity(viewers_zip_withinBounds, gamePlayed_count){
    // unique values
    const activityList_unique = []
    viewers_zip_withinBounds
      .forEach((viewer) => {
        if(viewer.game!==null && !activityList_unique.includes(cleanString(viewer.game))){
          activityList_unique.push(cleanString(viewer.game))
        }
      })
    console.log("activityList_unique: ", activityList_unique)

    // clear previous legend
    svg.selectAll(".activity_legend_colors").remove();
    svg.selectAll(".activity_legend_text").remove();

    // hide other legends
    svg.selectAll(".sleepAwake_legend_colors").style("display", currentMode==="byLudwigModcast" ? null : "none")
    svg.selectAll(".sleepAwake_legend_text").style("display", currentMode==="byLudwigModcast" ? null : "none")
    svg.selectAll(".timeHour_legend_colors").style("display", currentMode==="byTime" ? null : "none")
    svg.selectAll(".timeHour_legend_text").style("display", currentMode==="byTime" ? null : "none")

    // legend settings

    const legendDotSize = 8
    const svg_legend = svg.append("g")

    // color 

    const legendColor = svg_legend.selectAll(".activity_legend_colors").data(activityList_unique)

    legendColor
      .exit()
      .remove()

    legendColor
      .enter()
      .append("rect")
        .attr("class", d => "activity_legend_colors legendColor-" + d)
        .attr("x", 640)
        .attr("y", function(d,i){ return -30 + i*(legendDotSize+5)}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", legendDotSize)
        .attr("height", legendDotSize)
        .style("fill", function(d){ return colorDict[d]})
        .style("display", currentMode==="byActivity" ? null : "none")
        .on("mouseover", mouseover_legend_allActivity)
        .on("mouseleave", mouseleave_allActivity)

    // text

    const legendText = svg_legend.selectAll(".activity_legend_text").data(activityList_unique)

    legendText
      .exit()
      .remove()

    legendText
      .enter()
      .append("text")
        .attr("class", d => "activity_legend_text legendText-" + d)
        .attr("x", 640 + legendDotSize*1.2)
        .attr("y", function(d,i){ return -30 + i*(legendDotSize+5) + (legendDotSize/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ return colorDict[d]})
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style("display", currentMode==="byActivity" ? null : "none")
        .on("mouseover", mouseover_legend_allActivity)
        .on("mouseleave", mouseleave_allActivity)

  }

  /* ------------------------------------- */
  // SleepAwake Legend

  function redrawLegendSleepAwake(ludwigModcastJson_zip_withinBounds){

    // unique values
    const sleepAwakeList_unique = []
    ludwigModcastJson_zip_withinBounds
      .forEach((item) => {
        if(!sleepAwakeList_unique.includes(item.sleepAwake)){
          sleepAwakeList_unique.push(item.sleepAwake)
        }
      })
    console.log("sleepAwakeList_unique: ", sleepAwakeList_unique)

    // clear previous legend
    svg.selectAll(".sleepAwake_legend_colors").remove();
    svg.selectAll(".sleepAwake_legend_text").remove();

    // hide other legends
    svg.selectAll(".activity_legend_colors").style("display", currentMode==="byActivity" ? null : "none")
    svg.selectAll(".activity_legend_text").style("display", currentMode==="byActivity" ? null : "none")
    svg.selectAll(".timeHour_legend_colors").style("display", currentMode==="byTime" ? null : "none")
    svg.selectAll(".timeHour_legend_text").style("display", currentMode==="byTime" ? null : "none")

    // legend settings

    const legendDotSize = 20
    const svg_legend = svg.append("g")

    // color 

    const legendColor = svg_legend.selectAll(".sleepAwake_legend_colors").data(sleepAwakeList_unique)

    legendColor
      .exit()
      .remove()

    legendColor
      .enter()
      .append("rect")
        .attr("class", d => "sleepAwake_legend_colors legendColor-" + d)
        .attr("x", 640)
        .attr("y", function(d,i){ return -30 + i*(legendDotSize+5)}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", legendDotSize)
        .attr("height", legendDotSize)
        .style("fill", function(d){ return colorSleepAwake[d]})
        .style("display", currentMode==="byLudwigModcast" ? null : "none")
        .on("mouseover", mouseover_legend_allSleepAwake)
        .on("mouseleave", mouseleave_allSleepAwake)

    // text

    const legendText = svg_legend.selectAll(".sleepAwake_legend_text").data(sleepAwakeList_unique)

    legendText
      .exit()
      .remove()

    legendText
      .enter()
      .append("text")
        .attr("class", d => "sleepAwake_legend_text legendText-" + d)
        .attr("x", 640 + legendDotSize*1.2)
        .attr("y", function(d,i){ return -30 + i*(legendDotSize+5) + (legendDotSize/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ return colorSleepAwake[d]})
        .text(function(d){ return sleepAwakeToLudwigModcast[d]})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style("display", currentMode==="byLudwigModcast" ? null : "none")
        .on("mouseover", mouseover_legend_allSleepAwake)
        .on("mouseleave", mouseleave_allSleepAwake)
  }

  /* ------------------------------------- */
  // SleepAwake Legend

  function redrawLegendTimeHour(viewers_zip_withinBounds){

    // unique values
    const timeHourList_unique = []
    viewers_zip_withinBounds
      .forEach((viewer) => {
        const timeHour = (viewer.timeStreamed+17)%24
        if(!timeHourList_unique.includes(timeHour)){
          timeHourList_unique.push(timeHour)
        }
      })
    timeHourList_unique.sort(function(a, b){return a - b});
    console.log("timeHourList_unique: ", timeHourList_unique)

    // clear previous legend
    svg.selectAll(".timeHour_legend_colors").remove();
    svg.selectAll(".timeHour_legend_text").remove();

    // hide other legends
    svg.selectAll(".activity_legend_colors").style("display", currentMode==="byActivity" ? null : "none")
    svg.selectAll(".activity_legend_text").style("display", currentMode==="byActivity" ? null : "none")
    svg.selectAll(".sleepAwake_legend_colors").style("display", currentMode==="byLudwigModcast" ? null : "none")
    svg.selectAll(".sleepAwake_legend_text").style("display", currentMode==="byLudwigModcast" ? null : "none")

    // legend settings

    const legendDotSize = 7
    const svg_legend = svg.append("g")

    // color 

    const legendColor = svg_legend.selectAll(".timeHour_legend_colors").data(timeHourList_unique)

    legendColor
      .exit()
      .remove()

    legendColor
      .enter()
      .append("rect")
        .attr("class", d => "timeHour_legend_colors legendColor-" + d)
        .attr("x", 680)
        .attr("y", function(d,i){ return -55 + i*(legendDotSize+5)}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", legendDotSize)
        .attr("height", legendDotSize)
        .style("fill", function(d){ return colorTimeHour[d]})
        .style("display", currentMode==="byTime" ? null : "none")
        .on("mouseover", mouseover_legend_allTimeHour)
        .on("mouseleave", mouseleave_allTimeHour)

    // text

    const legendText = svg_legend.selectAll(".timeHour_legend_text").data(timeHourList_unique)

    legendText
      .exit()
      .remove()

    legendText
      .enter()
      .append("text")
        .attr("class", d => "timeHour_legend_text legendText-" + d)
        .attr("x", 680 + legendDotSize*1.2)
        .attr("y", function(d,i){ return -55 + i*(legendDotSize+5) + (legendDotSize/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ return colorTimeHour[d]})
        .text(function(d){ return timeHourToText[d]})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style("display", currentMode==="byTime" ? null : "none")
        .on("mouseover", mouseover_legend_allTimeHour)
        .on("mouseleave", mouseleave_allTimeHour)

    // update piechart (remove hoverability for unavailable times)
    piechart_keys = [...timeHourList_unique]
    svg_piechart.selectAll(".pieSlice").style("opacity", lowOpacity)
    svg_piechart.selectAll(".pieText").style("opacity", lowOpacity)
    // only show the one that is hovered
    piechart_keys.forEach(key => {
      svg_piechart.selectAll(".pieSlice-" + key).style("opacity", highOpacity_piechart)
      svg_piechart.selectAll(".pieText-" + key).style("opacity", highOpacity_piechart)
    })

  }


  /* --------------------------------------------- */
  // FOLLOWERS

  const datetime_followers = followersJson.data.labels;
  const num_followers = followersJson.data.datasets[1].data; // hardcoded index for "Followers"
  const delta_followers = num_followers.map((val, index) => {
    const delta = val - (num_followers[index - 1] || 0)
    return delta<=0 ? null : delta
  });

  // set first value to 0
  delta_followers[0] = null

  //console.log("datetime_followers: ", datetime_followers)
  //console.log("num_followers: ", num_followers)
  //console.log("delta_followers: ", delta_followers)

  // handle error: mismatch xy length
  if (datetime_followers.length !== num_followers.length) throw error;

  const followers_zip = datetime_followers
    .map((datetime, index) => {
      return {
        timeStreamed: null,
        datetime: parseDatetime(datetime), 
        numFollowers: num_followers[index],
        gainedFollowers: delta_followers[index]
      }
    })
    .filter(followers => followers.datetime >= subathonStartDate && followers.datetime <= subathonEndDate)
    .map(followers => { 
      return {
        timeStreamed: datetimeToHours(followers.datetime),
        datetime: followers.datetime,
        numFollowers: followers.numFollowers,
        gainedFollowers: followers.gainedFollowers
      }
    });

  followers_zip[0].gainedFollowers = 0

  console.log("followers_zip: ", followers_zip)

  const gainedFollowers = followers_zip.map(d => d.gainedFollowers)
  console.log("gainedFollowers: ", gainedFollowers)

  /* --------------------------------------------- */
  // HIGHLIGHTS

  const datetime_highlights = highlightsJson.datetime;
  const timeStreamed_highlights = highlightsJson.timeStreamed;
  const type_highlights = highlightsJson.type; 
  const title_highlights = highlightsJson.title; 
  const url_highlights = highlightsJson.url;
  const embed_highlights = highlightsJson.embed;

  //console.log("datetime_highlights: ", datetime_highlights)
  //console.log("timeStreamed_highlights: ", timeStreamed_highlights)
  //console.log("type_highlights: ", type_highlights)
  //console.log("title_highlights: ", title_highlights)
  //console.log("url_highlights: ", url_highlights)
  //console.log("embed_highlights: ", embed_highlights)

  // handle error: mismatch xy length
  if (datetime_highlights.length !== type_highlights.length || 
        datetime_highlights.length !== timeStreamed_highlights.length || 
        datetime_highlights.length !== title_highlights.length || 
        datetime_highlights.length !== url_highlights.length || 
        datetime_highlights.length !== embed_highlights.length ) 
    throw error;

  const highlights_zip = datetime_highlights
    .map((datetime, index) => {
      return {
        id: index, 
        timeStreamed: null,
        datetime: parseDatetime(datetime), 
        type: type_highlights[index],
        title: title_highlights[index],
        url: url_highlights[index],
        embed: embed_highlights[index]
      }
    })
    .filter(highlight => highlight.datetime >= subathonStartDate && highlight.datetime <= subathonEndDate)
    .map(highlight => { 
      const xHour = datetimeToHours(highlight.datetime)
      const yHour = timeLeft_hours[timeStreamed_hours.indexOf(xHour)]
      return {
        id: highlight.id,
        timeStreamed: xHour,
        timeLeft: yHour,
        datetime: highlight.datetime,
        type: highlight.type,
        title: highlight.title,
        url: highlight.url,
        embed: highlight.embed
      }
    });

  console.log("highlights_zip: ", highlights_zip)

  /* --------------------------------------------- */
  // GRAPH

  /* --- Simple Line DEFINITIONS --- */

  // Define xy axes (timeLeft)
  var xDomain_timeLeft = [0, d3.max(timeStreamed_hours)],
      yDomain_timeLeft = [0, d3.max(timeLeft_hours)];
  var xScale_timeLeft = d3.scaleLinear().domain(xDomain_timeLeft).range([ 0, width ]),
      yScale_timeLeft = d3.scaleLinear().domain(yDomain_timeLeft).range([ height_timeLeft, 0 ]);
  var xAxis_timeLeft = d3.axisBottom(xScale_timeLeft),
      yAxis_timeLeft = d3.axisLeft(yScale_timeLeft);

  // Define xy axes (viewers)
  var xDomain_viewers = [0, d3.max(timeStreamed_hours)],
      yDomain_viewers = [0, d3.max(numViewers)];
  var xScale_viewers = d3.scaleLinear().domain(xDomain_viewers).range([ 0, width ]),
      yScale_viewers = d3.scaleLinear().domain(yDomain_viewers).range([ height_viewers, 0 ]);
  var xAxis_viewers = d3.axisBottom(xScale_viewers),
      yAxis_viewers = d3.axisLeft(yScale_viewers);

  // Define xy axes (subFollows) -- TODO: plot BOTH subs and follows
  var xDomain_subFollows = [0, d3.max(timeStreamed_hours)],
      yDomain_subFollows = [0, d3.max(gainedFollowers)];
  var xScale_subFollows = d3.scaleLinear().domain(xDomain_subFollows).range([ 0, width ]),
      yScale_subFollows = d3.scaleLinear().domain(yDomain_subFollows).range([ height_subFollows, 0 ]);
  var xAxis_subFollows = d3.axisBottom(xScale_subFollows),
      yAxis_subFollows = d3.axisLeft(yScale_subFollows);

  // Define line (timeLeft)
  var drawLine_timeLeft = d3.line()
    .defined(d => !isNaN(d.timeLeft))
    .x(d => xScale_timeLeft(d.timeStreamed))
    .y(d => yScale_timeLeft(d.timeLeft))

  // Define activity area (timeLeft)
  var drawarea_timeLeft = d3.area()
    .x(d => xScale_timeLeft(d.timeStreamed))
    .y0(yScale_timeLeft(0))
    .y1(d => yScale_timeLeft(d.timeLeft))

  // Define line (viewers)
  var drawLine_viewers = d3.line()
    .defined(d => !isNaN(d.numViewers))
    .x(d => xScale_viewers(d.timeStreamed))
    .y(d => yScale_viewers(d.numViewers))

  // Define area (viewers)
  var drawarea_viewers = d3.area()
    .x(d => xScale_viewers(d.timeStreamed))
    .y0(yScale_viewers(0))
    .y1(d => yScale_viewers(d.numViewers))

  // Define line (subFollows)
  var drawLine_subFollows = d3.line()
    .defined(d => !isNaN(d.gainedFollowers))
    .x(d => xScale_subFollows(d.timeStreamed))
    .y(d => yScale_subFollows(d.gainedFollowers))

  // Define area (subFollows)
  var drawarea_subFollows = d3.area()
    .x(d => xScale_subFollows(d.timeStreamed))
    .y0(yScale_subFollows(0))
    .y1(d => yScale_subFollows(d.gainedFollowers))

  /* ---------- */

  // Add x-axis (timeLeft)
  svg.append("g")
    .attr("class", "axis axis--x--timeLeft")
    .attr("transform", "translate(0," + height_timeLeft + ")")
    .call(xAxis_timeLeft);

  // Add y-axis (timeLeft)
  svg.append("g")
    .attr("class", "axis axis--y--timeLeft")
    .call(yAxis_timeLeft)

  // Add x-axis label (timeLeft)
  svg.append("text")             
    .attr("transform",
          "translate(" + width + " ," + (height_timeLeft + margin_timeLeft.top - 30) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label (timeLeft)
  svg.append("text")
    .attr("transform", "translate(-35, 55) rotate(-90)")
    .style("text-anchor", "middle")
    .text("Subathon Timer (hr:min:sec)");   

  /* ---------- */

  // Add x-axis (viewers)
  svg.append("g")
    .attr("class", "axis axis--x--viewers")
    .attr("transform", "translate(0," + (height_viewers + margin_viewers.top - margin_text) + ")")
    .call(xAxis_viewers);

  // Add y-axis (viewers)
  svg.append("g")
    .attr("class", "axis axis--y--viewers")
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")
    .call(yAxis_viewers)

  // Add x-axis label (viewers)
  svg.append("text")             
    .attr("transform",
          "translate(" + width + " ," + (height_viewers + margin_viewers.top + 10) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label (viewers)
  svg.append("text")
    .attr("transform", "translate(-50," + (margin_viewers.top - margin_text + 10) + ") rotate(-90)")
    .style("text-anchor", "middle")
    .text("# Viewers");  

  /* ---------- */

  // Add x-axis (subFollows)
  svg.append("g")
    .attr("class", "axis axis--x--subFollows")
    .attr("transform", "translate(0," + (height_subFollows + margin_subFollows.top - margin_text) + ")")
    .call(xAxis_subFollows);

  // Add y-axis (subFollows)
  svg.append("g")
    .attr("class", "axis axis--y--subFollows")
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")
    .call(yAxis_subFollows)

  // Add x-axis label (subFollows)
  svg.append("text")             
    .attr("transform",
          "translate(" + width + " ," + (height_subFollows + margin_subFollows.top + 10) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label (subFollows)
  svg.append("text")
    .attr("transform", "translate(-45," + (margin_subFollows.top - margin_text + 35) + ") rotate(-90)")
    .style("text-anchor", "middle")
    .text("# Followers Gained");  

  /* --- Focus / Hover DEFINITIONS --- */

  // Define focus datetime 
  var focus_datetime = svg.append("g")
    .append("text")
    .style("opacity", 0)

  // Define focus dayHour
  var focus_dayHour = svg.append("g")
    .append("text")
    .style("opacity", 0)

  // Define focus circle (timeLeft)
  var focus_circle_timeLeft = svg.append("g")
    .append("circle")
    .style("fill", "black")
    .attr("stroke", "black")
    .attr("r", 3)
    .style("opacity", 0)

  // Define focus text (timeLeft)
  var focus_text_timeLeft = svg.append("g")
    .append("text")
    .style("opacity", 0)

  // Define focus text mode (timeLeft)
  var focus_textMode_timeLeft = svg.append("g")
    .append("text")
    .style("opacity", 0)

  // Define vertical line (timeLeft)
  var focus_vertLine_timeLeft = svg.append("g")
    .append("line")
    .attr("class", "vert-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", height_timeLeft)
    .style("opacity", 0)

  // Define focus circle (viewers)
  var focus_circle_viewers = svg.append("g")
    .append("circle")
    .style("fill", "black")
    .attr("stroke", "black")
    .attr("r", 3)
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")

  // Define focus text (viewers)
  var focus_text_viewers = svg.append("g")
    .append("text")
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")

  // Define focus text mode (viewers)
  var focus_textMode_viewers = svg.append("g")
    .append("text")
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")

  // Define vertical line (viewers)
  var focus_vertLine_viewers = svg.append("g")
    .append("line")
    .attr("class", "vert-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", height_viewers)
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")

  // Define focus circle (subFollows)
  var focus_circle_subFollows = svg.append("g")
    .append("circle")
    .style("fill", "black")
    .attr("stroke", "black")
    .attr("r", 3)
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")

  // Define focus text (subFollows)
  var focus_text_subFollows = svg.append("g")
    .append("text")
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")

  // Define focus text mode (subFollows)
  var focus_textMode_subFollows = svg.append("g")
    .append("text")
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")

  // Define vertical line (subFollows)
  var focus_vertLine_subFollows = svg.append("g")
    .append("line")
    .attr("class", "vert-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", height_subFollows)
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")

  function mouseoutFocus(){
    focus_datetime.style("opacity", 0)
    focus_dayHour.style("opacity", 0)
    focus_circle_timeLeft.style("opacity", 0)
    focus_text_timeLeft.style("opacity", 0)
    focus_textMode_timeLeft.style("opacity", 0)
    focus_vertLine_timeLeft.style("opacity", 0)
    focus_circle_viewers.style("opacity", 0)
    focus_text_viewers.style("opacity", 0)
    focus_textMode_viewers.style("opacity", 0)
    focus_vertLine_viewers.style("opacity", 0)
    focus_circle_subFollows.style("opacity", 0)
    focus_text_subFollows.style("opacity", 0)
    focus_textMode_subFollows.style("opacity", 0)
    focus_vertLine_subFollows.style("opacity", 0)
  }

  function mousemoveFocus(){
    var x0_timeLeft = xScale_timeLeft.invert(d3.mouse(this)[0]),
        i_timeLeft = bisectHour(timeLeftJson_zip, x0_timeLeft, 1),
        selectedData_timeLeft = timeLeftJson_zip[i_timeLeft]
    var x0_viewers= xScale_viewers.invert(d3.mouse(this)[0]),
        i_viewers = bisectHour(viewers_zip, x0_viewers, 1),
        selectedData_viewers = viewers_zip[i_viewers]
    var x0_subFollows = xScale_subFollows.invert(d3.mouse(this)[0]),
        i_subFollows = bisectHour(followers_zip, x0_subFollows, 1),
        selectedData_subFollows = followers_zip[i_subFollows]

    if(selectedData_timeLeft){
      var xTransformed_timeLeft = xScale_timeLeft(selectedData_timeLeft.timeStreamed),
          yTransformed_timeLeft = yScale_timeLeft(selectedData_timeLeft.timeLeft)
      focus_datetime
        .html(d3.timeFormat("%a, %b %d, %Y @ %I:%M %p")(hoursToDatetime(selectedData_timeLeft.timeStreamed)) + " EST") //" (" + selectedData_timeLeft.timeStreamed + " hrs)"
        .attr("x", xTransformed_timeLeft)
        .attr("y", -50)
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .style("opacity", 1)
      focus_dayHour
        .html("Day " + (Math.floor(selectedData_timeLeft.timeStreamed/24)+1) + " (" + selectedData_timeLeft.timeStreamed + " hrs)") 
        .attr("x", xTransformed_timeLeft)
        .attr("y", -35)
        .style("text-anchor", "middle")
        .style("opacity", 1)
      focus_circle_timeLeft
        .attr("cx", xTransformed_timeLeft)
        .attr("cy", yTransformed_timeLeft)
        .style("opacity", 1)
      focus_text_timeLeft
        .html(selectedData_timeLeft.subathonTimer + " on timer")
        .attr("x", xTransformed_timeLeft + 5)
        .attr("y", yTransformed_timeLeft - 25)
        .style("opacity", 1)
      focus_textMode_timeLeft
        .html(d => {
          if(currentMode==="byActivity" && selectedData_viewers) 
            return viewers_zip[Math.floor(i_timeLeft/2)].game //selectedData_viewers.game -- hacky hardcoded
          else if (currentMode==="byLudwigModcast" && i_timeLeft>=0)
            return sleepAwakeToLudwigModcast[ludwigModcastJson_zip[i_timeLeft].sleepAwake]
          else if (currentMode==="byTime" && selectedData_timeLeft)
            return timeHourToText[Math.floor(selectedData_timeLeft.timeStreamed + 17)%24]
          else
            return ""
        })
        .attr("x", xTransformed_timeLeft + 15)
        .attr("y", yTransformed_timeLeft - 12)
        .style("fill", d => {
          if(currentMode==="byActivity" && selectedData_viewers) 
            return viewers_zip[Math.floor(i_timeLeft/2)].game ? colorDict[cleanString(viewers_zip[Math.floor(i_timeLeft/2)].game)] : null
          else if (currentMode==="byLudwigModcast" && i_timeLeft>=0)
            return colorSleepAwake[ludwigModcastJson_zip[i_timeLeft].sleepAwake]
          else if (currentMode==="byTime" && selectedData_timeLeft)
            return colorTimeHour[Math.floor(selectedData_timeLeft.timeStreamed + 17)%24]
          else
            return null
        })
        .style("opacity", 1)
      focus_vertLine_timeLeft
        .attr("x1", xTransformed_timeLeft)
        .attr("y1", height_timeLeft)
        .attr("x2", xTransformed_timeLeft)
        .attr("y2", -10)
        .style("opacity", 1)
    }else{
      focus_datetime.style("opacity", 0)
      focus_dayHour.style("opacity", 0)
      focus_circle_timeLeft.style("opacity", 0)
      focus_text_timeLeft.style("opacity", 0)
      focus_textMode_timeLeft.style("opacity", 0)
      focus_vertLine_timeLeft.style("opacity", 0)
    }

    if(selectedData_viewers){ 
      var xTransformed_viewers = xScale_viewers(selectedData_viewers.timeStreamed),
          yTransformed_viewers = yScale_viewers(selectedData_viewers.numViewers)
      focus_circle_viewers
        .attr("cx", xTransformed_viewers)
        .attr("cy", yTransformed_viewers)
        .style("opacity", 1)
      focus_text_viewers
        .html(selectedData_viewers.numViewers + " viewers")
        .attr("x", xTransformed_viewers + 5)
        .attr("y", yTransformed_viewers - 30)
        .style("opacity", 1)
      focus_textMode_viewers
        .html(d => {
          if(currentMode==="byActivity" && selectedData_viewers) 
            return selectedData_viewers.game
          else if (currentMode==="byLudwigModcast" && i_timeLeft>=0)
            return sleepAwakeToLudwigModcast[ludwigModcastJson_zip[i_timeLeft].sleepAwake]
          else if (currentMode==="byTime" && selectedData_timeLeft)
            return timeHourToText[Math.floor(selectedData_timeLeft.timeStreamed + 17)%24]
          else
            return ""
        })        
        .attr("x", xTransformed_viewers + 15)
        .attr("y", yTransformed_viewers - 15)
        .style("fill", d => {
          if(currentMode==="byActivity" && selectedData_viewers) 
            return selectedData_viewers.game ? colorDict[cleanString(selectedData_viewers.game)] : null
          else if (currentMode==="byLudwigModcast" && i_timeLeft>=0)
            return colorSleepAwake[ludwigModcastJson_zip[i_timeLeft].sleepAwake]
          else if (currentMode==="byTime" && selectedData_timeLeft)
            return colorTimeHour[Math.floor(selectedData_timeLeft.timeStreamed + 17)%24]
          else
            return null
        })
        .style("opacity", 1)
      focus_vertLine_viewers
        .attr("x1", xTransformed_viewers)
        .attr("y1", height_viewers)
        .attr("x2", xTransformed_viewers)
        .attr("y2", -10)
        .style("opacity", 1)
    }else{
      focus_circle_viewers.style("opacity", 0)
      focus_text_viewers.style("opacity", 0)
      focus_textMode_viewers.style("opacity", 0)
      focus_vertLine_viewers.style("opacity", 0)
    }

    if(selectedData_subFollows){ 
      var xTransformed_subFollows = xScale_subFollows(selectedData_subFollows.timeStreamed),
          yTransformed_subFollows = yScale_subFollows(selectedData_subFollows.gainedFollowers)
      focus_circle_subFollows
        .attr("cx", xTransformed_subFollows)
        .attr("cy", yTransformed_subFollows)
        .style("opacity", 1)
      focus_text_subFollows
        .html(selectedData_subFollows.gainedFollowers + " follows")
        .attr("x", xTransformed_subFollows + 5)
        .attr("y", yTransformed_subFollows - 25)
        .style("opacity", 1)
      focus_textMode_subFollows
        .html(d => {
          if(currentMode==="byActivity" && selectedData_viewers) 
            return selectedData_viewers.game
          else if (currentMode==="byLudwigModcast" && i_timeLeft>=0)
            return sleepAwakeToLudwigModcast[ludwigModcastJson_zip[i_timeLeft].sleepAwake]
          else if (currentMode==="byTime" && selectedData_timeLeft)
            return timeHourToText[Math.floor(selectedData_timeLeft.timeStreamed + 17)%24]
          else
            return ""
        })        .attr("x", xTransformed_subFollows + 15)
        .attr("y", yTransformed_subFollows - 10)
        .style("fill", d => {
          if(currentMode==="byActivity" && selectedData_viewers) 
            return selectedData_viewers.game ? colorDict[cleanString(selectedData_viewers.game)] : null
          else if (currentMode==="byLudwigModcast" && i_timeLeft>=0)
            return colorSleepAwake[ludwigModcastJson_zip[i_timeLeft].sleepAwake]
          else if (currentMode==="byTime" && selectedData_timeLeft)
            return colorTimeHour[Math.floor(selectedData_timeLeft.timeStreamed + 17)%24]
          else
            return null
        })
        .style("opacity", 1)
      focus_vertLine_subFollows
        .attr("x1", xTransformed_subFollows)
        .attr("y1", height_subFollows)
        .attr("x2", xTransformed_subFollows)
        .attr("y2", -10)
        .style("opacity", 1)
    }else{
      focus_circle_subFollows.style("opacity", 0)
      focus_text_subFollows.style("opacity", 0)
      focus_textMode_subFollows.style("opacity", 0)
      focus_vertLine_subFollows.style("opacity", 0)
    }

  }

  /* ------------------------------------- */
  // Area graph - Activity (timeLeft, viewers, subFollows)

  const activityList_unique_original = []
  viewers_zip
    .forEach((viewer) => {
      if(viewer.game!==null && !activityList_unique_original.includes(cleanString(viewer.game))){
        activityList_unique_original.push(cleanString(viewer.game))
      }
    })

  console.log("activityList_unique_original: ", activityList_unique_original)

  /* ----- */

  // color palette
  //var colorSchemes = d3.schemeSet2.concat(d3.schemeTableau10) 

  // https://sashamaps.net/docs/resources/20-colors/
  const colorSchemes = ['#3cb44b', '#e6194b', '#ffc45d', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#800000', '#808000', '#ffd8b1', '#2a9df4', '#808080']
  const colorDict = {}
  activityList_unique_original.forEach((activity, i) => {
    colorDict[activity] = colorSchemes[i]
  })
  console.log("colorDict: ", colorDict)

  /* ----- */

  var activityList_keys = []
  var activityList_data = []
  var prevActivity = viewers_zip[0].game
  var prevTimeStreamedStart = 0
  var prevActivityList = []

  timeLeftJson_zip.forEach((d, i) => {
    const viewers = viewers_zip.filter(obj => obj.timeStreamed === d.timeStreamed)[0]
    const followers = followers_zip.filter(obj => obj.timeStreamed === d.timeStreamed)[0]

    prevActivityList.push({
      timeStreamed: d.timeStreamed,
      datetime: hoursToDatetime(d.timeStreamed),
      game: (viewers && viewers.game) ? viewers.game : null,
      timeLeft: d.timeLeft,
      numViewers: (viewers && viewers.numViewers) ? viewers.numViewers : null,
      numFollowers: (followers && followers.numFollowers) ? followers.numFollowers : null,
      gainedFollowers: (followers && followers.gainedFollowers) ? followers.gainedFollowers : null
    })

    if (viewers && viewers.game !== prevActivity){
      activityList_keys.push(cleanString(prevActivity) + "-" + prevTimeStreamedStart) // ie. SuperMarioOdyssey-1
      activityList_data.push({
        data: prevActivityList,
        game: cleanString(prevActivity),
        timeStreamed: prevTimeStreamedStart
      })

      // reset items
      prevActivity = viewers.game
      prevTimeStreamedStart = d.timeStreamed

      prevActivityList = [{
        timeStreamed: d.timeStreamed,
        datetime: hoursToDatetime(d.timeStreamed),
        game: (viewers && viewers.game) ? viewers.game : null,
        timeLeft: d.timeLeft,
        numViewers: (viewers && viewers.numViewers) ? viewers.numViewers : null,
        numFollowers: (followers && followers.numFollowers) ? followers.numFollowers : null,
        gainedFollowers: (followers && followers.gainedFollowers) ? followers.gainedFollowers : null
      }]
    }
  
  })

  console.log("activityList_keys: ", activityList_keys)
  console.log("activityList_data: ", activityList_data)

  /* ----- */

  // What to do when one group is hovered
  const mouseover_legend_allActivity = function(d){
    if (currentMode==="byActivity"){
      // reduce opacity of all groups
      svg_line_timeLeft.selectAll(".area_timeLeft_activity").style("opacity", lowOpacity)
      svg_line_viewers.selectAll(".area_viewers_activity").style("opacity", lowOpacity)
      svg_line_subFollows.selectAll(".area_subFollows_activity").style("opacity", lowOpacity)
      svg.selectAll(".activity_legend_colors").style("opacity", lowOpacity)
      svg.selectAll(".activity_legend_text").style("opacity", lowOpacity)
      svg_treemap.selectAll(".rect-activity").style("opacity", lowOpacity)
      svg_treemap.selectAll(".title-activity").style("opacity", lowOpacity)
      svg_treemap.selectAll(".percent-activity").style("opacity", lowOpacity)
      // expect the one that is hovered
      svg_line_timeLeft.selectAll("." + d).style("opacity", highOpacity)
      svg_line_viewers.selectAll("." + d).style("opacity", highOpacity)
      svg_line_subFollows.selectAll("." + d).style("opacity", highOpacity)
      svg.selectAll(".legendColor-" + d).style("opacity", highOpacity)
      svg.selectAll(".legendText-" + d).style("opacity", highOpacity)
      svg_treemap.selectAll(".treemapRect-" + d).style("opacity", highOpacity)
      svg_treemap.selectAll(".treemapTitle-" + d).style("opacity", highOpacity)
      svg_treemap.selectAll(".treemapPercent-" + d).style("opacity", highOpacity)
    }
  }

  // What to do when one group is hovered
  const mouseover_treemap_allActivity = function(d){
    if (currentMode==="byActivity"){
      // reduce opacity of all groups
      svg_line_timeLeft.selectAll(".area_timeLeft_activity").style("opacity", lowOpacity)
      svg_line_viewers.selectAll(".area_viewers_activity").style("opacity", lowOpacity)
      svg_line_subFollows.selectAll(".area_subFollows_activity").style("opacity", lowOpacity)
      svg.selectAll(".activity_legend_colors").style("opacity", lowOpacity)
      svg.selectAll(".activity_legend_text").style("opacity", lowOpacity)
      svg_treemap.selectAll(".rect-activity").style("opacity", lowOpacity)
      svg_treemap.selectAll(".title-activity").style("opacity", lowOpacity)
      svg_treemap.selectAll(".percent-activity").style("opacity", lowOpacity)
      // expect the one that is hovered
      if(d.id){
        svg_line_timeLeft.selectAll("." + cleanString(d.id)).style("opacity", highOpacity)
        svg_line_viewers.selectAll("." + cleanString(d.id)).style("opacity", highOpacity)
        svg_line_subFollows.selectAll("." + cleanString(d.id)).style("opacity", highOpacity)
        svg.selectAll(".legendColor-" + cleanString(d.id)).style("opacity", highOpacity)
        svg.selectAll(".legendText-" + cleanString(d.id)).style("opacity", highOpacity)
        svg_treemap.selectAll(".treemapRect-" + cleanString(d.id)).style("opacity", highOpacity)
        svg_treemap.selectAll(".treemapTitle-" + cleanString(d.id)).style("opacity", highOpacity)
        svg_treemap.selectAll(".treemapPercent-" + cleanString(d.id)).style("opacity", highOpacity)
      }
    }
  }

  // And when it is not hovered anymore
  const mouseleave_allActivity = function(d){
    if (currentMode==="byActivity"){
      svg_line_timeLeft.selectAll(".area_timeLeft_activity").style("opacity", highOpacity)
      svg_line_viewers.selectAll(".area_viewers_activity").style("opacity", highOpacity)
      svg_line_subFollows.selectAll(".area_subFollows_activity").style("opacity", highOpacity)
      svg.selectAll(".activity_legend_colors").style("opacity", highOpacity)
      svg.selectAll(".activity_legend_text").style("opacity", highOpacity)
      svg_treemap.selectAll(".rect-activity").style("opacity", highOpacity)
      svg_treemap.selectAll(".title-activity").style("opacity", highOpacity)
      svg_treemap.selectAll(".percent-activity").style("opacity", highOpacity)
    }
  }

  /* ------------------------------------- */
  // Area graph - SleepAwake (timeLeft, viewers, subFollows)


  // https://fire-miracle.tumblr.com/post/185073640198/day-and-night-submitted-by-smolnlonelybean
  const colorSleepAwake = {
    "awake": "#aecfdb", // aff0ff
    "sleep": "#101263", // 101263
    "away": "#ffbaaa" // ffbaaa
  }
  console.log("colorSleepAwake: ", colorSleepAwake)

  /* ----- */

  const sleepAwakeList_unique_original = ["sleep", "awake", "away"] // hardcoded
  const sleepAwakeToLudwigModcast = {
    "sleep": "Modcast",
    "awake": "Ludwig",
    "away": "Away"
  }
  console.log("sleepAwakeList_unique_original: ", sleepAwakeList_unique_original)

  /* ----- */

  var sleepAwakeList_keys = []
  var sleepAwakeList_data = []

  var prevSleepAwakeStart = 0
  var prevSleepAwake = ludwigModcastJson_zip[0].sleepAwake
  var prevSleepAwakeList = []

  var newSection = false

  timeLeftJson_zip.forEach((d, i) => {
    const viewers = viewers_zip.filter(obj => obj.timeStreamed === d.timeStreamed)[0]
    const followers = followers_zip.filter(obj => obj.timeStreamed === d.timeStreamed)[0]
    const ludwigModcast = ludwigModcastJson_zip[i]

    if(newSection && d.timeStreamed%1===0){
      // update previous if it ended on a non-whole integer
      sleepAwakeList_data[sleepAwakeList_data.length-1].data.push({
        timeStreamed: d.timeStreamed,
        datetime: hoursToDatetime(d.timeStreamed),
        sleepAwake: ludwigModcast.sleepAwake,
        timeLeft: d.timeLeft,
        numViewers: (viewers && viewers.numViewers) ? viewers.numViewers : null,
        numFollowers: (followers && followers.numFollowers) ? followers.numFollowers : null,
        gainedFollowers: (followers && followers.gainedFollowers) ? followers.gainedFollowers : null
      })

      newSection = false
    }

    prevSleepAwakeList.push({
      timeStreamed: d.timeStreamed,
      datetime: hoursToDatetime(d.timeStreamed),
      sleepAwake: ludwigModcast.sleepAwake,
      timeLeft: d.timeLeft,
      numViewers: (viewers && viewers.numViewers) ? viewers.numViewers : null,
      numFollowers: (followers && followers.numFollowers) ? followers.numFollowers : null,
      gainedFollowers: (followers && followers.gainedFollowers) ? followers.gainedFollowers : null
    })

    if (ludwigModcast.sleepAwake !== prevSleepAwake){

      // if ending on a non-integer value, need to go back and add the final value in the next iteration
      newSection = d.timeStreamed%1!==0

      sleepAwakeList_keys.push(prevSleepAwake + "-" + prevSleepAwakeStart) // ie. awake-0
      sleepAwakeList_data.push({
        data: prevSleepAwakeList,
        sleepAwake: prevSleepAwake,
        timeStreamed: prevSleepAwakeStart
      })

      // reset items
      prevSleepAwake = ludwigModcast.sleepAwake
      prevSleepAwakeStart = d.timeStreamed

      // only start add data to new section if it starts on a whole number
      if(d.timeStreamed%1===0){
        prevSleepAwakeList = [{
          timeStreamed: d.timeStreamed,
          datetime: hoursToDatetime(d.timeStreamed),
          sleepAwake: ludwigModcast.sleepAwake,
          timeLeft: d.timeLeft,
          numViewers: (viewers && viewers.numViewers) ? viewers.numViewers : null,
          numFollowers: (followers && followers.numFollowers) ? followers.numFollowers : null,
          gainedFollowers: (followers && followers.gainedFollowers) ? followers.gainedFollowers : null
        }]
      }else{
        prevSleepAwakeList = []
      }
    }

    if(i===timeLeftJson_zip.length-1){
      const lastItem = sleepAwakeList_data[sleepAwakeList_data.length-1]
      const prevSleepAwakeStart = lastItem.data[lastItem.data.length-1].timeStreamed
      sleepAwakeList_keys.push(prevSleepAwake + "-" + prevSleepAwakeStart) // ie. awake-0
      sleepAwakeList_data.push({
        data: prevSleepAwakeList,
        sleepAwake: prevSleepAwake,
        timeStreamed: prevSleepAwakeStart
      })
    }
  
  })


  console.log("sleepAwakeList_keys: ", sleepAwakeList_keys)
  console.log("sleepAwakeList_data: ", sleepAwakeList_data)

  /* ----- */

  // What to do when one group is hovered
  const mouseover_legend_allSleepAwake = function(d){
    if (currentMode==="byLudwigModcast"){
      // reduce opacity of all groups
      svg_line_timeLeft.selectAll(".area_timeLeft_sleepAwake").style("opacity", lowOpacity)
      svg_line_viewers.selectAll(".area_viewers_sleepAwake").style("opacity", lowOpacity)
      svg_line_subFollows.selectAll(".area_subFollows_sleepAwake").style("opacity", lowOpacity)
      svg.selectAll(".sleepAwake_legend_colors").style("opacity", lowOpacity)
      svg.selectAll(".sleepAwake_legend_text").style("opacity", lowOpacity)
      svg_treemap.selectAll(".rect-sleepAwake").style("opacity", lowOpacity)
      svg_treemap.selectAll(".title-sleepAwake").style("opacity", lowOpacity)
      svg_treemap.selectAll(".percent-sleepAwake").style("opacity", lowOpacity)
      // expect the one that is hovered
      svg_line_timeLeft.selectAll("." + d).style("opacity", highOpacity)
      svg_line_viewers.selectAll("." + d).style("opacity", highOpacity)
      svg_line_subFollows.selectAll("." + d).style("opacity", highOpacity)
      svg.selectAll(".legendColor-" + d).style("opacity", highOpacity)
      svg.selectAll(".legendText-" + d).style("opacity", highOpacity)
      svg_treemap.selectAll(".treemapRect-" + d).style("opacity", highOpacity)
      svg_treemap.selectAll(".treemapTitle-" + d).style("opacity", highOpacity)
      svg_treemap.selectAll(".treemapPercent-" + d).style("opacity", highOpacity)
    }
  }

  // What to do when one group is hovered
  const mouseover_treemap_allSleepAwake = function(d){
    if (currentMode==="byLudwigModcast"){
      // reduce opacity of all groups
      svg_line_timeLeft.selectAll(".area_timeLeft_sleepAwake").style("opacity", lowOpacity)
      svg_line_viewers.selectAll(".area_viewers_sleepAwake").style("opacity", lowOpacity)
      svg_line_subFollows.selectAll(".area_subFollows_sleepAwake").style("opacity", lowOpacity)
      svg.selectAll(".sleepAwake_legend_colors").style("opacity", lowOpacity)
      svg.selectAll(".sleepAwake_legend_text").style("opacity", lowOpacity)
      svg_treemap.selectAll(".rect-sleepAwake").style("opacity", lowOpacity)
      svg_treemap.selectAll(".title-sleepAwake").style("opacity", lowOpacity)
      svg_treemap.selectAll(".percent-sleepAwake").style("opacity", lowOpacity)
      // expect the one that is hovered
      if(d.id){
        svg_line_timeLeft.selectAll("." + cleanString(d.id)).style("opacity", highOpacity)
        svg_line_viewers.selectAll("." + cleanString(d.id)).style("opacity", highOpacity)
        svg_line_subFollows.selectAll("." + cleanString(d.id)).style("opacity", highOpacity)
        svg.selectAll(".legendColor-" + cleanString(d.id)).style("opacity", highOpacity)
        svg.selectAll(".legendText-" + cleanString(d.id)).style("opacity", highOpacity)
        svg_treemap.selectAll(".treemapRect-" + cleanString(d.id)).style("opacity", highOpacity)
        svg_treemap.selectAll(".treemapTitle-" + cleanString(d.id)).style("opacity", highOpacity)
        svg_treemap.selectAll(".treemapPercent-" + cleanString(d.id)).style("opacity", highOpacity)
      }
    }
  }

  // And when it is not hovered anymore
  const mouseleave_allSleepAwake = function(d){
    if (currentMode==="byLudwigModcast"){
      svg_line_timeLeft.selectAll(".area_timeLeft_sleepAwake").style("opacity", highOpacity)
      svg_line_viewers.selectAll(".area_viewers_sleepAwake").style("opacity", highOpacity)
      svg_line_subFollows.selectAll(".area_subFollows_sleepAwake").style("opacity", highOpacity)
      svg.selectAll(".sleepAwake_legend_colors").style("opacity", highOpacity)
      svg.selectAll(".sleepAwake_legend_text").style("opacity", highOpacity)
      svg_treemap.selectAll(".rect-sleepAwake").style("opacity", highOpacity)
      svg_treemap.selectAll(".title-sleepAwake").style("opacity", highOpacity)
      svg_treemap.selectAll(".percent-sleepAwake").style("opacity", highOpacity)
    }
  }


  /* ------------------------------------- */
  // Area graph - colorTimeHour (timeLeft, viewers, subFollows)

  // https://line.17qq.com/articles/scesqrhqx.html
  const colorTimeHour = ["#793ba9", "#571189", "#4a2bae", "#105ca3", "#0594cc", "#17c3ea", "#00d3ec", "#71eead", "#eeeebe", "#fdea8a", "#e6ffa9", "#f9ef93", "#ffe677", "#ffda35", "#ffcf79", "#e3ab44", "#e09a19", "#ffb8a5", "#f15293", "#872ba3", "#7821a0", "#6a27a2", "#4d157b", "#43106f"] 
  console.log("colorTimeHour: ", colorTimeHour) // colorTimeHour[0] = 12am, colorTimeHour[1] = 1am, etc

  const timeHourToText = ["12 AM","1 AM","2 AM","3 AM","4 AM","5 AM","6 AM","7 AM","8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM","5 PM","6 PM","7 PM","8 PM","9 PM","10 PM","11 PM"]

  /* ----- */

  const timeHourList_unique_original = [...Array(24).keys()] // 24 hours in a day
  console.log("timeHourList_unique_original: ", timeHourList_unique_original)

  /* ----- */

  var timeHourList_keys = []
  var timeHourList_data = []
  var prevTimeHour = Math.floor(timeLeftJson_zip[0].timeStreamed+17)%24 // modulo requires integer, only counting by the hour //17 
  var prevTimeHourList = []

  timeLeftJson_zip.forEach((d, i) => {
    const viewers = viewers_zip.filter(obj => obj.timeStreamed === Math.floor(d.timeStreamed))[0] // viewers only has time by the hour
    const followers = followers_zip.filter(obj => obj.timeStreamed === Math.floor(d.timeStreamed))[0] // followers only has time by the hour
    const timeHour = Math.floor(d.timeStreamed + 17)%24 //Math.floor(hour+17)%24 --> 17

    prevTimeHourList.push({
      timeStreamed: d.timeStreamed, // 0    1
      datetime: viewers ? viewers.datetime : null,
      timeHour: timeHour, // 17   18
      timeLeft: d.timeLeft,
      numViewers: viewers ? viewers.numViewers : null,
      numFollowers: followers ? followers.numFollowers: null,
      gainedFollowers: followers ? followers.gainedFollowers: null
    })


    if(prevTimeHour!==timeHour){

      timeHourList_keys.push("time" + prevTimeHour + "-" + timeLeftJson_zip[i-2].timeStreamed) // ie. 17-0
      timeHourList_data.push({
        data: prevTimeHourList,
        timeHour: prevTimeHour,
        timeStreamed: timeLeftJson_zip[i-2].timeStreamed
      })

      // reset items
      prevTimeHour = timeHour
      prevTimeHourList = [{
        timeStreamed: d.timeStreamed,
        datetime: viewers ? viewers.datetime : null,
        timeHour: timeHour,
        timeLeft: d.timeLeft,
        numViewers: viewers ? viewers.numViewers : null,
        numFollowers: followers ? followers.numFollowers: null,
        gainedFollowers: followers ? followers.gainedFollowers: null
      }]
    }

    if(i===timeLeftJson_zip.length-1){
      const lastItem = timeHourList_data[timeHourList_data.length-1]
      const lastTimeStreamed = lastItem.data[lastItem.data.length-1].timeStreamed
      timeHourList_keys.push(prevTimeHour + "-" + lastTimeStreamed) 
      timeHourList_data.push({
        data: prevTimeHourList,
        timeHour: prevTimeHour,
        timeStreamed: lastTimeStreamed
      })
    }

  })

  console.log("timeHourList_keys: ", timeHourList_keys)
  console.log("timeHourList_data: ", timeHourList_data)


  /* ----- */

  // What to do when one group is hovered
  const mouseover_legend_allTimeHour = function(d){
    if (currentMode==="byTime"){
      // only do stuff if the key is relevant
      if(piechart_keys.includes(d)){
        // reduce opacity of all groups
        svg_line_timeLeft.selectAll(".area_timeLeft_timeHour").style("opacity", lowOpacity)
        svg_line_viewers.selectAll(".area_viewers_timeHour").style("opacity", lowOpacity)
        svg_line_subFollows.selectAll(".area_subFollows_timeHour").style("opacity", lowOpacity)
        svg.selectAll(".timeHour_legend_colors").style("opacity", lowOpacity)
        svg.selectAll(".timeHour_legend_text").style("opacity", lowOpacity)
        svg_piechart.selectAll(".pieSlice").style("opacity", lowOpacity)
        svg_piechart.selectAll(".pieText").style("opacity", lowOpacity)
        // expect the one that is hovered
        svg_line_timeLeft.selectAll(".time" + d).style("opacity", highOpacity)
        svg_line_viewers.selectAll(".time" + d).style("opacity", highOpacity)
        svg_line_subFollows.selectAll(".time" + d).style("opacity", highOpacity)
        svg.selectAll(".legendColor-" + d).style("opacity", highOpacity)
        svg.selectAll(".legendText-" + d).style("opacity", highOpacity)
        svg_piechart.selectAll(".pieSlice-" + d).style("opacity", highOpacity_piechart)
        svg_piechart.selectAll(".pieText-" + d).style("opacity", highOpacity_piechart)
      }
    }
  }

  // And when it is not hovered anymore
  const mouseleave_allTimeHour = function(d){
    if (currentMode==="byTime"){
      svg_line_timeLeft.selectAll(".area_timeLeft_timeHour").style("opacity", highOpacity)
      svg_line_viewers.selectAll(".area_viewers_timeHour").style("opacity", highOpacity)
      svg_line_subFollows.selectAll(".area_subFollows_timeHour").style("opacity", highOpacity)
      svg.selectAll(".timeHour_legend_colors").style("opacity", highOpacity)
      svg.selectAll(".timeHour_legend_text").style("opacity", highOpacity)
      // only show the one that is hovered
      svg_piechart.selectAll(".pieSlice").style("opacity", lowOpacity)
      svg_piechart.selectAll(".pieText").style("opacity", lowOpacity)
      piechart_keys.forEach(key => {
        svg_piechart.selectAll(".pieSlice-" + key).style("opacity", highOpacity_piechart)
        svg_piechart.selectAll(".pieText-" + key).style("opacity", highOpacity_piechart)
      })
    }
  }


  /* --- Brush + Line Clip DEFINITIONS --- */

  // Define animation time
  var idleTimeout,
      idleDelay = 350;

  /* ---------- */

  // Define line svg (timeLeft): where both the line and the brush take place
  var svg_line_timeLeft = svg.append('g')
    .attr("clip-path", "url(#clip_timeLeft)");

  // Define brush (timeleft)
  var brush_timeLeft = d3.brushX()
    .extent( [ [0,0], [width, height_timeLeft] ] )
    .on("end", brushended_timeLeft)

  // Define clipPath (timeLeft): everything out of this area won't be drawn.
  var clip_timeLeft = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip_timeLeft")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height_timeLeft)
    .attr("x", 0)
    .attr("y", 0);

  // Add line (timeLeft)
  svg_line_timeLeft.append("path")
    .datum(timeLeftJson_zip)
    .attr("class", "line_timeLeft")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .attr("d", drawLine_timeLeft)
    .attr("opacity", currentMode==="byHighlights" || currentMode==="byNone" ? 1 : 0.5)

  // Add activity area (timeLeft)
  activityList_data.forEach(activity => {
    svg_line_timeLeft.append("path")
      .datum(activity.data)
      .attr("class", d => "area_timeLeft_activity " + cleanString(activity.game) + " " + cleanString(activity.game) + "-" + activity.timeStreamed)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill", colorDict[cleanString(activity.game)])
      .attr("d", drawarea_timeLeft)
      .style("display", currentMode==="byActivity" ? null : "none")
  })

  // Add sleepAwake area (timeLeft)
  sleepAwakeList_data.forEach(item => {
    svg_line_timeLeft.append("path")
      .datum(item.data)
      .attr("class", d => "area_timeLeft_sleepAwake " + item.sleepAwake + " " + item.sleepAwake + "-" + item.timeStreamed)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill", colorSleepAwake[item.sleepAwake])
      .attr("d", drawarea_timeLeft)
      .style("display", currentMode==="byLudwigModcast" ? null : "none")
  })

  // Add timeHour area (timeLeft)
  timeHourList_data.forEach(item => {
    svg_line_timeLeft.append("path")
      .datum(item.data)
      .attr("class", d => "area_timeLeft_timeHour " + "time" + item.timeHour + " " + "time" + item.timeHour + "-" + item.timeStreamed)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill", colorTimeHour[item.timeHour])
      .attr("d", drawarea_timeLeft)
      .style("display", currentMode==="byTime" ? null : "none")
  })

  // Add brush + hover (timeLeft)
  svg_line_timeLeft.append("g")
    .attr("class", "brush_timeLeft")
    .call(brush_timeLeft)
    .on('mousemove', mousemoveFocus)
    .on('mouseout', mouseoutFocus)


  /* ---------- */

  // Define brush (viewers)
  var brush_viewers = d3.brushX()
    .extent( [ [0,0], [width, height_viewers] ] )
    .on("end", brushended_viewers)

  // Add a clipPath (viewers): everything out of this area won't be drawn.
  var clip_viewers = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip_viewers")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height_viewers)
    .attr("x", 0)
    .attr("y", 0);

  // Create the line svg (viewers): where both the line and the brush take place
  var svg_line_viewers = svg.append('g')
    .attr("clip-path", "url(#clip_viewers)")
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")

  // Add line (viewers)
  svg_line_viewers.append("path")
    .datum(viewers_zip)
    .attr("class", "line_viewers")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", drawLine_viewers)
    .attr("opacity", currentMode==="byHighlights" || currentMode==="byNone" ? 1 : 0.5)

  // Add activity area (viewers)
  activityList_data.forEach(activity => {
    svg_line_viewers.append("path")
      .datum(activity.data.filter(d => d.timeStreamed % 1 == 0))
      .attr("class", d => "area_viewers_activity " + cleanString(activity.game) + " " + cleanString(activity.game) + "-" + activity.numViewers)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill", colorDict[cleanString(activity.game)])
      .attr("d", drawarea_viewers)
      .style("display", currentMode==="byActivity" ? null : "none")
  })

  // Add sleepAwake area (viewers)
  sleepAwakeList_data.forEach(item => {
    svg_line_viewers.append("path")
      .datum(item.data.filter(d => d.timeStreamed % 1 == 0))
      .attr("class", d => "area_viewers_sleepAwake " + item.sleepAwake + " " + item.sleepAwake + "-" + item.timeStreamed)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill", colorSleepAwake[item.sleepAwake])
      .attr("d", drawarea_viewers)
      .style("display", currentMode==="byLudwigModcast" ? null : "none")
  })

  // Add timeHour area (viewers)
  timeHourList_data.forEach(item => {
    svg_line_viewers.append("path")
      .datum(item.data.filter(d => d.timeStreamed % 1 == 0))
      .attr("class", d => "area_viewers_timeHour " + "time" + item.timeHour + " " + "time" + item.timeHour + "-" + item.timeStreamed)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill", colorTimeHour[item.timeHour])
      .attr("d", drawarea_viewers)
      .style("display", currentMode==="byTime" ? null : "none")
  })

  // Add brush (viewers)
  svg_line_viewers.append("g")
    .attr("class", "brush_viewers")
    .call(brush_viewers)
    .on('mousemove', mousemoveFocus)
    .on('mouseout', mouseoutFocus);

  /* ---------- */

  // Define brush (subFollows)
  var brush_subFollows = d3.brushX()
    .extent( [ [0,0], [width, height_subFollows] ] )
    .on("end", brushended_subFollows)

  // Add a clipPath (subFollows): everything out of this area won't be drawn.
  var clip_subFollows = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip_subFollows")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height_subFollows)
    .attr("x", 0)
    .attr("y", 0);

  // Create the line svg (subFollows): where both the line and the brush take place
  var svg_line_subFollows = svg.append('g')
    .attr("clip-path", "url(#clip_subFollows)")
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")

  // Add line (subFollows)
  svg_line_subFollows.append("path")
    .datum(followers_zip)
    .attr("class", "line_subFollows")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", drawLine_subFollows)
    .attr("opacity", currentMode==="byHighlights" || currentMode==="byNone" ? 1 : 0.5)

  // Add activity area (subFollows)
  activityList_data.forEach(activity => {
    svg_line_subFollows.append("path")
      .datum(activity.data.filter(d => d.timeStreamed % 1 == 0))
      .attr("class", d => "area_subFollows_activity " + cleanString(activity.game) + " " + cleanString(activity.game) + "-" + activity.timeStreamed)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill", colorDict[cleanString(activity.game)])
      .attr("d", drawarea_subFollows)
      .style("display", currentMode==="byActivity" ? null : "none")
  })

  // Add sleepAwake area (subFollows)
  sleepAwakeList_data.forEach(item => {
    svg_line_subFollows.append("path")
      .datum(item.data.filter(d => d.timeStreamed % 1 == 0))
      .attr("class", d => "area_subFollows_sleepAwake " + item.sleepAwake + " " + item.sleepAwake + "-" + item.timeStreamed)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill", colorSleepAwake[item.sleepAwake])
      .attr("d", drawarea_subFollows)
      .style("display", currentMode==="byLudwigModcast" ? null : "none")
  })

  // Add timeHour area (subFollows)
  timeHourList_data.forEach(item => {
    svg_line_subFollows.append("path")
      .datum(item.data.filter(d => d.timeStreamed % 1 == 0))
      .attr("class", d => "area_subFollows_timeHour " + "time" + item.timeHour + " " + "time" + item.timeHour + "-" + item.timeStreamed)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill", colorTimeHour[item.timeHour])
      .attr("d", drawarea_subFollows)
      .style("display", currentMode==="byTime" ? null : "none")
  })

  // Add brush (subFollows)
  svg_line_subFollows.append("g")
    .attr("class", "brush_subFollows")
    .call(brush_subFollows)
    .on('mousemove', mousemoveFocus)
    .on('mouseout', mouseoutFocus);

  /* --- Brush + Line Clip FUNCTIONS --- */

  function idled() {
    idleTimeout = null;
  }

  function brushended_timeLeft() {
    var brushBounds = d3.event.selection;
    if (!brushBounds) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      // scale axes
      scaleDomain("original")
      // reset treemap/legends
      redraw(subathonStartDate, subathonEndDate, "datetime")
    } 
    else {
      // do not move this -- must be before xScale domain shift!
      var newStart = [brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft)[0]; 
      var newEnd = [brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft)[1];

      // scale axes
      scaleDomain("transformed", brushBounds)

      // clear brush grey area
      svg_line_timeLeft.select(".brush_timeLeft").call(brush_timeLeft.move, null);

      // update treemap/legends
      redraw(newStart, newEnd, "hour")
    }
    zoom_timeLeft();
    zoom_viewers();
    zoom_subFollows();
  }

  function brushended_viewers() {
    var brushBounds = d3.event.selection;
    if (!brushBounds) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      // scale axes
      scaleDomain("original")
      // reset treemap/legends
      redraw(subathonStartDate, subathonEndDate, "datetime")
    } else {
      // do not move this -- must be before xScale domain shift!
      var newStart = [brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers)[0]; 
      var newEnd = [brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers)[1];

      // scale axes
      scaleDomain("transformed", brushBounds)
      
      // clear brush grey area
      svg_line_viewers.select(".brush_viewers").call(brush_viewers.move, null);

      // update treemap/legends
      redraw(newStart, newEnd, "hour")
    }
    zoom_timeLeft();
    zoom_viewers();
    zoom_subFollows();
  }

  function brushended_subFollows() {
    var brushBounds = d3.event.selection;
    if (!brushBounds) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      // scale axes
      scaleDomain("original")
      // reset treemap/legends
      redraw(subathonStartDate, subathonEndDate, "datetime")
    } else {
      // do not move this -- must be before xScale domain shift!
      var newStart = [brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows)[0]; 
      var newEnd = [brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows)[1];

      // scale axes
      scaleDomain("transformed", brushBounds)
      
      // clear brush grey area
      svg_line_subFollows.select(".brush_subFollows").call(brush_subFollows.move, null);

      // update treemap/legends
      redraw(newStart, newEnd, "hour")
    }
    zoom_timeLeft();
    zoom_viewers();
    zoom_subFollows();
  }

  function scaleDomain(type, brushBounds=null){
    if(type==="original"){
      xScale_timeLeft.domain(xDomain_timeLeft);
      yScale_timeLeft.domain(yDomain_timeLeft);
      xScale_viewers.domain(xDomain_viewers);
      yScale_viewers.domain(yDomain_viewers);
      xScale_subFollows.domain(xDomain_subFollows);
      yScale_subFollows.domain(yDomain_subFollows);
    }
    else if(type==="transformed"){
      // timeLeft
      var i0_timeLeft = bisectHour(timeLeftJson_zip, xScale_timeLeft.invert(brushBounds[0]), 1),
          i1_timeLeft = bisectHour(timeLeftJson_zip, xScale_timeLeft.invert(brushBounds[1]), 1),
          yMax_timeLeft = d3.max(timeLeftJson_zip.slice(i0_timeLeft, i1_timeLeft+1).map(d => d.timeLeft))
      // viewers
      var i0_viewers = bisectHour(viewers_zip, xScale_viewers.invert(brushBounds[0]), 1),
          i1_viewers = bisectHour(viewers_zip, xScale_viewers.invert(brushBounds[1]), 1),
          yMax_viewers = d3.max(viewers_zip.slice(i0_viewers, i1_viewers+1).map(d => d.numViewers))
      // subFollows
      var i0_subFollows = bisectHour(followers_zip, xScale_subFollows.invert(brushBounds[0]), 1),
          i1_subFollows = bisectHour(followers_zip, xScale_subFollows.invert(brushBounds[1]), 1),
          yMax_subFollows = d3.max(followers_zip.slice(i0_subFollows, i1_subFollows+1).map(d => d.gainedFollowers))

      // update domain for line graphs
      xScale_timeLeft.domain([brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft));
      yScale_timeLeft.domain([0, yMax_timeLeft]);
      xScale_viewers.domain([brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers));
      yScale_viewers.domain([0, yMax_viewers]);
      xScale_subFollows.domain([brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows));
      yScale_subFollows.domain([0, yMax_subFollows]);
    }
  }

  function zoom_timeLeft() {
    var t = svg.transition().duration(750);
    svg.select(".axis--x--timeLeft").transition(t).call(xAxis_timeLeft);
    svg.select(".axis--y--timeLeft").transition(t).call(yAxis_timeLeft);
    svg_line_timeLeft.selectAll(".line_timeLeft").transition(t).attr("d", drawLine_timeLeft);
    svg_line_timeLeft.selectAll(".area_timeLeft_activity").transition(t).attr("d", drawarea_timeLeft);
    svg_line_timeLeft.selectAll(".area_timeLeft_sleepAwake").transition(t).attr("d", drawarea_timeLeft);
    svg_line_timeLeft.selectAll(".area_timeLeft_timeHour").transition(t).attr("d", drawarea_timeLeft);
    svg_line_timeLeft.selectAll("circle").transition(t)
      .attr("cx", d => xScale_timeLeft(d.timeStreamed))
      .attr("cy", d => yScale_timeLeft(d.timeLeft));
    svg_line_timeLeft.selectAll("text").transition(t)
      .attr("x", d => xScale_timeLeft(d.timeStreamed))
      .attr("y", d => yScale_timeLeft(d.timeLeft)-12);
  }

  function zoom_viewers() {
    var t = svg.transition().duration(750);
    svg.select(".axis--x--viewers").transition(t).call(xAxis_viewers);
    svg.select(".axis--y--viewers").transition(t).call(yAxis_viewers);
    svg_line_viewers.selectAll(".line_viewers").transition(t).attr("d", drawLine_viewers);
    svg_line_viewers.selectAll(".area_viewers_activity").transition(t).attr("d", drawarea_viewers);
    svg_line_viewers.selectAll(".area_viewers_sleepAwake").transition(t).attr("d", drawarea_viewers);
    svg_line_viewers.selectAll(".area_viewers_timeHour").transition(t).attr("d", drawarea_viewers);
  }

  function zoom_subFollows() {
    var t = svg.transition().duration(750);
    svg.select(".axis--x--subFollows").transition(t).call(xAxis_subFollows);
    svg.select(".axis--y--subFollows").transition(t).call(yAxis_subFollows);
    svg_line_subFollows.selectAll(".line_subFollows").transition(t).attr("d", drawLine_subFollows);
    svg_line_subFollows.selectAll(".area_subFollows_activity").transition(t).attr("d", drawarea_subFollows);
    svg_line_subFollows.selectAll(".area_subFollows_sleepAwake").transition(t).attr("d", drawarea_subFollows);
    svg_line_subFollows.selectAll(".area_subFollows_timeHour").transition(t).attr("d", drawarea_subFollows);
  }

  /* --- Information Tooltip DEFINITIONS --- */

  // Create tooltip
  var info_block = d3.select("#info-viz")
    .append("div")
    .attr("class", "info_block")
    .style("background-color", "white")
    //.style("border", "solid")
    //.style("border-width", "1px")
    //.style("border-radius", "5px")
    .style("padding", "10px")
    //.style("margin-bottom", "10px")
    .style("width", "400px")

  info_block
    .html(
      "<div class='info_block'>"
      +
      "<b>What are these visualizations?</b>" 
      + 
      "<br><br>"
      +
      "On March 14, 2021, Twitch streamer, <a href='https://www.twitch.tv/ludwig' target='_blank'>Ludwig Ahgren</a>, started a subathon for which every new subscriber would add 10 seconds to the length of his stream. Due to overwhelming support from the Twitch community, the stream ended up lasting 31 days. During this time, Ludwig gained over 970k new followers and 250k new subscribers, enabling him to ultimately surpass <a href='https://twitchtracker.com/subscribers/all-time' target='_blank'>Ninja's record</a> for \"Most Concurrent Twitch Subscribers\" by hitting 280k+ subscribers at peak. I created an interactive visualization for viewers interested in learning more about activity statistics and stream highlights during this record-breaking event." 
      + 
      "<br><br>"
      +
      "To learn more about the subathon, check out this <a href='https://www.businessinsider.com/ludwig-streaming-smash-stop-how-much-money-subathon-ended-twitch-2021-4' target='_blank'>article</a>." 
      + 
      "<p>Data Credits To: \
          <ul> \
            <li><a href='https://docs.google.com/spreadsheets/d/e/2PACX-1vThvKnVHDeF0iGgL7Bkx6wz_SE2hh2RvxzqEHyqtZvR3H0DXuOwwh5MdwnbzMYvluul97ld364VANqm/pubhtml#' target='_blank'>baddog86, smartax1111, itzdanbarz, and ogsheeper</a></li> \
            <li><a href='https://sullygnome.com/channel/ludwig' target='_blank'>SullyGnome</a></li> \
          </ul> \
        </p> \
        <p> \
          Want to add an event highlight? Submit a video link <a href='https://forms.gle/w1TgFZHr8MpF9Ti9A' target='_blank'>here</a>! \
        </p>"
      +
      "</div>"
      ) 

  /* --- Events Tooltip DEFINITIONS --- */

  // initial event video
  const initialEventIndex = 5
  const initialEvent = highlights_zip[initialEventIndex]

  // Create tooltip
  var events_block = d3.select("#events-viz")
    .append("div")
    .attr("class", "events_block")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    //.style("border-radius", "5px")
    .style("padding", "10px")
    .style("width", "400px")

  // Show tooltip (show the first highlight event)
  events_block
    .html("<div class='events_block'>" + "<b>Event Highlight</b>" + "<br><br>" + initialEvent.title + "<br>" + formatDatetime(initialEvent.datetime) + " EST" + " (<a href='" + initialEvent.url + "' target='_blank'>video</a>)" + "<br><br>" + getHtmlEmbed(initialEvent.type, initialEvent.embed, parentDomain) + "<br></div>") 
    .style("display", currentMode==="byHighlights" ? null : "none")

  // Add nodes (event highlights)
  svg_line_timeLeft.selectAll(".dot-events")
    .data(highlights_zip)
    .enter().append("circle")
    .attr("class", "dot-events")
    .attr("id", d => "dot-events-" + d.id)
    .attr("cx", d => xScale_timeLeft(d.timeStreamed))
    .attr("cy", d =>  yScale_timeLeft(d.timeLeft))
    .attr("r", (d, i) => 6)
    .style("fill", "#fcb0b5")
    .style("display", currentMode==="byHighlights" ? null : "none")
    .on("mouseover", mouseover_events)

  // add color to first event example
  svg_line_timeLeft.selectAll("#dot-events-" + initialEventIndex)
    .style("fill", "#d30715")

  // add text to first event example
  svg_line_timeLeft.selectAll(".tooltip-events")
    .data([initialEvent])
    .enter()
      .append("text")
      .attr("class", "tooltip-events")
      .text(initialEvent.title)
      .attr("x", d => xScale_timeLeft(d.timeStreamed))
      .attr("y", d => yScale_timeLeft(d.timeLeft)-12)
      .style("display", currentMode==="byHighlights" ? null : "none")

  /* --- Events Legend --- */

  // legend settings

  const legendDotSize_events = 6
  const svg_legend_events = svg.append("g")
  const eventsList_unique = ["Event Highlight"]

  // color 

  const legendColor_events = svg_legend_events.selectAll(".events_legend_colors").data(eventsList_unique)

  legendColor_events
    .exit()
    .remove()

  legendColor_events
    .enter()
    .append("circle")
      .attr("class", d => "events_legend_colors")
      .attr("cx", 640)
      .attr("cy", 0) 
      .attr("r", legendDotSize_events)
      .style("fill", "#fcb0b5")
      .style("display", currentMode==="byHighlights" ? null : "none")
  // text

  const legendText_events = svg_legend_events.selectAll(".events_legend_text").data(eventsList_unique)

  legendText_events
    .exit()
    .remove()

  legendText_events
    .enter()
    .append("text")
      .attr("class", d => "events_legend_text")
      .attr("x", 640 + legendDotSize_events*1.5)
      .attr("y", 0) // 100 is where the first dot appears. 25 is the distance between dots
      .style("fill", "#fcb0b5")
      .text(function(d){ return d})
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")
      .style("display", currentMode==="byHighlights" ? null : "none")

  /* --- Events Tooltip FUNCTIONS --- */

  // create embed html
  function getHtmlEmbed(type, embed, parentDomain){
    var htmlEmbed;
    if (type=="twitch clip"){
      htmlEmbed = "<iframe src='" + embed + parentDomain + "' frameborder='0' allowfullscreen='true' scrolling='no' height='300' width='400'></iframe>"
    }else if(type=="youtube"){
      htmlEmbed = "<iframe src='" + embed + "' frameborder='0' allowfullscreen='true' scrolling='no' height='300' width='400'></iframe>"
    }
    return htmlEmbed
  }

  function mouseover_events(d, i){
    if (currentMode==="byHighlights"){
      //clear previous 
      svg_line_timeLeft.selectAll(".dot-events").style("fill", "#fcb0b5");
      svg_line_timeLeft.selectAll(".tooltip-events").remove();

      // add color and text to current
      d3.select(this).transition().duration(100).style("fill", "#d30715");
      svg_line_timeLeft.selectAll(".tooltip-events").data([d]).enter()
        .append("text")
        .attr("class", "tooltip-events")
        .text(d.title)
        .attr("x", d => xScale_timeLeft(d.timeStreamed))
        .attr("y", d => yScale_timeLeft(d.timeLeft)-12)

      // update tooltip
      events_block
        .html("<div class='events_block'>" + "<b>Event Highlight</b>" + "<br><br>" + d.title + "<br>" +formatDatetime(d.datetime) + " EST" + " (<a href='" + d.url + "' target='_blank'>video</a>)" + "<br><br>" + getHtmlEmbed(d.type, d.embed, parentDomain) + "<br></div>") 
    }
  }

  /* --- Pie Chart FUNCTIONS --- */

  // Color settings
  const highOpacity_piechart = 0.7

  // What to do when one group is hovered
  const mouseover_piechart = function(d){
    if (currentMode==="byTime"){
      // only do stuff if the key is relevvant
      if(piechart_keys.includes(d.index)){
        // reduce opacity of all groups
        svg_line_timeLeft.selectAll(".area_timeLeft_timeHour").style("opacity", lowOpacity)
        svg_line_viewers.selectAll(".area_viewers_timeHour").style("opacity", lowOpacity)
        svg_line_subFollows.selectAll(".area_subFollows_timeHour").style("opacity", lowOpacity)
        svg.selectAll(".timeHour_legend_colors").style("opacity", lowOpacity)
        svg.selectAll(".timeHour_legend_text").style("opacity", lowOpacity)
        svg_piechart.selectAll(".pieSlice").style("opacity", lowOpacity)
        svg_piechart.selectAll(".pieText").style("opacity", lowOpacity)
        // expect the one that is hovered
        svg_line_timeLeft.selectAll(".time" + d.index).style("opacity", highOpacity)
        svg_line_viewers.selectAll(".time" + d.index).style("opacity", highOpacity)
        svg_line_subFollows.selectAll(".time" + d.index).style("opacity", highOpacity)
        svg.selectAll(".legendColor-" + d.index).style("opacity", highOpacity)
        svg.selectAll(".legendText-" + d.index).style("opacity", highOpacity)
        svg_piechart.selectAll(".pieSlice-" + d.index).style("opacity", highOpacity_piechart)
        svg_piechart.selectAll(".pieText-" + d.index).style("opacity", highOpacity_piechart)
      }
    }
  }

  const mouseleave_piechart = function(d){
    if (currentMode==="byTime"){
      svg_line_timeLeft.selectAll(".area_timeLeft_timeHour").style("opacity", highOpacity)
      svg_line_viewers.selectAll(".area_viewers_timeHour").style("opacity", highOpacity)
      svg_line_subFollows.selectAll(".area_subFollows_timeHour").style("opacity", highOpacity)
      svg.selectAll(".timeHour_legend_colors").style("opacity", highOpacity)
      svg.selectAll(".timeHour_legend_text").style("opacity", highOpacity)
      // only show the one that is hovered
      svg_piechart.selectAll(".pieSlice").style("opacity", lowOpacity)
      svg_piechart.selectAll(".pieText").style("opacity", lowOpacity)
      piechart_keys.forEach(key => {
        svg_piechart.selectAll(".pieSlice-" + key).style("opacity", highOpacity_piechart)
        svg_piechart.selectAll(".pieText-" + key).style("opacity", highOpacity_piechart)
      })
    }
  }

  /* --- Pie Chart DEFINITIONS --- */

  // Create piechart data
  var piechart_data = {"12 AM":1, "1 AM":1, "2 AM":1, "3 AM":1, "4 AM":1, "5 AM":1, "6 AM":1, "7 AM":1, "8 AM":1, "9 AM":1, "10 AM":1, "11 AM":1, "12 PM":1, "1 PM":1, "2 PM":1, "3 PM":1, "4 PM":1, "5 PM":1, "6 PM":1, "7 PM":1, "8 PM":1, "9 PM":1, "10 PM":1, "11 PM":1}

  var piechart_keys = [...Array(24).keys()];; // will change depending on what's available

  // Compute the position of each group on the pie:
  var piechart = d3.pie().value(d => d.value)
  var piechart_data_ready = piechart(d3.entries(piechart_data))

  // shape helper to build arcs:
  var arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(radius_piechart)

  // shape helper to build arcs:
  var arcLabel = d3.arc()
    .innerRadius(0)
    .outerRadius(radius_piechart*1.65)

  // hide/unhide piechart on initialization
  d3.selectAll("#piechart-viz").style("display", currentMode==="byTime" ? null : "none");

  svg_piechart
    .selectAll('pieSlice')
    .data(piechart_data_ready)
    .enter()
    .append('path')
      .attr("class", d => "pieSlice pieSlice-" + d.index)
      .attr('d', arcGenerator)
      .attr('fill', d => colorTimeHour[timeHourToText.indexOf(d.data.key)])
      .attr("stroke", "black")
      .style("stroke-width", "2px")
      .style("opacity", 0.7)
      .on("mouseover", mouseover_piechart)
      .on("mouseleave", mouseleave_piechart)

  svg_piechart
    .selectAll('pieText')
    .data(piechart_data_ready)
    .enter()
    .append('text')
      .attr("class", d => "pieText pieText-" + d.index)
      .text(d => d.data.key.replace(/\s/g, ''))
      .attr("transform", d => "translate(" + arcLabel.centroid(d) + ")")
      .style("text-anchor", "middle")
      .style("font-size", 10)
      .style("display", currentMode==="byTime" ? null : "none")
      .on("mouseover", mouseover_piechart)
      .on("mouseleave", mouseleave_piechart)

  /* --------------------------------------------- */
  // RADIO TOGGLE

  function clearModeExcept(mode){
    // remove the following modes
    if(mode!=="byHighlights"){
      svg_line_timeLeft.selectAll(".line_timeLeft")
        .style("opacity", 0.5)
      svg_line_viewers.selectAll(".line_viewers")
        .style("opacity", 0.5)
      svg_line_subFollows.selectAll(".line_subFollows")
        .style("opacity", 0.5)

      d3.selectAll(".dot-events").style("display","none");
      d3.selectAll(".tooltip-events").style("display","none");
      events_block.style("display","none");

      d3.selectAll(".events_legend_colors").style("display","none");
      d3.selectAll(".events_legend_text").style("display","none");

      // unhide treemap
      d3.selectAll("#treemap-viz").style("display",null);
    }

    if(mode!=="byActivity"){
      d3.selectAll(".area_timeLeft_activity").style("display","none");
      d3.selectAll(".area_viewers_activity").style("display","none");
      d3.selectAll(".area_subFollows_activity").style("display","none");

      d3.selectAll(".activity_legend_colors").style("display","none");
      d3.selectAll(".activity_legend_text").style("display","none");

      d3.selectAll(".rect-activity").style("display","none");
      d3.selectAll(".title-activity").style("display","none");
      d3.selectAll(".percent-activity").style("display","none");
    }

    if(mode!=="byLudwigModcast"){
      d3.selectAll(".area_timeLeft_sleepAwake").style("display","none");
      d3.selectAll(".area_viewers_sleepAwake").style("display","none");
      d3.selectAll(".area_subFollows_sleepAwake").style("display","none");

      d3.selectAll(".sleepAwake_legend_colors").style("display","none");
      d3.selectAll(".sleepAwake_legend_text").style("display","none");

      d3.selectAll(".rect-sleepAwake").style("display","none");
      d3.selectAll(".title-sleepAwake").style("display","none");
      d3.selectAll(".percent-sleepAwake").style("display","none");
    }

    if(mode!=="byTime"){
      d3.selectAll(".area_timeLeft_timeHour").style("display","none");
      d3.selectAll(".area_viewers_timeHour").style("display","none");
      d3.selectAll(".area_subFollows_timeHour").style("display","none");

      d3.selectAll(".timeHour_legend_colors").style("display","none");
      d3.selectAll(".timeHour_legend_text").style("display","none");

      // hide piechart
      d3.selectAll("#piechart-viz").style("display","none");
      d3.selectAll(".pieSlice").style("display","none");
      d3.selectAll(".pieText").style("display","none");
    }

  }

  d3.selectAll(("input[name='mode']")).on("change", function(){

    currentMode = this.value
    clearModeExcept(currentMode);

    if(currentMode === "byHighlights"){
      // clear previous graphs
      svg_line_timeLeft.selectAll(".line_timeLeft")
        .style("opacity", 1)
      svg_line_viewers.selectAll(".line_viewers")
        .style("opacity", 1)
      svg_line_subFollows.selectAll(".line_subFollows")
        .style("opacity", 1)

      d3.selectAll(".dot-events").style("display",null);
      d3.selectAll(".tooltip-events").style("display",null);
      events_block.style("display",null);

      d3.selectAll(".events_legend_colors").style("display",null);
      d3.selectAll(".events_legend_text").style("display",null);

      // hide treemap
      d3.selectAll("#treemap-viz").style("display","none");
    }

    else if(currentMode === "byActivity"){
      d3.selectAll(".area_timeLeft_activity").style("display",null);
      d3.selectAll(".area_viewers_activity").style("display",null);
      d3.selectAll(".area_subFollows_activity").style("display",null);

      d3.selectAll(".activity_legend_colors").style("display",null);
      d3.selectAll(".activity_legend_text").style("display",null);

      d3.selectAll(".rect-activity").style("display",null);
      d3.selectAll(".title-activity").style("display",null);
      d3.selectAll(".percent-activity").style("display",null);
    }

    else if(currentMode === "byLudwigModcast"){
      d3.selectAll(".area_timeLeft_sleepAwake").style("display",null);
      d3.selectAll(".area_viewers_sleepAwake").style("display",null);
      d3.selectAll(".area_subFollows_sleepAwake").style("display",null);

      d3.selectAll(".sleepAwake_legend_colors").style("display",null);
      d3.selectAll(".sleepAwake_legend_text").style("display",null);

      d3.selectAll(".rect-sleepAwake").style("display",null);
      d3.selectAll(".title-sleepAwake").style("display",null);
      d3.selectAll(".percent-sleepAwake").style("display",null);
    }

    else if(currentMode === "byTime"){
      d3.selectAll(".area_timeLeft_timeHour").style("display",null);
      d3.selectAll(".area_viewers_timeHour").style("display",null);
      d3.selectAll(".area_subFollows_timeHour").style("display",null);

      d3.selectAll(".timeHour_legend_colors").style("display",null);
      d3.selectAll(".timeHour_legend_text").style("display",null);

      // hide treemap
      d3.selectAll("#treemap-viz").style("display","none");

      // unhide piechart
      d3.selectAll("#piechart-viz").style("display",null);
      d3.selectAll(".pieSlice").style("display",null);
      d3.selectAll(".pieText").style("display",null);
    }

    else if(currentMode === "byNone"){
      svg_line_timeLeft.selectAll(".line_timeLeft")
        .style("opacity", 1)
      svg_line_viewers.selectAll(".line_viewers")
        .style("opacity", 1)
      svg_line_subFollows.selectAll(".line_subFollows")
        .style("opacity", 1)
    }

  });

  /* --------------------------------------------- */
  // RESET BUTTON

  var resetButton = d3.select("#reset-button")
  resetButton
    .on("click", () => resetZoom());

  function resetZoom(){
    // reset domains
    scaleDomain("original")
    // reset line graphs
    zoom_timeLeft();
    zoom_viewers();
    zoom_subFollows();
    // reset treemap/legends
    redraw(subathonStartDate, subathonEndDate, "datetime")
  }

  // initialize legend and treemap
  redraw(subathonStartDate, subathonEndDate, "datetime")
};


/* ------------------------------------------------------------------- */
/* ------------------------------------------------------------------- */


// read json files
d3.queue()
  .defer(d3.json, "data/timeLeft.json")
  .defer(d3.json, "data/viewers.json")
  .defer(d3.json, "data/followers.json")
  .defer(d3.json, "data/highlights.json")
  .defer(d3.json, "data/gameImages.json")
  .defer(d3.json, "data/ludwigModcast.json")
  .await(createViz)
