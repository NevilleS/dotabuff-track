
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
        heroesTotal: 120,
        heroesRemaining: []
    };

    // request dotabuff data
    var dotabuffMatch = /^(?:http:\/\/)?dotabuff\.com\/players\/(\d+)$/.exec(url);
    try {
        if (dotabuffMatch && dotabuffMatch[1]) {
            var playerId = dotabuffMatch[1];
            console.log("Parsed dotabuff url, playerId: " + playerId);

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
                console.log("titleText: " + titleText);
                data.heroesPlayed = [];
                $("article tbody tr").each(function() {
                    var heroName = $(this).find(".hero-link").text();
                    var heroImg = $(this).find(".image-hero").attr('src');
                    if (heroName && heroImg) {
                        data.heroesPlayed.push({name: heroName, image: heroImg});
                    }
                });
                console.log("heroesPlayed: " + data.heroesPlayed.length);
                res.send(data);
            });
            options.url = "http://dotabuff.com/heroes/played";
            /*
            request(options, function(err, resp, body) {
                if (err) {
                    console.log("request err: " + err);
                    return;
                }

                // scrape the body for all heroes
                var heroesAvailable = [];
                $ = cheerio.load(body);
                data.heroesPlayed = [];
                $("article tbody tr").each(function() {
                    var heroName = $(this).find(".hero-link").text();
                    var heroImg = $(this).find(".image-hero").attr('src');
                    if (heroName && heroImg) {
                        heroesAvailable.push({name: heroName, image: heroImg});
                    }
                });
                console.log("heroesAvailable: " + heroesAvailable.length);
            });
            */
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
