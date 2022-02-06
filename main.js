let toggleNavStatus = false;

let toggleNav = function() {
  let getSidebar = document.querySelector(".nav-sidebar");
  let getSidebarUl = document.querySelector(".nav-sidebar ul");
  let getSidebarTitle = document.querySelector(".nav-sidebar span");
  let getSidebarLinks = document.querySelectorAll(".nav-sidebar a");

  if (toggleNavStatus === false) {
    getSidebarUl.style.visibility = "visible";
    getSidebar.style.width = "300px";
    getSidebarTitle.style.opacity = "0.5";
    getSidebar.style["background-color"]="#1b1b1b";

    let arrayLength = getSidebarLinks.length;
    for (let i = 0; i < arrayLength; i++) {
      getSidebarLinks[i].style.opacity = "1";
    }

    toggleNavStatus = true;
  }

  else if (toggleNavStatus === true) {
    getSidebar.style.width = "50px";
    getSidebarTitle.style.opacity = "0";
    getSidebar.style["background-color"]="transparent";

    let arrayLength = getSidebarLinks.length;
    for (let i = 0; i < arrayLength; i++) {
      getSidebarLinks[i].style.opacity = "0";
    }

    getSidebarUl.style.visibility = "hidden";

    toggleNavStatus = false;
  }

}

function setQuery(evt) {
  if (evt.keyCode == 13) { // enter key
    console.log(searchbox.value)
    getResults(searchbox.value)
  }
}

function getResults(query) { // i.e. London

  fetch(`${api.base}weather?q=${query}&units=imperial&APPID=${api.key}`)
  .then(weather => {
    return weather.json();
  }).then(displayResults);

}

function getForecastResults(lon, lat) { // i.e. London

  fetch(`${api.base}onecall?lat=${lat}&lon=${lon}&units=imperial&appid=${api.key}`)
  .then(forecast => {
    return forecast.json();
  }).then(displayForecastResults);
}

function displayForecastResults(forecast) {
  console.log("Calling createTooltipFromApi")
  createTooltipFromApi(forecast);
}

function createTooltipFromApi(forecast) {
  let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday","Friday", "Saturday"];

  forecast.daily.forEach(function(d) {
      d["date"] = new Date(d.dt*1000);
      d["day"] = days[new Date(d.dt*1000).getDay()];
      d["high"] = d.temp.max;
      d["low"] = d.temp.min;
      d["text"] = d.weather[0].main;
  });

  console.log("Here's the 7 day forecast json':")
  console.log(forecast)

  let daily_forecast = forecast.daily;

  d3.select("svg").remove();
  createLineChart(daily_forecast)
}

