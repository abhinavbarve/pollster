$(document).ready(() => {
    async function getData() {

        await fetch('http://pollster-org.herokuapp.com/database/database190310392199/pollData')
            .then(response => {
                response.json().then((result) => {
                    let poll_data = result[0]
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
                })
            })
    }

    getData()
});  