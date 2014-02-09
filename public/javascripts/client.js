$(document).ready(function() {
    var data = [{value: 30, color: "#f7464a"},{value: 70, color: "#aeaeae"}];
    var ctx = $("#heroesChart").get(0).getContext("2d");
    var myNewChart = new Chart(ctx).Doughnut(data);
});
