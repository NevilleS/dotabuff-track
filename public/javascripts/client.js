$(document).ready(function() {
    var heroesChartData = [{value: 30, color: "#268bd2"},{value: 70, color: "#93a1a1"}];
    var ctx = $("#heroesChart").get(0).getContext("2d");
    var heroesChart = new Chart(ctx).Doughnut(heroesChartData);

    // Update the tracker data
    var updateTracker = function(data) {
        if (data && data.err) {
            alert(data.err);
            return;
        }
        if (data && data.playerName &&
                data.heroesPlayed && data.heroesPlayed.length !== undefined &&
                data.heroesRemaining && data.heroesRemaining.length !== undefined) {
            $("#playerName").html(data.playerName);        
            var numHeroesPlayed = data.heroesPlayed.length;
            var numHeroesRemaining = data.heroesRemaining.length;
            var numHeroesTotal = numHeroesPlayed + data.heroesRemaining.length;
            var heroPercentage = Math.round((numHeroesPlayed / numHeroesTotal) * 100);
            $("#heroesPlayedText").html(numHeroesPlayed + "/" + numHeroesTotal + " (" + heroPercentage + "%)");

            // Render chart data
            heroesChartData[0].value = numHeroesPlayed;
            heroesChartData[1].value = numHeroesRemaining;
            heroesChart = new Chart(ctx).Doughnut(heroesChartData);

            // Update heroes remaining
            $("#heroesRemainingText").html(numHeroesRemaining);
            if (numHeroesRemaining > 0) {
                // Wipe table and repopulate with data.heroesRemaining
                var heroTable = $("#heroesRemainingTable");
                heroTable.empty();
                for (i = 0; i < data.heroesRemaining.length; i++) {
                    console.log("data.heroesRemaining[" + i + "]: " + data.heroesRemaining[i]);
                    var heroName = data.heroesRemaining[i].name;
                    var heroImage = data.heroesRemaining[i].image;
                    console.log("add " + heroName);
                    heroTable.append("<tr><td class=\"heroText\"><p>" + heroName + "</p><td class=\"heroImage\"><img src=\"" + heroImage + "\" /></td></tr>");
                }
            } else {
                $("#heroesRemaining").fadeOut(3000);
            }
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
