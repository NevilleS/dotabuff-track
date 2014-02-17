$(document).ready(function() {
    // Update the tracker data
    var updateTracker = function(data) {
        if (data && data.err) {
            alert(data.err);
            return;
        }
        if (data && data.playerName &&
                data.heroesPlayed && data.heroesPlayed.length !== undefined &&
                data.heroesRemaining && data.heroesRemaining.length !== undefined &&
                data.heroesNoWins && data.heroesNoWins.length !== undefined) {
            $("#playerName").html(data.playerName);        

            // Render hero plays data
            var numHeroesPlayed = data.heroesPlayed.length;
            var numHeroesRemaining = data.heroesRemaining.length;
            var numHeroesTotal = numHeroesPlayed + data.heroesRemaining.length;
            var heroPlayedPercentage = Math.round((numHeroesPlayed / numHeroesTotal) * 100);
            $("#heroesPlayedText").html(numHeroesPlayed + "/" + numHeroesTotal + " (" + heroPlayedPercentage + "%)");
            var heroesPlayedChartData = [
                {value: numHeroesPlayed, color: "#268bd2"},
                {value: numHeroesRemaining, color: "#93a1a1"}
            ];
            var ctx = $("#heroesPlayedChart").get(0).getContext("2d");
            var heroesPlayedChart = new Chart(ctx).Doughnut(heroesPlayedChartData);

            // Update heroes remaining
            $("#heroesRemainingText").html(numHeroesRemaining);
            if (numHeroesRemaining > 0) {
                // Wipe table and repopulate with data.heroesRemaining
                var heroesRemainingTable = $("#heroesRemainingTable");
                heroesRemainingTable.empty();
                for (i = 0; i < data.heroesRemaining.length; i++) {
                    console.log("data.heroesRemaining[" + i + "]: " + data.heroesRemaining[i]);
                    var heroName = data.heroesRemaining[i].name;
                    var heroImage = data.heroesRemaining[i].image;
                    console.log("add " + heroName);
                    heroesRemainingTable.append("<tr><td class=\"heroText\"><p>" + heroName + "</p><td class=\"heroImage\"><img src=\"" + heroImage + "\" /></td></tr>");
                }
            } else {
                $("#heroesRemaining").fadeOut(3000);
            }

            // Render hero wins chart data
            var numHeroesNoWins = data.heroesNoWins.length;
            var numHeroesWon = numHeroesTotal - numHeroesNoWins;
            var heroesWonPercentage = Math.round((numHeroesWon / numHeroesTotal) * 100);
            $("#heroesWonText").html(numHeroesWon + "/" + numHeroesTotal + " (" + heroesWonPercentage + "%)");
            var heroesWonChartData = [
                {value: numHeroesWon, color: "#268bd2"},
                {value: numHeroesNoWins, color: "#93a1a1"}
            ];
            var ctx = $("#heroesWonChart").get(0).getContext("2d");
            var heroesWonChart = new Chart(ctx).Doughnut(heroesWonChartData);

            // Update heroes no wins 
            $("#heroesNoWinsText").html(numHeroesNoWins);
            if (numHeroesNoWins > 0) {
                // Wipe table and repopulate with data.heroesNoWins
                var heroesNoWinsTable = $("#heroesNoWinsTable");
                heroesNoWinsTable.empty();
                for (i = 0; i < data.heroesNoWins.length; i++) {
                    console.log("data.heroesNoWins[" + i + "]: " + data.heroesNoWins[i]);
                    var heroName = data.heroesNoWins[i].name;
                    var heroImage = data.heroesNoWins[i].image;
                    console.log("add " + heroName);
                    heroesNoWinsTable.append("<tr><td class=\"heroText\"><p>" + heroName + "</p><td class=\"heroImage\"><img src=\"" + heroImage + "\" /></td></tr>");
                }
            } else {
                $("#heroesNoWins").fadeOut(3000);
            }

            // Show the tracker content
            $("#introContent").hide();
            $("#trackerContent").show();
        } else {
            $("#introContent").show();
            $("#trackerContent").hide();
        }
    }

    // Listen to changes to url input on navbar
    $("#urlInput").on('keyup', function(event) {
        if (event.keyCode === 13) {
            var params = { url: $(this).val() }; // pass the params to backend
            $.get('/track', params, function(data) {
                updateTracker(data);
            });
            event.preventDefault();
        }
    });
});
