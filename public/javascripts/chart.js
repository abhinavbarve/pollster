$(document).ready(() => {
    async function getData() {

        await fetch('https://pollster-org.herokuapp.com/database/database190310392199/pollData')
            .then(response => {
                response.json().then((result) => {
                    let poll_data = result[0].pollData;
                    let id = result[0][1];
                    console.log(id)
                    let ctx = document.getElementById('result-chart').getContext('2d');
                    let resultchart = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: poll_data.options.map((each) => { return each.name }),
                            datasets: [{
                                label: '# of Votes',
                                data: poll_data.options.map((each) => { return each.score }),
                                backgroundColor: poll_data.options.map((each) => { return each.color }),
                                borderWidth: 2
                            }]
                        }
                    });
                    if (poll_data.maker_googleId === id) {
                        document.getElementById("delete-poll").style.display = "block";
                    }
                })
            })
    }

    getData()
});  
