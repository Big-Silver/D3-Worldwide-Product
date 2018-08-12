var width = 962,
    rotated = 90,
    height = 400;

var world_data = [],
    trans_data = [];

//countries which have states, needed to toggle visibility
//for USA/ etc. either show countries or states, not both
var usa, canada;
var states; //track states
//track where mouse was clicked
var initX;
//track scale only rotate when s === 1
var s = 1;
var mouseClicked = false;


var projection = d3.geo.mercator()
    .scale(153)
    .translate([width / 2, height / 1.5])
    .rotate([rotated, 0, 0]); //center on USA because 'murica

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 20])
    // .on("zoom", zoomed);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    //track where user clicked down
    .on("mousedown", function () {
        d3.event.preventDefault();
        //only if scale === 1
        if (s !== 1) return;
        initX = d3.mouse(this)[0];
        mouseClicked = true;
    })
    .on("mouseup", function () {
        if (s !== 1) return;
        rotated = rotated + ((d3.mouse(this)[0] - initX) * 360 / (s * width));
        mouseClicked = false;
    })
    .call(zoom);


function rotateMap(endX) {
    projection.rotate([rotated + (endX - initX) * 360 / (s * width), 0, 0])
    g.selectAll('path') // re-project path data
        .attr('d', path);
}
//for tooltip 
var offsetL = document.getElementById('tooltip').offsetLeft + 10;
var offsetT = document.getElementById('tooltip').offsetTop + 10;

var path = d3.geo.path()
    .projection(projection);

var tooltip = d3.select("#tooltip")
    .append("div")
    .attr("class", "tooltip hidden");

//need this for correct panning
var g = svg.append("g");

function showTooltip(d) {
    label = d.properties.name;
    var mouse = d3.mouse(svg.node())
        .map(function (d) {
            return parseInt(d);
        });
    tooltip.classed("hidden", false)
        .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
        .html(label);
}

function selected() {
    d3.select('.selected').classed('selected', false);
    d3.select(this).classed('selected', true);
    if (d3.select('.selected')[0] != null) {
        var country;
        var country_code = d3.select('.selected')[0][0].id;
        var countries = world_data.objects.countries.geometries;
        
        for (var i = 0; i < countries.length; i++) {
            if (countries[i].id == country_code) {
                country = countries[i].properties.name;
                getTransactionData(country, country_code);
            };
        };
    }
};


function zoomed() {
    var t = d3.event.translate;
    s = d3.event.scale;
    var h = 0;

    t[0] = Math.min(
        (width / height) * (s - 1),
        Math.max(width * (1 - s), t[0])
    );

    t[1] = Math.min(
        h * (s - 1) + h * s,
        Math.max(height * (1 - s) - h * s, t[1])
    );

    zoom.translate(t);
    if (s === 1 && mouseClicked) {
        rotateMap(d3.mouse(this)[0])
        return;
    }

    g.attr("transform", "translate(" + t + ")scale(" + s + ")");

    //adjust the stroke width based on zoom level
    d3.selectAll(".boundary")
        .style("stroke-width", 1 / s);

    //toggle state/USA visability
    // if (s > 1.5) {
    //     states
    //         .classed('hidden', false);
    //     usa
    //         .classed('hidden', true);
    //     canada
    //         .classed('hidden', true);
    // } else {
    //     states
    //         .classed('hidden', true);
    //     usa
    //         .classed('hidden', false);
    //     canada
    //         .classed('hidden', false);
    // }
};

function getTransactionData(id, code) {
    // console.log(trans_data)
    var selected_data = null;
    for (var i = 0; i < trans_data.length; i++) {
        if (trans_data[i].Country == id) {
            selected_data = trans_data[i];
        }
    };
    console.log(selected_data);
    if (selected_data != null) {
        var trans_dom = '';
        if (typeof selected_data.Merchandise != "undefined") {
            trans_dom += 
                `<div class="col-md-4 col-sm-12">
                    <img src="img/d3_1.png">
                    <p>Merchandise</p>
                    <img src="img/underline.png">
                </div>`;
        }
        if (typeof selected_data.Digital_Vouchers != "undefined") {
            trans_dom +=
                `<div class="col-md-4 col-sm-12">
                    <img src="img/d3_2.png">
                    <p>Digital Gift Card</p>
                    <img src="img/underline.png">
                </div>`;
        }
        if (typeof selected_data.Physical_Vouchers != "undefined") {
            trans_dom +=
                `<div class="col-md-4 col-sm-12">
                    <img src="img/d3_3.png">
                    <p>Physical Gift Card</p>
                    <img src="img/underline.png">
                </div>`;
        }
        $("#sel_country_trans").html("");
        $("#sel_country_trans").append(trans_dom);
    } else {
        $("#sel_country_trans").html("");
    }
    var country_dom = 
            `<span class="d-flex justify-content-center">
                <h3>${id}</h3>
                <p>(${code})</p>
            </span>`;
    $("#sel_country_name").html("");
    $("#sel_country_name").append(country_dom);
};

//det json data and draw it
d3.json("combined2.json", function (error, world) {
    if (error) return console.error(error);
    world_data = world;
    
    //countries
    g.append("g")
        .attr("class", "boundary")
        .selectAll("boundary")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("name", function (d) {
            return d.properties.name;
        })
        .attr("id", function (d) {
            return d.id;
        })
        .on('click', selected)
        .on("mousemove", showTooltip)
        .on("mouseout", function (d, i) {
            tooltip.classed("hidden", true);
        })
        .attr("d", path);

    usa = d3.select('#USA');
    canada = d3.select('#CAN');

    //states
    g.append("g")
        .attr("class", "boundary state hidden")
        .selectAll("boundary")
        .data(topojson.feature(world, world.objects.states).features)
        .enter().append("path")
        .attr("name", function (d) {
            return d.properties.name;
        })
        .attr("id", function (d) {
            return d.id;
        })
        .on('click', selected)
        .on("mousemove", showTooltip)
        .on("mouseout", function (d, i) {
            tooltip.classed("hidden", true);
        })
        .attr("d", path);

    states = d3.selectAll('.state');
});

$(document).ready(function(){
    $.ajax({url: "../data.json", success: function(result){
        trans_data = result.data;
    },
    fail: function(fail) {
        console.log('fail ====> ', fail);
    }});
});