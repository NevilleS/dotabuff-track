var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

/**
 * GET /track?url=example.com
 */
exports.track = function(req, res) {
    var url = req.query.url;
    console.log("Received update url: " + url);
    var data = {
        heroesPlayed: [],
        heroesRemaining: [],
        heroesNoWins: []
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
                        var heroName, heroImg, heroGames, heroWinrate, heroKDA = undefined;

                        // There are three 
                        var tdNum = 0;
                        $(this).children().each(function() {
                            switch(tdNum) {
                                case 0: // heroImg
                                    heroImg = $(this).find(".image-hero").attr('src');
                                    break;
                                case 1: // heroName
                                    heroName = $(this).find(".hero-link").text();
                                    break;
                                case 2: // heroGames
                                    heroGames = parseInt($(this).children().first().text());
                                    break;
                                case 3: // heroWinrate
                                    heroWinrate = parseFloat($(this).children().first().text());
                                    break;
                                case 4: // heroKDA
                                    heroKDA = parseFloat($(this).children().first().text());
                                    break;
                                default:
                            }
                            tdNum += 1;
                        });

                        // Push results into heroesPlayed array
                        console.log([heroName, heroGames, heroWinrate, heroKDA].join(", "));
                        if (heroName !== undefined && heroImg !== undefined && heroGames !== undefined &&
                                heroWinrate !== undefined && heroKDA !== undefined) {
                            console.log("Added " + heroName);
                            var hero = {name: heroName, image: heroImg, games: heroGames, winrate: heroWinrate, KDA: heroKDA};
                            data.heroesPlayed.push(hero);
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
                console.log("Both callbacks finished, find heroes remaining and no wins");
                var heroesRemaining = [];
                var heroesNoWins = [];
                for (i = 0; i < data.heroesAvailable.length; i++) {
                    var name = data.heroesAvailable[i].name;
                    var found = false;
                    var wins = false;
                    for (j = 0; !found && j < data.heroesPlayed.length; j++) {
                        if (data.heroesPlayed[j].name === name) {
                            //console.log("Found " + name + " in heroesPlayed");
                            found = true;
                            if (data.heroesPlayed[j].winrate > 0) {
                                wins = true;
                            }
                        }
                    }
                    if (!found) {
                        //console.log("Didn't find " + name + " in heroesPlayed");
                        heroesRemaining.push(data.heroesAvailable[i]);
                        heroesNoWins.push(data.heroesAvailable[i]);
                    } else if (!wins) {
                        heroesNoWins.push(data.heroesAvailable[i]);
                        //console.log("Found " + name + " in heroesPlayed, but no wins");
                    }
                }
                data.heroesRemaining = heroesRemaining;
                data.heroesNoWins = heroesNoWins;
                console.log("heroesRemaining: " + data.heroesRemaining.length);
                console.log("heroesNoWins: " + data.heroesNoWins.length);

                // Send response
                res.render('track', {data: data});
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
        res.render('track', {data: data});
        return;
    }
};
