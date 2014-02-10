
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var sass = require('node-sass');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(sass.middleware({
    src: __dirname + '/sass',
    dest: __dirname + '/public',
    debug: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/track', function(req, res) {
    var url = req.query.url;
    console.log("Received update url: " + url);
    var data = {
        heroesPlayed: [],
        heroesRemaining: []
    };

    // request dotabuff data
    var dotabuffMatch = /^(?:http:\/\/)?dotabuff\.com\/players\/(\d+)$/.exec(url);
    try {
        if (dotabuffMatch && dotabuffMatch[1]) {
            var playerId = dotabuffMatch[1];
            console.log("Parsed dotabuff url, playerId: " + playerId);

            // setup two async requests in parallel
            var asyncTasks = [];
            asyncTasks.push(function(callback) {
                // Get the players hero page
                var options = {
                    url: "http://dotabuff.com/players/" + playerId + "/heroes",
                    headers: {
                        'User-Agent': 'request'
                    }
                };
                request(options, function(err, resp, body) {
                    if (err) {
                        console.log("request err: " + err);
                        return;
                    }

                    // scrape the body for heroes played by the playerId
                    $ = cheerio.load(body);
                    var titleText = $("#content-header .content-header-title h1").text();
                    var nameMatch = /(.*?)Heroes/.exec(titleText);
                    if (nameMatch && nameMatch[1]) {
                        data.playerName = nameMatch[1];
                        console.log("playerName: " + data.playerName);
                    }
                    data.heroesPlayed = [];
                    $("article tbody tr").each(function() {
                        var heroName = $(this).find(".hero-link").text();
                        var heroImg = $(this).find(".image-hero").attr('src');
                        if (heroName && heroImg) {
                            data.heroesPlayed.push({name: heroName, image: heroImg});
                        }
                    });
                    console.log("heroesPlayed: " + data.heroesPlayed.length);
                    callback();
                });
            });
            asyncTasks.push(function(callback) {
                // Get the players hero page
                var options = {
                    url: "http://dotabuff.com/heroes/played",
                    headers: {
                        'User-Agent': 'request'
                    }
                };
                request(options, function(err, resp, body) {
                    if (err) {
                        console.log("request err: " + err);
                        return;
                    }

                    // scrape the body for all heroes
                    var heroesAvailable = [];
                    $ = cheerio.load(body);
                    data.heroesAvailable = [];
                    $("article tbody tr").each(function() {
                        var heroName = $(this).find(".hero-link").text();
                        var heroImg = $(this).find(".image-hero").attr('src');
                        if (heroName && heroImg) {
                            data.heroesAvailable.push({name: heroName, image: heroImg});
                        }
                    });
                    console.log("heroesAvailable: " + data.heroesAvailable.length);
                    callback();
                });
            });
            async.parallel(asyncTasks, function() {
                console.log("both callbacks finished, find heroes remaining");
                var heroesRemaining = [];
                for (i = 0; i < data.heroesAvailable.length; i++) {
                    var name = data.heroesAvailable[i].name;
                    var found = false;
                    for (j = 0; !found && j < data.heroesPlayed.length; j++) {
                        if (data.heroesPlayed[j].name == name) {
                            console.log("Found " + name + " in heroesPlayed");
                            found = true;
                        }
                    }
                    if (!found) {
                        console.log("Didn't find " + name + " in heroesPlayed");
                        heroesRemaining.push(data.heroesAvailable[i]);
                    }
                }
                data.heroesRemaining = heroesRemaining;
                console.log("heroesRemaining: " + data.heroesRemaining.length);
                for (i = 0; i < data.heroesRemaining.length; i++) {
                    console.log(data.heroesRemaining[i].name);
                }
                res.send(data);
            });
        } else {
            throw "Bad Dotabuff URL, must link to a player page (e.g. http://dotabuff.com/players/109473826)";
        }
    } catch (err) {
        console.log("caught err");
        if (err && err.message) {
            data.err = err.message;
        } else if (err) {
            data.err = err;
        } else {
            data.err = "Unknown error";
        }
        res.send(data);
        return;
    }
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
