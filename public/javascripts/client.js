$(document).ready(function() {
    var heroesChartData = [{value: 30, color: "#f7464a"},{value: 70, color: "#aeaeae"}];
    var ctx = $("#heroesChart").get(0).getContext("2d");
    var heroesChart = new Chart(ctx).Doughnut(heroesChartData);

    // Update the tracker data
    var updateTracker = function(data) {
        if (data && data.err) {
            alert(data.err);
            return;
        }
        if (data && data.heroesPlayed && data.heroesPlayed.length && data.heroesTotal && data.heroesTotal > 0 && data.heroesRemaining) {
            var numHeroesPlayed = data.heroesPlayed.length;
            var heroPercentage = Math.round((data.heroesPlayed / data.heroesTotal) * 100);
            $("#heroesPlayedText").html(data.heroesPlayed + "/" + data.heroesTotal + " (" + heroPercentage + "%)");

            // Render chart data
            heroesChartData[0].value = data.heroesPlayed;
            heroesChartData[1].value = data.heroesTotal - data.heroesPlayed;
            heroesChart = new Chart(ctx).Doughnut(heroesChartData);
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