function createLineChart(daily_forecast) {
  // set the dimensions and margins of the graph
  var margin = {top: 75, right: 150, bottom: 100, left: 150},
      width = 1400 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var colorScale = d3.scaleThreshold().range(["red", "blue"]);

  // parse the date / time
  var parseTime = d3.timeParse("%d %b %Y");

  // set the ranges
  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);

  // define the 1st line
  var valueline = d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.low); });

  // define the 2nd line
  var valueline2 = d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.high); });

  var div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


  function movetooltip(d) {
    div.style("left", (d3.event.pageX + 20) + "px")
      .style("top", (d3.event.pageY + 20) + "px");
  }

  function hidetooltip(d) {
    div.transition()
      .duration(200)
      .style("opacity", 0);
  }

  // Scale the range of the data
  x.domain(d3.extent(daily_forecast, function(d) { return d.date; }));
  y.domain([0, d3.max(daily_forecast, function(d) {
  return Math.max(d.high, d.low); })]);

  // Add the valueline path.
  svg.append("path")
    .data([daily_forecast])
    .attr("class", "line")
    .attr("d", valueline);

  // Add the valueline2 path.
  svg.append("path")
    .data([daily_forecast])
    .attr("class", "line")
    .style("stroke", "red")
    .attr("d", valueline2);

  // Add the X Axis
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .attr("color", "white");

  // Add the Y Axis
  svg.append("g")
    .call(d3.axisLeft(y))
    .attr("color", "white");;

  //also add the legend
  svg.append("g")
   .attr("class", "legend")
   .attr("transform", "translate(" + (width+20) + ", " + (0) + ")");

  var legend = d3.legendColor()
            .scale(colorScale)
            .title("Heat Legend")
            .labels(["High", "Low"])
            //.labels(d3.legendHelpers.thresholdLabels)
            .labelFormat(d3.format('.2f'));
  d3.select(".legend").call(legend);

  // add the dots with tooltips
  svg.selectAll("dot")
   .data(daily_forecast)
  .enter().append("circle")
   .attr("r", 5)
   .attr("cx", function(d) { return x(d.date); })
   .attr("cy", function(d) { return y(d.high); })
   .on("mouseover", function(d) {
     div.transition()
       .duration(200)
       .style("opacity", .9);
     div.html(
       "<b>Day</b>: " + d.day + "<br />"
      +"<b>High</b>: " + d.high + "<br />"
      +"<b>Low</b>: " + d.low + "<br />"
      +"<b>Weather</b>: " + d.text + "<br />")
       .style("left", (d3.event.pageX) + "px")
       .style("top", (d3.event.pageY - 28) + "px");
     })
   .on("mousemove", (d) => { movetooltip(d) })
   .on("mouseleave", (d) => { hidetooltip(d) });

   svg.selectAll("dot")
      .data(daily_forecast)
    .enter().append("circle")
      .attr("r", 5)
      .attr("cx", function(d) { return x(d.date); })
      .attr("cy", function(d) { return y(d.low); })
      .on("mouseover", function(d) {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html(
          "<b>Day</b>: " + d.day + "<br />"
         +"<b>High</b>: " + d.high + "<br />"
         +"<b>Low</b>: " + d.low + "<br />"
         +"<b>Weather</b>: " + d.text + "<br />")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        })
      .on("mousemove", (d) => { movetooltip(d) })
      .on("mouseleave", (d) => { hidetooltip(d) });

    svg.append('text')
        .attr('class', 'title')
        .attr('x', width / 2)
        .attr('y', (margin.top-100)/2)
        .attr('text-anchor', 'middle')
        .text('7 Day Weather Forecast ');

    console.log("done")
}

function parseHomePage(weather){
  let city = document.querySelector('.location .city');
  getForecastResults(weather.coord.lon, weather.coord.lat);
  city.innerText = `${weather.name}, ${weather.sys.country}`;

  let now = new Date();
  let date = document.querySelector('.location .date');
  date.innerText = dateBuilder(now);

  let temp = document.querySelector('.current .temp');
  temp.innerHTML = `${Math.round(weather.main.temp)}<span>°F</span>`;

  let weather_el = document.querySelector('.current .weather');
  weather_el.innerText = weather.weather[0].main;

  let hilow = document.querySelector('.hi-low');
  hilow.innerText = `${Math.round(weather.main.temp_min)}°F /${Math.round(weather.main.temp_max)}°F`
}

function parseWindSpeed(weather) {
  let city = document.querySelector('.location .city');
  city.innerText = `${weather.name}, ${weather.sys.country}`;

  let now = new Date();
  let date = document.querySelector('.location .date');
  date.innerText = dateBuilder(now);

  let wind = document.querySelector('.current_wind_speed .wind_speed');
  wind.innerHTML = `${weather.wind.speed}<span> mph</span>`;
}

function parseHumidity(weather) {
  let city = document.querySelector('.location .city');
  city.innerText = `${weather.name}, ${weather.sys.country}`;

  let now = new Date();
  let date = document.querySelector('.location .date');
  date.innerText = dateBuilder(now);

  let humidity = document.querySelector('.current_humidity .humidity');
  humidity.innerHTML = `${weather.main.humidity}<span> %</span>`;
}

function parsePressure(weather) {
  let city = document.querySelector('.location .city');
  city.innerText = `${weather.name}, ${weather.sys.country}`;

  let now = new Date();
  let date = document.querySelector('.location .date');
  date.innerText = dateBuilder(now);

  let pressure = document.querySelector('.current_pressure .pressure');
  pressure.innerHTML = `${weather.main.pressure} <span> in</span>`;
}

function getSunInfo(weather, type) {
  if (type == "sunrise") {
    console.log("Type is " + type)
    var sun = weather.sys.sunrise;
  }
  else if (type == "sunset"){
    var sun = weather.sys.sunset;
  }
  let date = new Date(sun * 1000);
  let hours = date.getHours();
  let minutes = "0" + date.getMinutes();
  let seconds = "0" + date.getSeconds();

  let sun_time_str = hours +  ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

  return sun_time_str;
}

function parseSun(weather) {
  let city = document.querySelector('.location .city');
  city.innerText = `${weather.name}, ${weather.sys.country}`;

  let now = new Date();
  let date = document.querySelector('.location .date');
  date.innerText = dateBuilder(now);

  let sun = document.querySelector('.current_sun .sun');
  let sunrise_utc = getSunInfo(weather, "sunrise");
  let sunset_utc = getSunInfo(weather, "sunset");

  sun.innerText = `${sunrise_utc} am /  ${sunset_utc} pm`
}

function displayResults(weather) {
  console.log(weather);
  if (document.URL.includes("wind_speed.html")) {
    parseWindSpeed(weather);
  }
  else if (document.URL.includes("humidity.html")) {
    parseHumidity(weather);
  }
  else if (document.URL.includes("pressure.html")) {
    parsePressure(weather);
  }
  else if (document.URL.includes("sun.html")) {
    parseSun(weather);
  }
  else {
    parseHomePage(weather);
  }
}

function dateBuilder(d) {
  let months = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
  let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday","Friday", "Saturday"];

  let day = days[d.getDay()];
  let date = d.getDate();
  let month = months[d.getMonth()];
  let year = d.getFullYear();

  return `${day} ${date} ${month} ${year}`

}

function create7DayForecast() {
  // parse the date / time
  var parseTime = d3.timeParse("%d %b %Y");

  // Get the data
  d3.json("weather.json").then(function(data) {

    var forecast = data.query.results.channel.item.forecast.slice(0, 8);

    // format the data
    forecast.forEach(function(d) {
        d.date = parseTime(d.date);
    });

    console.log(forecast);
    createLineChart(forecast);
  });

}

function addDefaultJsonEntries() {
  d3.json("weather.json").then(function(data) {
    var defaults = data.query.results.channel;
    let city = document.querySelector('.location .city');
    city.innerText = `${defaults.location.city}, ${defaults.location.country}`;

    let now = new Date();
    let date = document.querySelector('.location .date');
    date.innerText = dateBuilder(now);

    if (document.URL.includes("wind_speed.html")) {
      console.log(defaults.wind.speed)
      let wind = document.querySelector('.current_wind_speed .wind_speed');
      wind.innerHTML = `${defaults.wind.speed} <span> ${defaults.units.speed}</span>`;
    }
    else if (document.URL.includes("humidity.html")) {
      let humidity = document.querySelector('.current_humidity .humidity');
      humidity.innerHTML = `${defaults.atmosphere.humidity}<span> %</span>`;
    }
    else if (document.URL.includes("pressure.html")) {
      let pressure = document.querySelector('.current_pressure .pressure');
      pressure.innerHTML = `${defaults.atmosphere.pressure}<span> ${defaults.units.pressure}</span>`;
    }
    else if (document.URL.includes("sun.html")) {
      let sun = document.querySelector('.current_sun .sun');
      sun.innerText = `${defaults.astronomy.sunrise} / ${defaults.astronomy.sunset}`;
    }
    else {
      let temp = document.querySelector('.current .temp');
      temp.innerHTML = `${defaults.item.condition.temp}<span>°${defaults.units.temperature}</span>`;

      let weather_el = document.querySelector('.current .weather');
      weather_el.innerText = defaults.item.condition.text;

      let hilow = document.querySelector('.hi-low');
      hilow.innerText = `${defaults.item.forecast[0].low}°${defaults.units.temperature} /${defaults.item.forecast[0].high}°${defaults.units.temperature}`;
    }
  });
}

create7DayForecast();
addDefaultJsonEntries();

const api = {
              key: "00a61b8ed59bbb7895f2da90e3c951fb",
              base: "https://api.openweathermap.org/data/2.5/"
            };
const searchbox = document.querySelector('.search-box');
searchbox.addEventListener('keypress',setQuery);
